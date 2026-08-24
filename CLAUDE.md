@frontend/AGENTS.md

# BCSK Platform

Two independently deployable projects in one repository.

```
code/
  backend/    NestJS API   · owns Prisma, every secret, all business logic · :4000
  frontend/   Next.js web  · UI only                                        · :3000
  docs/       shared documentation
```

Each project carries its own `package.json` and lockfile and installs independently. There is
no root manifest and no workspace linking them — treat them as two repositories that happen to
share a directory.

> **The frontend/backend split is complete.** All four surfaces read the backend through the
> typed SDK in `frontend/src/services/`; the web app has no database client, no `JWT_SECRET` and
> no Prisma dependency. `docs/PHASE-D-ADMIN-HANDOFF.md` is kept as the record of the last phase,
> not as a task.

**Read these before non-trivial work. They are the source of truth; the artifacts are copies.**

- **[docs/ARCHITECTURE-SEPARATION.md](docs/ARCHITECTURE-SEPARATION.md)** — the split.
  **Backend is complete** (117 endpoints) and so are mobile auth and the deployment files.
  **Phases A-G are done:** all four surfaces read the API, and the transitional Prisma layer in
  the frontend has been deleted. Phase H (real-time) is designed, not built.
- **[docs/CODEBASE-REVIEW.md](docs/CODEBASE-REVIEW.md)** — security and performance findings
  (`SEC-n`, `BUG-n`, `PERF-n`, `QUAL-n`) with status. All of these were fixed in the pre-split
  code and **must survive the migration** — that is risk R1.
- **[docs/CONTENT-GAP-ANALYSIS.md](docs/CONTENT-GAP-ANALYSIS.md)** — divergence from the school's
  content spec (`GAP-1`…`GAP-20`). **Live money gaps:** tuition fees understated by ₩100–150k per
  class; the site names Hana Bank where the spec says Woori.

## Where code goes

| | backend | frontend |
|---|---|---|
| Prisma / SQL | **yes, exclusively** | **never** — it has no database client |
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

**How the frontend reads data**

Every page and Server Action goes through `frontend/src/services/index.ts` — a typed SDK grouped
by domain over `api-client.ts`, the one place that forwards the session cookie, unwraps the
`{ data }` envelope, and turns a backend `AppError` into a typed `ApiError`. Response shapes are
hand-written in `services/types.ts` on purpose: the contract is narrower than the tables.

Three things the API boundary changes, all of which have bitten:

- **Dates are ISO strings, not `Date`.** Use `formatDate` / `isoAttr` / `dayOfMonth` from
  `@/lib/dates`; `.toLocaleDateString()` on an API value is a runtime error.
- **Overriding an optional relation needs `Omit`**, not an intersection:
  `Omit<T.Payment, "payer"> & { payer: X }`.
- **Every export in a `"use server"` file must be `async`.** An arrow const returning a promise
  compiles and then 500s with an opaque *"Ecmascript file had an error"*.

When a page needs a field an endpoint does not return, **widen the endpoint explicitly** — never
by re-including a whole row. Several `include: true`s were shipping `passwordHash` to the web
tier before Phase D narrowed them.

## Commands

**There is no root `package.json`.** `backend/` and `frontend/` are two independent npm
projects, each with its own manifest and lockfile; every command runs against one of them.
Nothing orchestrates both, so running the full stack means two terminals.

**`npm --prefix <dir> run <script>` works, but `npm --prefix <dir> install` does not** — with no
root manifest it reads `package.json` from the *current* directory and exits ENOENT. Installing
means `cd` into the project.

```bash
# backend — NestJS API on :4000
cd backend && npm install
npm --prefix backend run start:dev     # watch mode
npm --prefix backend run build
npm --prefix backend run typecheck
npm --prefix backend run test
npm --prefix backend run db:migrate    # prisma migrate deploy
npm --prefix backend run db:seed
```

```bash
# frontend — Next.js web on :3000
cd frontend && npm install
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run typecheck
npm --prefix frontend run test
npm --prefix frontend run test:e2e     # playwright, needs both services running
```

`npm --prefix backend run lint` still fails outright — the backend has no `eslint.config.js`.

Backend API docs at `http://localhost:4000/api/v1/docs` (Swagger, generated from the running app).

**The API path is configuration, not a constant.** `API_PREFIX` and `API_VERSION` in
`backend/.env` build the global prefix via `src/config/api.ts`; blanks fall back to `api/v1` and
stray slashes are trimmed. Never hard-code `/api/v1` — import `apiBasePath()` / `apiBaseUrl()`.
Two places repeat the value because they cannot read the .env: each Dockerfile's own
`HEALTHCHECK` (`backend/Dockerfile`, `frontend/Dockerfile`) and `frontend/.env`, which must
match. There is no Caddyfile or `docker-compose.yml` any more — deployment moved off that stack
(23 Aug 2026); if that route ever comes back, the API path is still the same variable names
here, not a new constant.

## Stack

Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind 4 · Prisma 6 · Neon Postgres ·
`jose` JWT sessions · pdfkit · nodemailer · Toss Payments.

## Architecture in one paragraph

Two deployables. The NestJS API owns Prisma, every secret and all business logic; the Next.js app
renders. Server Components read through the typed SDK, and mutations are Server Actions co-located
with their page, each calling a single SDK method. File bytes, PDFs, CSV and the Toss redirect are
backend routes reached through the rewrites in `next.config.ts`, so stored `/api/files/...` URLs
stay valid. The four "surfaces" are route groups (`(public)/`, `classroom/(app)/`, `office/(app)/`,
`admin/(app)/`) sharing one session cookie. Access control is a guard function at the top of each
layout and each action — defence in depth, since the API enforces independently; `src/proxy.ts`
exists only for security headers.

## Conventions to follow

- **Mutations are `actions.ts` files** co-located with the page, marked `"use server"`, returning
  `{ ok?: boolean; error?: string } | null` and driven by `useActionState`. Match the existing
  shape; do not introduce API routes for mutations.
- **An action guards, calls one SDK method, and revalidates.** Wrap the call in `toActionError(e)`
  so a 4xx becomes a message on the form and a 5xx still reaches the error boundary.
- **Every server action still re-checks authorisation.** Server Actions compile to public HTTP
  endpoints — a caller can pass any argument. The guard here renders the 403 boundary; the API
  refuses the call regardless.
- **Never trust an ID, price, or flag that arrives from the client.** The backend reads the
  authoritative record (`FeeConfig`, the stored `ApplicationForm`, the verified session). See SEC-3.
- **Do not write audit rows from the frontend** — `audit()` no longer exists there. Each backend
  admin operation records its own, in the same transaction as the write.
- **Multi-step writes belong in a backend `$transaction`.** See finding BUG-2.
- Path alias is `@/*` → `./src/*`.
- Domain constants live in `src/lib/constants.ts`; DB columns are `String` with the valid values in
  a schema comment (a known weakness — finding QUAL-1).

## Before a commit

Both projects must pass, and there is no root script to do it in one go:

```bash
npm --prefix backend run typecheck && npm --prefix backend run test
npm --prefix frontend run typecheck && npm --prefix frontend run test
```

See **Testing** below.

## Environment

**One `.env` per project. Neither has a `.env.local`** — those were deleted on 22 Aug 2026 after
`.env.production.local` was found overriding good values with empty ones and pointing a production
build at the wrong database. **Do not run `vercel env pull`.**

- `backend/.env` — `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled, required by Prisma Migrate),
  `JWT_SECRET`, Toss, SMTP, Cloudinary, `CORS_ORIGINS`.
- `frontend/.env` — `BACKEND_API_URL` and `NEXT_PUBLIC_*` only. **No secret, no database
  credential.** The build must succeed with neither present; that is the standing acceptance test.

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
`mustChangePassword: true`. Rotate with `npm --prefix backend run db:rotate-passwords -- --apply` (dry-run without
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
HTML without it. `src/proxy.ts` sets a nonce-based CSP and the other security headers; if you
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
npm --prefix backend run test    # Vitest — 40 (env, tokens, permissions, dashboard counts)
npm --prefix frontend run test   # Vitest — 31 (fees, permissions, sanitiser)
npm --prefix frontend run test:e2e   # Playwright — 14 E2E, needs both services and a seeded database
```

Unit tests are database-free. E2E writes real rows — the admission-funnel test leaves an
`E2E Applicant ...` application behind; clean it up when running against a live database. CI
(`.github/workflows/ci.yml`) runs typecheck, lint, unit tests and build, plus E2E against a
Postgres service container.

`npm --prefix frontend run lint` reports **28 pre-existing errors** (mostly unescaped
apostrophes in JSX). Don't let that number grow; it is not yet zero.

**Do not set `RECAPTCHA_SECRET_KEY`** without first fixing SEC-9. No client-side reCAPTCHA widget
exists, so `recaptchaToken` is never submitted; setting the secret makes `verifyRecaptcha` reject
every application and contact submission.
