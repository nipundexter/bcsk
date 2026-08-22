@AGENTS.md

# BCSK Platform

Two independently deployable projects in one repository.

```
code/
  backend/    NestJS API   · owns Prisma, every secret, all business logic · :4000
  frontend/   Next.js web  · UI only                                        · :3000
  docs/       shared documentation
```

> **▶ ACTIVE TASK: migrate the 32 admin files off Prisma.**
> Start at **[docs/PHASE-D-ADMIN-HANDOFF.md](docs/PHASE-D-ADMIN-HANDOFF.md)** — it has the
> file-by-file SDK mapping, four known gotchas, and the definition of done. Public, classroom
> and office are already migrated and verified; admin is the last piece.

**Read these before non-trivial work. They are the source of truth; the artifacts are copies.**

- **[docs/ARCHITECTURE-SEPARATION.md](docs/ARCHITECTURE-SEPARATION.md)** — the split.
  **Backend is complete** (116 endpoints) and so are mobile auth and the deployment files.
  **Phase C/D: public, classroom and office are migrated and verified; the 32 admin files are
  the only ones still reading Prisma.** Migrate them onto `@/services` — the recipe and the
  four gotchas found doing the other three surfaces are in the plan.
- **[docs/CODEBASE-REVIEW.md](docs/CODEBASE-REVIEW.md)** — security and performance findings
  (`SEC-n`, `BUG-n`, `PERF-n`, `QUAL-n`) with status. All of these were fixed in the pre-split
  code and **must survive the migration** — that is risk R1.
- **[docs/CONTENT-GAP-ANALYSIS.md](docs/CONTENT-GAP-ANALYSIS.md)** — divergence from the school's
  content spec (`GAP-1`…`GAP-20`). **Live money gaps:** tuition fees understated by ₩100–150k per
  class; the site names Hana Bank where the spec says Woori.

## Where code goes

| | backend | frontend |
|---|---|---|
| Prisma / SQL | **yes, exclusively** | transitional only — see below |
| Business rules, fees, auth | **yes** | never |
| Secrets | **yes** | never — `NEXT_PUBLIC_*` ships to the browser |
| Rendering, forms, routing | no | **yes** |

**Backend conventions**

- A **service** takes plain arguments plus an `Actor`, returns plain data, throws `AppError`.
  It must never see a request, cookie or header.
- A **controller** validates with zod, calls one service method, returns its value.
  `EnvelopeInterceptor` wraps it as `{ data }`; a `Page` becomes `{ data, meta.nextCursor }`.
- **`AuthGuard` is global** — every route needs authentication unless marked `@Public()`. Use
  `@RequirePermission("x")` for capabilities. Forgetting auth yields a *locked* route, not an
  open one (risk R10).
- **`AppErrorFilter` is the only place** a thrown value becomes a status code.
- Permissions are served from `GET /auth/me`; never duplicate the map in the frontend.

**Transitional — expires at the end of Phase D**

The frontend still queries the database directly for pages not yet repointed. `frontend/package.json`
has a `_transitional` block listing every dependency, file and env var scheduled for deletion.
`frontend/prisma/schema.prisma` is a **derived copy** — the backend owns the schema; run
`npm run check:schema` to detect drift. **Write no new frontend code against any of it.**

## Commands

```bash
npm run install:all      # both projects
npm run dev              # api :4000 and web :3000 together
npm run dev:api          # backend only
npm run build            # both
npm run typecheck        # both
npm run test             # both
npm run test:e2e         # playwright, web surface
npm run db:migrate       # prisma migrate deploy (backend)
npm run db:seed
```

Backend API docs at `http://localhost:4000/api/v1/docs` (Swagger, generated from the running app).

**The API path is configuration, not a constant.** `API_PREFIX` and `API_VERSION` in
`backend/.env` build the global prefix via `src/config/api.ts`; blanks fall back to `api/v1` and
stray slashes are trimmed. Never hard-code `/api/v1` — import `apiBasePath()` / `apiBaseUrl()`.
Three places repeat the value because they cannot read the .env: the Caddyfile, the Docker
healthcheck (both derive it from the same variable names), and `frontend/.env`, which must match.

## Stack

Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind 4 · Prisma 6 · Neon Postgres ·
`jose` JWT sessions · pdfkit · nodemailer · Toss Payments.

## Architecture in one paragraph

A server-first modular monolith. **No REST layer** — Server Components read Prisma directly, and
mutations are Server Actions co-located with their page. The six `route.ts` handlers exist only
where HTTP semantics are required (file bytes, PDFs, CSV, the Toss redirect). The four "surfaces"
are route groups (`(public)/`, `classroom/(app)/`, `office/(app)/`, `admin/(app)/`), not separate
deployments: they share one Prisma client, one session cookie, and one database. There is **no
`middleware.ts`** — access control is a guard function called at the top of each layout and each
action.

## Conventions to follow

- **Mutations are `actions.ts` files** co-located with the page, marked `"use server"`, returning
  `{ ok?: boolean; error?: string } | null` and driven by `useActionState`. Match the existing
  shape; do not introduce API routes for mutations.
- **Every server action must re-derive the session and re-check authorisation from its own
  arguments.** Server Actions compile to public HTTP endpoints — a caller can pass any argument.
  `ownSession()` in `src/app/office/(app)/classes/[id]/actions.ts` is the reference pattern.
- **Never trust an ID, price, or flag that arrives from the client.** Read the authoritative record
  (`FeeConfig`, the stored `ApplicationForm`, the verified session) instead. See finding SEC-3.
- **Admin mutations call `audit(...)`** after the write, then `revalidatePath(...)`.
- **Multi-step writes belong in `db.$transaction`.** See finding BUG-2.
- Path alias is `@/*` → `./src/*`.
- Domain constants live in `src/lib/constants.ts`; DB columns are `String` with the valid values in
  a schema comment (a known weakness — finding QUAL-1).

## Commands

```bash
npm run dev                  # dev server
npm run build                # production build
npm run lint                 # eslint
npm run typecheck            # tsc --noEmit
npm run test                 # vitest unit tests
npm run test:e2e             # playwright end-to-end
npx prisma migrate deploy    # apply migrations
npx prisma db seed           # seed content + demo accounts
```

Run `npm run typecheck && npm run test` before any commit; see **Testing** below.

## Environment

**One `.env` per project. Neither has a `.env.local`** — those were deleted on 22 Aug 2026 after
`.env.production.local` was found overriding good values with empty ones and pointing a production
build at the wrong database. **Do not run `vercel env pull`.**

- `backend/.env` — `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled, required by Prisma Migrate),
  `JWT_SECRET`, Toss, SMTP, Cloudinary, `CORS_ORIGINS`.
- `frontend/.env` — `BACKEND_API_URL`, `NEXT_PUBLIC_*` only, plus the transitional database vars.

**Read every env var through `requiredSecret` / `intFromEnv`, never `process.env.X ?? fallback`.**
`??` does not fire on the empty string. This has caused four separate defects here —
`JWT_SECRET`, `SESSION_HOURS`, `PORT`, and a Playwright `baseURL` — so treat it as a hard rule,
not a preference. `backend/test/regressions.test.ts` guards it.

Database is Neon Postgres, project `ep-blue-mouse-a13ikyet` (ap-southeast-1), database `bcsk`.

## Known-critical, unfixed

**SEC-1 is fixed in code but NOT in production.** `src/lib/env.ts` `requiredSecret()` now refuses to
boot without a valid `JWT_SECRET`. The Vercel project still has it blank, so **`JWT_SECRET` must be
set in Vercel before the next deploy or the build will fail** — deliberately. Read all env through
`requiredSecret` / `intFromEnv`, never `process.env.X ?? fallback`: `??` does not fire on the empty
string, which is how both `JWT_SECRET` and `SESSION_HOURS` silently broke in production.

**SEC-2 is fixed.** Demo hints are gated by `isDemoMode()` (needs `NEXT_PUBLIC_DEMO_MODE=1` and is
always false in production). All 12 seeded accounts were rotated and carry `mustChangePassword`,
enforced inside every `require*` guard. Any code path that issues a credential on someone's behalf
— `createUser`, `resetUserPassword`, `activateEnrollmentForApplication`, the seed — **must** set
`mustChangePassword: true`. Rotate with `npm run db:rotate-passwords -- --apply` (dry-run without
`--apply`).

**SEC-2.1 is fixed in handling, not in config.** `PaymentConfigError` separates our
misconfiguration from a customer's declined card; a config error must leave the Payment row
`PENDING`, never `FAILED`. `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` are still blank in Vercel, so card
payment is disabled in production and the payment page shows bank transfer only.

**SEC-3 / SEC-7 / SEC-7.1 fixed.** The BCSK discount lives in `ApplicationForm.isBcskStudent`;
`computeApplicationFee(app)` takes no override argument — never reintroduce one. The payment step
requires a signed capability token (`src/lib/payment-token.ts`); every payment action calls
`assertPaymentToken` before touching money. The Toss callback is idempotent: replays are answered
from stored state, `gatewayTxnId` is uniquely indexed, and the FAILED write is scoped to
`status: "PENDING"`.

**SEC-4 / SEC-4.1 / SEC-5 / SEC-5.1 fixed.** `src/lib/permissions.ts` is the single source of truth
for admin authorisation. **Every admin action and admin API route must call
`requirePermission("<capability>")`, never bare `requireAdmin()`** — the latter accepts all three
admin roles and is only correct for the shell layout and the shared dashboard. The sidebar comes
from `navFor(role)` on the same map; add a module by adding a permission there and nowhere else.
`/api/files/[...path]` is deny-by-default — a folder with no entry in its `POLICY` table is a 403,
so a new upload folder is inert until you write a policy for it.

**BUG-1 / BUG-2 fixed.** `activateEnrollmentForApplication` commits user, profile, enrolments,
payment adoption (`payerUserId`) and application status in one `$transaction`; the credentials
email is sent after it commits and cannot fail the activation.

**SEC-6 / SEC-8 / SEC-9 fixed.** `renderMarkdown` sanitises through DOMPurify — never render CMS
HTML without it. `src/middleware.ts` sets a nonce-based CSP and the other security headers; if you
add an external script or API origin it must be allowlisted there or it will be blocked. Rate
limiting is DB-backed in `src/lib/rate-limit.ts` (in-memory does not work on serverless) and fails
open by design. reCAPTCHA now has a real widget and fails closed; the two keys must both be set or
both be absent — half-configured throws.

**PERF-1 / PERF-2 / PERF-3 fixed.** 38 indexes added. `getSession` is wrapped in React `cache()`.
No `await` inside a write loop remains — use `createMany` or one `$transaction([...])`.

**PERF-4 deferred by agreement (after stability). Decision: Cloudinary, not S3** — credentials are
already in `.env`. Plan is in the review; authorisation stays in `/api/files`, which should redirect
to a signed URL rather than stream bytes.

## Testing

```bash
npm run test         # Vitest — 61 unit tests (fees, permissions, env, tokens, sanitiser)
npm run test:e2e     # Playwright — 14 E2E, boots its own dev server
```

Unit tests mock Prisma and must stay database-free. `vitest.config.ts` injects a `JWT_SECRET`
because `src/lib/env.ts` throws without one. E2E needs a seeded database. CI
(`.github/workflows/ci.yml`) runs typecheck, lint, unit tests and build, plus E2E against a
Postgres service container.

Lint currently reports **29 pre-existing errors** (mostly unescaped apostrophes in JSX) in files
untouched by the security work. Don't let that number grow; it is not yet zero.

**Do not set `RECAPTCHA_SECRET_KEY`** without first fixing SEC-9. No client-side reCAPTCHA widget
exists, so `recaptchaToken` is never submitted; setting the secret makes `verifyRecaptcha` reject
every application and contact submission.
