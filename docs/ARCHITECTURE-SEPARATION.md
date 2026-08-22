# BCSK — API-First Separation Plan

**Status:** Phases A, B, E, F, G complete · **Phase C/D: public, classroom and office done; admin remaining** · Phase H designed
**Companions:** [CODEBASE-REVIEW.md](CODEBASE-REVIEW.md) · [CONTENT-GAP-ANALYSIS.md](CONTENT-GAP-ANALYSIS.md)

## Decisions taken

| # | Decision | Choice |
|---|---|---|
| D1 | Separation shape | ~~Modular monolith~~ → **REVISED 22 Aug: two separate projects.** `code/backend` + `code/frontend`, independently deployable — the backend is destined for its own server |
| D2 | Backend runtime | ~~Next Route Handlers~~ → **REVISED: NestJS** (`code/backend`) |
| D3 | API style | **REST** (see rationale below) |
| D4 | Auth | **Hybrid** — httpOnly cookie for web, bearer + refresh for mobile |
| D5 | Real-time | **Phased** — polling now; push → presence → chat later |
| D6 | Hosting | DigitalOcean droplet |
| D7 | File storage | Cloudinary (credentials already in `.env`) |

### Why REST, not GraphQL

The clients are a server-rendered web app and two mobile apps consuming a stable, well-known
domain. GraphQL earns its complexity when clients need to shape queries the server can't
anticipate; here they don't. REST also keeps the mobile HTTP cache, CDN behaviour and error
semantics conventional, and lets `/api/v1` handlers stay ten-line wrappers.

### Why a layer boundary, not two repos

Every requirement in the brief — API-first, reusable for web and mobile, clean architecture,
reusable business logic, DRY, secure — is satisfied by extracting a framework-free service layer.
Splitting into two deployed services additionally requires rewriting data fetching in **52 pages**,
adding a network hop to every render, and running a second process on the droplet. For a school of
this size that cost buys nothing.

**This plan is also the prerequisite for a full split.** Once services exist, moving them into a
separate process is mechanical. We are not foreclosing that option — we are sequencing it.

---

## Target architecture

```
                     ┌──────────────────────────────────────────────┐
   Web browser ────▶ │  Next.js app (single deploy, DO droplet)     │
                     │                                              │
                     │  ┌────────────────────────────────────────┐  │
                     │  │ Delivery layer                         │  │
                     │  │  · RSC pages   (in-process call)       │  │
   Mobile app ─HTTP──┼─▶│  · Server Actions (in-process call)    │  │
   (iOS/Android)     │  │  · /api/v1/*   (HTTP, mobile + 3rd)    │  │
                     │  └──────────────┬─────────────────────────┘  │
                     │                 │ same services, one path    │
                     │  ┌──────────────▼─────────────────────────┐  │
                     │  │ src/server/  — FRAMEWORK-FREE CORE     │  │
                     │  │  modules/ auth admission payment cms   │  │
                     │  │           user classroom office file   │  │
                     │  │  shared/  errors result pagination     │  │
                     │  └──────────────┬─────────────────────────┘  │
                     │  ┌──────────────▼─────────────────────────┐  │
                     │  │ src/lib/ — infrastructure              │  │
                     │  │  db · logger · env · permissions · pdf │  │
                     │  │  email · cloudinary · rate-limit       │  │
                     │  └──────────────┬─────────────────────────┘  │
                     └─────────────────┼────────────────────────────┘
                                       ▼
                            Prisma → Postgres (Neon)
                            Cloudinary (media)
```

**The load-bearing rule:** nothing in `src/server/**` may import from `next/*`. That single
constraint is what makes the core portable — to a separate service later, to a worker process, to a
test harness with no HTTP at all. It is enforced by lint, not by discipline (see A4).

Web pays **no network hop**: RSC and Server Actions call services as functions. Mobile gets the
same behaviour over HTTP. There is exactly one implementation of every rule.

---

## Folder structure (final)

```
src/
  server/                          # framework-free core — NO next/* imports
    modules/
      auth/
        auth.service.ts            # verifyCredentials, changePassword, issueTokens
        auth.tokens.ts             # access/refresh issue + rotate
        auth.schema.ts             # zod — shared by actions AND route handlers
        auth.types.ts
      user/
        user.service.ts            # create, reset, activate/deactivate, list
        user.schema.ts
      admission/
        admission.service.ts       # submit, review, decide, activate enrolment
        admission.schema.ts
      payment/
        payment.service.ts         # fees, orders, verify, refund, receipts
        payment.gateway.toss.ts    # gateway adapter behind an interface
        payment.schema.ts
      cms/
        cms.service.ts             # pages, news, gallery, corner, governing
        cms.schema.ts
      classroom/
        classroom.service.ts       # dashboard, assignments, results, attendance
      office/
        office.service.ts          # classes, grading, attendance, questions
      file/
        file.service.ts            # upload, authorise, signed delivery URL
    shared/
      errors.ts                    # AppError taxonomy → HTTP mapping
      result.ts                    # Result<T> for expected failures
      pagination.ts                # cursor helpers
      actor.ts                     # Actor type — who is acting, transport-agnostic
  lib/                             # infrastructure adapters (may import next/*)
    db.ts  logger.ts  env.ts  permissions.ts  pdf.ts  email.ts
    cloudinary.ts  rate-limit.ts  recaptcha.ts  i18n/
  app/
    api/
      v1/                          # HTTP surface for mobile and third parties
        auth/{login,refresh,logout,me}/route.ts
        admissions/...
        payments/...
        cms/...
        classroom/...
        files/...
        _lib/
          handler.ts               # withApi() — auth, validate, map errors
          respond.ts               # envelope helpers
    (public)/ admin/ classroom/ office/    # web surface — unchanged routes
  components/                      # presentational
  features/                        # web feature grouping (forms, view models)
    admission/  payment/  auth/
tests/
  unit/        # services, pure logic
  contract/    # /api/v1 request/response shape
  e2e/         # Playwright, web surface
```

### Rules

1. `src/server/**` imports nothing from `next/*`. Lint-enforced.
2. Services receive an explicit `Actor`; they never read cookies or headers.
3. A route handler and a Server Action calling the same operation **must** call the same service
   method with the same zod schema. No parallel validation.
4. Prisma is used only in `src/server/**` and `src/lib/db.ts` — never in a page or component.
5. No circular dependencies between modules; shared concepts move to `server/shared/`.

---

## API design

### Conventions

- Base path `/api/v1`. Breaking changes get `/api/v2`; the old version stays until mobile adoption
  is confirmed via a `X-Client-Version` header.
- Success: `{ "data": … }` — plus `{ "meta": { "nextCursor": … } }` on collections.
- Failure: `{ "error": { "code": "SCREAMING_SNAKE", "message": "human readable", "details"?: … } }`.
- `code` is stable and machine-readable; `message` is for humans and may change.

| Status | Used for |
|---|---|
| 200 / 201 / 204 | success |
| 400 `VALIDATION_FAILED` | zod rejected the body; `details` carries field errors |
| 401 `UNAUTHENTICATED` | missing or invalid credentials |
| 403 `FORBIDDEN` | authenticated but lacks the capability |
| 404 `NOT_FOUND` | absent, or hidden deliberately |
| 409 `CONFLICT` | duplicate payment, already-activated application |
| 429 `RATE_LIMITED` | with `Retry-After` |
| 500 `INTERNAL` | never leaks internals; correlation id logged |

### Endpoint map (v1)

```
POST   /api/v1/auth/login              → { accessToken, refreshToken, user }
POST   /api/v1/auth/refresh            → rotate; old refresh token revoked
POST   /api/v1/auth/logout             → revoke refresh token
GET    /api/v1/auth/me                 → current actor + permissions
POST   /api/v1/auth/change-password

GET    /api/v1/cms/pages/:slug?lang=   → published content (public)
GET    /api/v1/cms/news                → paginated (public)
GET    /api/v1/cms/gallery             → albums + items (public)
GET    /api/v1/cms/teachers            → public teacher directory
GET    /api/v1/cms/fees                → fee table (public)

POST   /api/v1/admissions              → submit; returns { id, paymentToken }
GET    /api/v1/admissions/:id          → requires payment token or staff capability
GET    /api/v1/admissions              → staff, paginated, filterable

GET    /api/v1/payments/quote/:appId   → server-computed amount (never client-supplied)
POST   /api/v1/payments/card-order     → Idempotency-Key required
POST   /api/v1/payments/bank-transfer  → multipart receipt upload
POST   /api/v1/payments/:id/verify     → staff, payments:verify
GET    /api/v1/payments/:id/receipt    → PDF stream

GET    /api/v1/classroom/dashboard     → student
GET    /api/v1/classroom/assignments
POST   /api/v1/classroom/assignments/:id/submit
GET    /api/v1/classroom/results | attendance | payments | documents

GET    /api/v1/office/classes          → teacher
POST   /api/v1/office/classes/:id/attendance
POST   /api/v1/office/assignments/:id/grade

POST   /api/v1/files                   → upload → Cloudinary
GET    /api/v1/files/:id               → 302 to a signed, expiring URL

POST   /api/v1/devices                 → register push token (phase H)
```

### Sample endpoint — the whole pattern in one file

```ts
// src/app/api/v1/payments/card-order/route.ts
import { withApi } from "../../_lib/handler";
import { cardOrderSchema } from "@/server/modules/payment/payment.schema";
import { paymentService } from "@/server/modules/payment/payment.service";

export const POST = withApi({
  schema: cardOrderSchema,
  idempotent: true,               // requires an Idempotency-Key header
  rateLimit: "payment",
  handler: async ({ input, actor }) =>
    paymentService.createCardOrder(input, actor),
});
```

`withApi` resolves the actor from cookie **or** bearer token, applies rate limiting, validates with
the shared schema, calls the service, and maps `AppError` to the status table above. The handler
body is one line because every cross-cutting concern lives in the wrapper — and the *same*
`paymentService.createCardOrder` is what the web Server Action calls.

```ts
// src/server/modules/payment/payment.service.ts  (excerpt — no next/* imports)
export const paymentService = {
  async createCardOrder(input: CardOrderInput, actor: Actor) {
    const app = await db.applicationForm.findUnique({ where: { id: input.applicationId } });
    if (!app) throw new AppError("NOT_FOUND", "Application not found");

    // SEC-7: capability, not identity — the applicant is anonymous by design.
    await assertPaymentToken(input.paymentToken, app.id);

    // SEC-3: the amount is derived from the record, never from the request.
    const fee = await computeApplicationFee(app);

    if (app.payments?.some((p) => OPEN_STATUSES.includes(p.status)))
      throw new AppError("CONFLICT", "A payment for this application is already in progress");

    return db.payment.create({ data: { /* … */ amount: fee.amount } });
  },
};
```

### Sample frontend integration

```ts
// src/features/payment/payment.api.ts — the only place fetch() appears for payments
import { api } from "@/features/shared/api-client";
import type { CardOrder } from "@/server/modules/payment/payment.types";

export const createCardOrder = (applicationId: number, paymentToken: string) =>
  api.post<CardOrder>("/payments/card-order", { applicationId, paymentToken });
```

```ts
// src/features/shared/api-client.ts
// One client: base URL, envelope unwrapping, error normalisation, token refresh.
// Web sends cookies; mobile injects a bearer token via the same client.
export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
  onUnauthorised: refreshOnce,
});
```

Note the web app keeps calling services **directly** from RSC — `api-client` exists for client
components and for the mobile app, not to add a network hop to server rendering.

---

## Auth design (hybrid)

| | Web | Mobile |
|---|---|---|
| Credential | httpOnly `bcsk_session` cookie, SameSite=Lax | `Authorization: Bearer <access>` |
| Lifetime | 8h (`SESSION_HOURS`) | access 15 min · refresh 30 days |
| Storage | browser cookie jar, JS-unreachable | secure keystore / keychain |
| Revocation | `active` flag checked per request | refresh token row revoked in DB |

- **New model** `RefreshToken { id, userId, tokenHash, deviceId, expiresAt, revokedAt, lastUsedAt }`.
  Stored **hashed** — a database leak must not yield usable tokens.
- **Rotation on every refresh.** Reuse of an already-rotated token revokes the whole family and logs
  a `auth.refresh_reuse_detected` event — the standard theft signal.
- `resolveActor(req)` returns the same `Actor` whichever transport was used, so
  `requirePermission()` and the existing permission map are untouched.
- Web keeps the cookie deliberately: it is the stronger option against XSS and it preserves the
  SEC-1/SEC-2 work rather than re-opening it.

---

## Revision — 22 Aug 2026

D1 and D2 were reversed after the plan was approved: the backend will be deployed to its own
server, so a process boundary is required, not just a layer boundary. The full split is now the
target and this document is being kept in step as it lands.

**Phase A was not wasted.** Because `src/server/**` was forbidden from importing `next/*`, the
error taxonomy, `Actor`, pagination and the permission map moved into NestJS unchanged. That
constraint is the only reason the reversal cost a copy instead of a rewrite.

### Layout

```
code/
  backend/     NestJS · owns Prisma, every secret, all business logic · port 4000
  frontend/    Next.js · UI only · port 3000
  docs/        shared
  package.json convenience scripts across both
```

### The transitional period, and how it ends

The frontend still queries the database directly for the 52 pages not yet repointed — your
execution rule is *don't break what works*, so it keeps working while the backend is built out.
That is explicitly temporary. `frontend/package.json` carries a `_transitional` block naming
every dependency, file and environment variable scheduled for deletion:

- `@prisma/client`, `prisma`, `bcryptjs`, `jose`, `marked`, `isomorphic-dompurify`, `nodemailer`,
  `pdfkit`, `qrcode`
- `frontend/prisma/` (a **derived** copy — `npm run check:schema` fails if it drifts from the
  backend's authoritative schema), `scripts/sync-schema.mjs`, `src/lib/db.ts`
- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` from `frontend/.env`

**Phase D ends when all of that is deleted.** Until then: no new frontend code may be written
against them.

## Migration plan

Each phase is independently shippable and leaves the app working. **No phase may land with a
failing `npm run test` or `npm run test:e2e`** — the existing 61 unit and 14 E2E tests are the
regression harness for the security work, and they must stay green throughout.

### Phase A — Scaffolding ✅ **COMPLETE (22 Aug 2026)** — no behaviour change

| | Delivered | File |
|---|---|---|
| A1 | Error taxonomy (10 codes → HTTP), `Result` + `toActionState`, `Actor`, cursor pagination | `src/server/shared/{errors,result,actor,pagination}.ts` |
| A2 | Request-based actor resolution, cookie **and** bearer | `src/lib/resolve-actor.ts` |
| A3 | `withApi()` wrapper + response envelope | `src/app/api/v1/_lib/{handler,respond}.ts` |
| A4 | ESLint boundary rule — verified to reject a probe importing `next/*` | `eslint.config.mjs` |
| A5 | Contract harness calling route handlers directly, no server needed | `tests/contract/_harness.ts` |
| — | First endpoint, proving the wrapper end to end | `src/app/api/v1/health/route.ts` |

**Decisions taken during A**

- `sessionFromToken()` was extracted from `getSession()` so the cookie and bearer paths share
  one verification implementation. Two copies is exactly how a web surface and a mobile surface
  drift apart. `getSession` behaviour is unchanged.
- `resolveActor` reads from `NextRequest`, not `next/headers`, so contract tests can call a
  handler with a hand-built request and no Next async context.
- **`withApi` defaults `auth` to `"authenticated"`.** A public endpoint must say `auth: "public"`
  out loud — forgetting to think about auth yields a locked endpoint, not an open one (risk R10).
- `Actor.transport` is recorded for audit but **no authorisation may branch on it**; a unit test
  asserts web and mobile resolve identical capabilities.

**Verification:** 92/92 unit + contract tests (was 61) · 14/14 E2E · typecheck clean · build clean
· lint unchanged at 29 pre-existing errors, none new.

### Phase B — Build the backend, module by module

| | Module | State |
|---|---|---|
| B0 | Repo split, NestJS scaffold, Prisma module, error filter, envelope interceptor, global auth guard, CORS, Swagger | ✅ done |
| B1 | `auth` — login, logout, me; cookie **and** bearer through one verification path | ✅ done |
| B2 | `cms` — pages, news, teachers, governing body, fees, gallery | ✅ done (reference pattern) |
| B3 | `file` — Cloudinary adapter, closes PERF-4 | ☐ |
| B4 | `user` · B5 `classroom` · B6 `office` | ☐ |
| B7 | `admission` · B8 `payment` ← highest risk, best existing coverage | ☐ |

**Backend conventions established in B0–B2** (every later module follows them):

- A **service** takes plain arguments and an `Actor`, returns plain data, throws `AppError`.
  It never sees a request, a cookie or a header.
- A **controller** validates with zod, calls one service method, returns its value. The
  `EnvelopeInterceptor` wraps it as `{ data }`; a `Page` becomes `{ data, meta.nextCursor }`.
- **`AuthGuard` is global.** Every route requires authentication unless it says `@Public()`,
  and `@RequirePermission("x")` checks the same map the frontend renders its menu from
  (risk R10).
- **`AppErrorFilter` is the only place** a thrown value becomes a status code. Prisma's `P2002`
  maps to 409, which is what keeps SEC-7.1's duplicate-capture behaviour correct.
- Permissions are served from `GET /auth/me` rather than duplicated in the frontend, so the UI
  and the API can never disagree (SEC-4 / SEC-5).

### Phase C / D — Repoint the frontend  ⚠️ **ADMIN REMAINING**

| Surface | State |
|---|---|
| API client + typed SDK (`src/services/`) | ✅ 8 domains, hand-written types, no Prisma dependency |
| Auth | ✅ verifies via `GET /auth/me`; the frontend holds no `JWT_SECRET` |
| **Public** (24 files) | ✅ **done** — every page 200s against the split stack with real data |
| **Classroom** (13 files) | ✅ **done** |
| **Office** (8 files) | ✅ **done** |
| **Admin** (32 files) | ☐ still reads Prisma directly |

`frontend/.env` is already reduced to URLs — no `DATABASE_URL`, no `JWT_SECRET`, no
`API_PREFIX`/`API_VERSION`, no `NODE_ENV`/`PORT`. The two database URLs remain **only** because
the 32 admin files still query directly; they go the moment those are migrated.

**Things learned migrating three surfaces, worth knowing before the fourth:**

- **Dates are strings now.** JSON has no date type, so `.toLocaleDateString()` on an API value
  is a runtime error. `src/lib/dates.ts` (`formatDate`, `isoAttr`, `dayOfMonth`) exists for this
  and a codemod caught the rest.
- **Optional relations need `Omit`, not intersection.** `T.Submission & { student: X }` keeps
  the base's optionality; `Omit<T.Submission, "student"> & { student: X }` actually overrides.
- **Every export in a `"use server"` file must be `async`.** An arrow const that returns a
  promise compiles in isolation and fails at runtime with an opaque "Ecmascript file had an
  error" — it cost a round of E2E failures to find.
- **The backend often returns less than Prisma did**, deliberately. Where a page broke on a
  missing field, the right fix was usually to widen the endpoint explicitly rather than to
  re-expose the whole row.

### Phase E — Publish### Phase E — Publish `/api/v1`  ✅ **COMPLETE**

51 endpoints across 8 modules, live and verified against Neon. Swagger at `/api/docs`,
generated from the running app so it cannot drift from the code.

### Phase F — Mobile auth  ✅ **COMPLETE**

`RefreshToken` model (migration `20260822140000`), hashed at rest, rotated on every use,
family revoked on reuse. Verified end to end: login issues a token, refresh rotates it,
replaying the consumed token returns `UNAUTHENTICATED` **and** revokes the successor, with a
`refresh_reuse_detected` error logged.

### Phase G — DigitalOcean  ✅ **COMPLETE (files; not yet deployed)**

Multi-stage Dockerfiles for both projects (non-root, tini, healthchecks), `docker-compose.yml`,
and a Caddyfile that serves both from one origin — `/api/*` to the backend, everything else to
the web app.

**Same-origin is the point:** the web app's httpOnly cookie keeps working with no CORS at all,
so CORS narrows to just the mobile apps. Postgres deliberately stays on Neon; `/api/docs` is
IP-restricted because an API description is a map of the attack surface.

### Phase H — Real-time  ☐ **DESIGNED, NOT BUILT**

Your answer selected "polling is fine" alongside all three real-time features, read here as
*polling now, all three later*. Order by value:

1. **Push notifications** — highest mobile value and no persistent connections. The
   `Notification` model already exists; this needs a `DeviceToken` table and an FCM/APNs
   adapter behind the same interface the in-app notifications use.
2. **Live class presence** — SSE from `/api/v1/classroom/live`. A droplet holds open
   connections happily, unlike serverless.
3. **In-app chat** — WebSocket, only if the async Ask-Teacher model proves insufficient.

---

## DevOps — DigitalOcean droplet

The move off Vercel invalidates several decisions made for serverless. Revisit, don't port:

| Built for serverless | On a droplet |
|---|---|
| Uploads as DB blobs (`FileBlob`) | → Cloudinary (PERF-4). Droplet also has a writable disk if needed |
| Read-only-FS email fallback | Real outbox directory now possible |
| DB-backed rate limiting | Keep — still correct if you ever run two instances |
| No background work possible | Cron/queue now viable in-process |

**Deployment shape**
- `output: "standalone"` in `next.config.ts`; multi-stage Dockerfile.
- `docker compose`: `web` (Next) + `caddy` (TLS termination, auto-renew) — Caddy over Nginx for
  automatic certificates on a single-host setup.
- **Keep Postgres on Neon initially.** Managed backups and PITR matter more than co-location, and
  it removes database operations from the migration's risk surface. Revisit separately.
- Environments: `dev` (local) · `staging` (droplet, separate DB branch) · `prod`.
- `.env` on the droplet only, `chmod 600`, never in the image.
- Health endpoint `/api/v1/health` for the reverse proxy and uptime checks.
- **CORS applies to `/api/v1` only** — an explicit origin allowlist for the mobile app; the web
  surface stays same-origin and needs none.

---

## Regressions found during the split, and their guards

Each was a *silent* failure — nothing crashed, the system quietly did the wrong thing — so each
now has a test rather than only a fix.

| Found | Defect | Fix | Guard |
|---|---|---|---|
| Phase B | `assertPaymentToken` threw a bare `Error`, so a refused payment link returned **500** instead of 401. A caller could not tell "your link expired" from "the server broke", and a 500 on a payment path is the wrong signal entirely. | Throws `AppError(UNAUTHENTICATED)` | `backend/test/regressions.test.ts` |
| Phase B | `Number(process.env.PORT ?? 4000)` — **the same empty-string trap as `SESSION_HOURS`**, written into new code after a session spent fixing it. A blank `PORT` becomes `Number("")` = 0 and the server binds to a random free port. | `intFromEnv("PORT", 4000)` | 7 parameterised cases |
| Phase B | A stray `PORT` in the shell silently beat `.env`, putting the API on :3000. dotenv never overriding an existing variable is correct behaviour — the problem was that it happened invisibly. | Warns `port_overridden_by_environment` with both values | verified live |
| Phase B | Home page rendered an empty `<title>`: stale `.next` cache plus Next inferring `code/` as the workspace root once a second lockfile appeared. | `turbopack: { root: __dirname }` | E2E asserts the title |

The `PORT` one is worth dwelling on: **`??` does not fire on the empty string** has now caused
three separate defects in this project (`JWT_SECRET`, `SESSION_HOURS`, `PORT`), plus one in a
Playwright config. Read every environment variable through `requiredSecret` or `intFromEnv`.

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Refactor silently regresses the SEC/BUG fixes | Medium | **Critical** | 61 unit + 14 E2E green on every phase; the security assertions are already encoded as tests |
| R2 | Validation drifts between actions and API | Medium | High | One zod schema per operation, imported by both; rule 3 above |
| R3 | Auth diverges between cookie and bearer | Medium | **Critical** | Single `resolveActor` + single permission map; contract tests for both transports |
| R4 | Big-bang refactor stalls half-done | Medium | High | Phase B is module-by-module, each shippable; app works after every step |
| R5 | Refresh tokens leak or replay | Low | **Critical** | Hashed at rest, rotated per use, family revoked on reuse detection |
| R6 | CORS opened too wide for mobile | Medium | High | Allowlist on `/api/v1` only; never `*` with credentials |
| R7 | Droplet ops burden vs managed Vercel | High | Medium | Docker Compose + Caddy; documented runbook; keep Neon managed |
| R8 | Prisma connection exhaustion on a long-lived process | Medium | Medium | Single client (already), explicit pool size, keep pgbouncer URL handling |
| R9 | Cloudinary migration loses files | Low | High | Dual-read during migration; backfill script; don't drop `FileBlob` until verified |
| R10 | `/api/v1` becomes a second, unguarded surface | Medium | **Critical** | `withApi` applies auth + rate limit by default; a handler must opt *out*, never opt in |
| R11 | Mobile pins to v1 and blocks web evolution | Medium | Medium | Versioned path; `X-Client-Version`; deprecation window |
| R12 | Content/GAP work collides with the refactor | High | Medium | Land the unblocked GAP fixes **before** Phase B starts |

---

## Migration checklist

**Phase A** ☐ server dirs ☐ error taxonomy ☐ Actor ☐ resolveActor ☐ withApi ☐ ESLint boundary ☐ contract harness
**Phase B** ☐ cms ☐ file+Cloudinary ☐ user ☐ auth ☐ classroom ☐ office ☐ admission ☐ payment
**Phase C** ☐ 25 action files repointed ☐ E2E green
**Phase D** ☐ 52 pages repointed ☐ zero `@/lib/db` imports under `src/app/**`
**Phase E** ☐ endpoints ☐ contract tests ☐ OpenAPI published
**Phase F** ☐ RefreshToken migration ☐ token endpoints ☐ rotation + reuse detection ☐ CORS allowlist
**Phase G** ☐ standalone output ☐ Dockerfile ☐ compose ☐ Caddy TLS ☐ staging ☐ health check ☐ runbook
**Phase H** ☐ push ☐ presence ☐ chat (if justified)

**Exit criteria:** no Prisma import under `src/app/**`; no `next/*` import under `src/server/**`;
every operation reachable by web and mobile through one service method; all tests green.

---

## Open items

1. **Real-time answer was contradictory** — "polling is fine" was selected alongside all three
   real-time features. Read here as *polling now, all three later*, phased in Phase H. Confirm.
2. **Database hosting** — plan assumes Neon stays. Moving Postgres onto the droplet is a separate
   decision with its own backup/PITR implications.
3. **Mobile stack** — React Native, Flutter or native? Doesn't change the API, but decides whether
   the zod schemas and TypeScript types can be shared with the app.
4. **Sequencing against the GAP work** — R12. Recommend landing the unblocked content fixes first.
