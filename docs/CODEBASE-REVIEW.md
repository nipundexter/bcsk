# BCSK Platform — Architecture & Code Review

**Reviewed:** 22 Aug 2026 · **Commit:** `a0a218e` · **Stack:** Next.js 16.3.2 (bumped from 16.2.10, 23 Aug 2026) · React 19.2.4 · Prisma 6 · Neon Postgres

> Companion artifact (same content, rendered): https://claude.ai/code/artifact/64c1eeeb-b53f-468f-8e65-7a26254950ef
> This file is the source of truth — update it first, then republish the artifact.
>
> **Scope:** code quality, security and performance. For divergence between the site's *content and
> structure* and the school's written specification, see
> [CONTENT-GAP-ANALYSIS.md](CONTENT-GAP-ANALYSIS.md) (`GAP-1`…`GAP-20`).

| | |
|---|---|
| TS/TSX files | 178 |
| Lines in `src` | ~10,600 |
| Routes (`page.tsx`) | 80 |
| Server-action files | 25 |
| API route handlers | 6 |
| Prisma models | 34 |
| Tests | **0** |
| Non-unique DB indexes | **0** |

---

## Phase 1 — Understanding the system

### Architecture style

A **server-first modular monolith**. Not MVC, not services. There is no REST layer between UI and
data: React Server Components read Prisma directly, and mutations go through Server Actions
co-located with the page that calls them. Six `route.ts` handlers exist only where HTTP semantics
are genuinely required — file bytes, PDFs, a CSV export, and the payment-gateway redirect.

The four "surfaces" named in the README are **route groups, not deployments**. They share one
Prisma client, one session cookie, one design system, and one database. Separation is enforced
entirely by a guard function called at the top of each layout and each action. There is no
`middleware.ts`.

```
Surfaces        (public)/        classroom/(app)    office/(app)     admin/(app)
                55 pages         student portal     teacher portal   admin panel
                    |                  |                  |               |
                    +------------------+------------------+---------------+
                                       |
Access control            lib/auth.ts — getSession / requireStudent
                          requireTeacher / requireAdmin / requireSuperAdmin
                          96 call sites · no middleware · redirect-on-fail
                                       |
Behaviour        80 page.tsx          25 actions.ts          6 route.ts
                 async RSC, reads     "use server" writes    files/PDF/CSV/Toss
                                       |
Shared services  lib/payments  lib/pdf  lib/uploads  lib/email  lib/i18n  lib/content
                                       |
Data                    Prisma 6 -> Neon Postgres (pooled)
                        34 models, including every uploaded file as a Bytes column
```

### Control flow

**Read path.** Request → route-group layout → guard (verify JWT, then one `User` lookup to check
`active`) → the page awaits its own Prisma queries → HTML. Nothing is cached; no route sets
`revalidate` or `dynamic`, and every page reads cookies transitively via the i18n helper, so the
entire site renders dynamically on every hit.

**Write path.** A Server Action posted from a client component via `useActionState`. The action
re-derives the session itself, validates (Zod in the two public forms, hand-rolled
`String(formData.get(...))` everywhere else), writes through Prisma, calls `audit()` if it is an
admin action, then `revalidatePath` and returns `{ ok }` or `{ error }`.

### The admission flow (the one to know cold)

1. `/apply/regular` → `submitRegular` validates, stores the photo as a `FileBlob`, creates an
   `ApplicationForm` in `PENDING_PAYMENT`, redirects to the payment page.
2. Payment page computes the amount from `FeeConfig`, renders card / bank tabs.
3. **Card** — `createCardOrder` writes a `PENDING` Payment row with an order ID; the Toss SDK takes
   over; Toss redirects the browser to `GET /api/payments/toss/confirm`, which re-confirms
   server-to-server before trusting anything.
4. **Bank** — the applicant uploads a receipt, the row goes to `PENDING_VERIFICATION`, an admin
   later clicks Verify.
5. Both paths converge on `activateEnrollmentForApplication()` — the single function that creates
   the `User`, generates the student ID, writes the `StudentProfile`, fans out `Enrollment` rows,
   flips the application to `APPROVED`, and emails the temporary password.

### Components and ownership

| Module | Responsibility | Assessment |
|---|---|---|
| `lib/auth.ts` | JWT issue/verify, four role guards, audit writer | Correct shape; secret falls back, every call hits the DB |
| `lib/db.ts` | Prisma singleton, PgBouncer URL fix-up | **Solid** — the pooler handling is a real, well-commented fix |
| `lib/payments.ts` | Fee maths, student-ID sequence, enrolment activation, Toss confirm | The business core, and the least defended file |
| `lib/uploads.ts` | MIME allowlist + magic-byte check → `FileBlob` | Good validation; questionable storage medium |
| `lib/pdf.ts` | Receipt, certificate, ID card, result sheet | **Solid** — pure, self-contained, no I/O |
| `lib/content.ts` | CMS fetch with EN fallback, markdown render, settings | Markdown rendered unsanitised |
| `lib/i18n` | Cookie-driven EN/BN/KO dictionary | Works; couples every page to dynamic rendering |
| `lib/constants.ts` | Roles, statuses, class levels, school details | Should be the schema's source of truth; currently only advisory |

### What is genuinely well done

- **Uniform server-action pattern** across all 25 action files — same signature, same state shape,
  same `revalidatePath` discipline. Learn one file, read the rest.
- **Toss is confirmed server-side** rather than trusting the redirect, and the amount is compared
  against the stored row first. Correct instinct.
- **Ownership checks in the teacher surface** — `ownSession()` in
  `office/classes/[id]/actions.ts` is the right pattern, and `gradeSubmission` re-derives it
  independently rather than trusting its caller.
- **Audit logging** applied to essentially every admin mutation, not bolted on afterwards.
- **Serverless constraints were thought about** — `serverExternalPackages` for pdfkit, the
  read-only-FS fallback in `sendMail`, the PgBouncer flag. Real scars, documented in comments.

---

## Findings, ranked

### Critical — exploitable against the deployed site today

#### SEC-1 — Session secret silently falls back to a hard-coded string
`src/lib/auth.ts:8` · env configuration

> **Status: code fixed, production env still outstanding (22 Aug 2026).**
> The fallback is removed — `src/lib/env.ts` `requiredSecret()` now refuses to boot on a missing,
> blank, or under-32-char secret, and `src/lib/auth.ts` uses it. A 64-char secret is set in local
> `.env`. **Production is not fixed:** `JWT_SECRET` is still blank in the Vercel project, and the
> Vercel CLI is not authenticated here so it could not be set.
> **Deploy ordering matters — set `JWT_SECRET` in Vercel *before* deploying this code, or the
> build will fail** (by design: a failed build beats a deploy that signs forgeable tokens).

`process.env.JWT_SECRET ?? "dev-secret"` means a missing or empty secret produces a *working* app
that signs sessions with a value published in the repo. `JWT_SECRET` was empty in the
(now-deleted) `.env.production.local`, so anyone could mint `{ sub, role: "SUPER_ADMIN" }` and walk
into the Admin Panel. No runtime warning; the failure was completely silent.

**Fix (applied)** — `src/lib/env.ts`:

```ts
const SECRET = new TextEncoder().encode(requiredSecret("JWT_SECRET"));
const SESSION_HOURS = intFromEnv("SESSION_HOURS", 8);
```

Note the second line. `SESSION_HOURS` was also blank in production, and
`Number(process.env.SESSION_HOURS ?? 8)` returns **0** for an empty string — `??` only fires on
null/undefined. That set every session cookie to `maxAge: 0`, so **login was silently broken in
production regardless of the secret**. Same defect class, same three lines, fixed together.

Rotation is automatic: changing the secret makes `jwtVerify` fail for every previously issued
token, `getSession()` returns null, and the user is redirected to login. Sessions are stateless
JWTs, so there is no server-side store to purge.

#### SEC-2 — Live login pages print working demo credentials
`(public)/admin/page.tsx:24` · `(public)/classroom/page.tsx:24` · `(public)/office/page.tsx:24`

> **Status: FIXED (22 Aug 2026).** Hints are gated behind `isDemoMode()`, which requires an explicit
> `NEXT_PUBLIC_DEMO_MODE=1` **and** returns false unconditionally when `NODE_ENV=production`.
> All 12 seeded accounts (12/12 were using `bcsk1234`, including `admin`/SUPER_ADMIN) were rotated
> to 18-byte random passwords at bcrypt cost 12, in one transaction, with 12 `USER_PASSWORD_ROTATED`
> audit rows. New `User.mustChangePassword` forces a password change before any portal page loads;
> verified in a live browser that all admin deep links divert to `/change-password`.
> The seed no longer hard-codes a weak password, and `createUser` / `resetUserPassword` /
> `activateEnrollmentForApplication` all flag the credentials they issue.

Each login card renders `demoHint="Demo: admin / bcsk1234"` unconditionally — not behind
`NODE_ENV`, not behind a flag. The seed creates those exact accounts with that exact password. The
Admin Panel is one copy-paste from the public internet.

**Fix (applied)** — `src/lib/env.ts` `isDemoMode()`; `prisma/rotate-passwords.ts`
(`npm run db:rotate-passwords -- --apply`, dry-run by default, writes credentials to a gitignored
file rather than stdout because 7 teacher accounts have no email); `src/app/(public)/change-password/`
for the forced change, enforced inside every `require*` guard so a deep link cannot bypass it.

#### SEC-2.1 — Toss gateway configuration
`src/lib/payments.ts` · `api/payments/toss/confirm/route.ts` · `(public)/apply/payment/[id]/`

> **Status: handling fixed, live keys outstanding.** `TOSS_SECRET_KEY` and `TOSS_CLIENT_KEY` are
> both blank in production, so card payment cannot work at all today.

The dangerous part was not the missing key but what happened next: an empty key produced a 401 from
Toss, the route's `catch` marked the Payment row `FAILED`, and the office would see a paying family
recorded as having failed to pay — while money may already be captured at the gateway.

**Fix (applied)** — a `PaymentConfigError` type now separates *our misconfiguration* from *the
customer's payment being declined*. On a config error the row is left `PENDING` for reconciliation
instead of being marked `FAILED`, the customer is told card payment is unavailable, and an error is
logged. 401/403 from Toss is classified as config, not decline. Added a 15s timeout and an
`Idempotency-Key` so a retried confirm cannot double-capture. `tossConfig()` gates the UI: with no
keys, the payment page offers bank transfer only rather than a checkout that cannot complete.

Verified against the live Toss sandbox — empty key and wrong key both raise `PaymentConfigError`;
a valid sandbox key with a bogus `paymentKey` reaches Toss and returns a genuine gateway decline.

**Outstanding:** set real `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` in Vercel. Sandbox keys are in
`.env` for local work. Note SEC-7 (GET replay on the confirm route) is still open in the same file.

#### SEC-3 — Applicants set their own price via a URL parameter
`(public)/apply/payment/[id]/page.tsx:29,59` · `actions.ts:11,32` · `lib/payments.ts:39`

> **Status: FIXED (22 Aug 2026).** `ApplicationForm.isBcskStudent` persists the claim at submit
> time; `computeApplicationFee(app)` reads it from the record and no longer accepts an override
> argument at all. The payment step is bound to a signed, 14-day capability token
> (`src/lib/payment-token.ts`) required by the page and by all three payment actions, plus a
> backend guard against duplicate payment rows per application.
> Verified live: `?bcsk=1` now returns **404**, as do a missing token, a garbage token, a token
> for a different application, and a token signed with the old `dev-secret`. The discount is real
> (₩150,000 vs ₩190,000) and now unfakeable.

The BCSK-student discount is read from `?bcsk=1` on the payment URL, passed to the client, and
handed straight back to `computeApplicationFee`. The application's own `adminNote` — the only place
the applicant's actual claim is stored — is never consulted. **Appending `?bcsk=1` buys the
discount**, and because the Payment row is created with the discounted amount, the server-side Toss
amount check compares the fraud against itself and passes.

The same three actions — `createCardOrder`, `submitBankTransfer`, `devSimulateCardSuccess` — also
take a raw `applicationId` with **no authentication and no ownership check whatsoever**. Any
visitor can enumerate IDs, create payment rows against other people's applications, or spam
duplicate bank-transfer rows onto one application.

**Fix** — persist the BCSK claim as a real column on `ApplicationForm` at submit time and derive
the fee from the record, never from the request. Bind the payment step to a capability the
applicant holds: issue a signed, expiring `paymentToken` when the application is created, require
it on every payment action. Add a uniqueness guard so one application cannot hold two open payment
rows.

### High

#### SEC-4 — Admin roles are enforced in the sidebar, not in the actions
`admin/(app)/layout.tsx:11–32` vs. every admin `actions.ts`

> **Status: FIXED (22 Aug 2026).** `src/lib/permissions.ts` holds 15 capabilities and one
> role→permission map. `requirePermission()` guards all 12 admin action modules plus the admin API
> routes — 51 call sites; no admin module calls bare `requireAdmin()` any more (only the shell
> layout and the shared dashboard do, which is correct). The sidebar is generated by `navFor(role)`
> from the same map, so UI and enforcement cannot drift. Denials render a real 403 boundary via
> `forbidden()` (`experimental.authInterrupts`).
> Verified live as IT_SUPPORT: `/admin/payments`, `/admissions`, `/fees`, `/cms`, `/settings`,
> `/audit` all return **403**; `/users` and `/tickets` return 200; the sidebar shows 3 modules
> instead of 15.

The layout carefully computes `isSuper` / `isSupport` / `isIT` and hides nav links. Every mutation
behind those links then calls plain `requireAdmin()`, which accepts all three roles. Only
`saveSettings` uses `requireSuperAdmin`. Server Actions are directly invocable endpoints, so an
IT_SUPPORT account can verify payments, issue refunds, approve admissions, and rewrite CMS pages —
it just cannot see the buttons.

**Fix** — replace the booleans with a capability check (`requirePermission("payments:verify")`)
backed by one role→permission map, and derive the sidebar from the *same* map so UI and enforcement
cannot drift.

#### SEC-5 — The file route allowlists known folders and lets unknown ones through
`src/app/api/files/[...path]/route.ts:19–34`

> **Status: FIXED (22 Aug 2026).** Replaced with a deny-by-default policy table: a folder with no
> entry is a 403, so a future upload folder is inert until someone writes a policy for it. The
> `NaN` ownership hole is closed (a non-numeric owner segment is now a denial, not a pass), path
> segments are filtered before joining, and `X-Content-Type-Options: nosniff` was added.

Access is decided by a chain of `if (folder === ...)` checks. Any folder not named in that chain —
a future `exports/`, `transcripts/`, anything a later feature adds — falls through to
"authenticated, therefore allowed". A student can also read other students' submissions if the
owner segment is absent or non-numeric, since `Number(rel.split("/")[1])` yields `NaN` and the
inequality check passes.

**Fix** — invert to deny-by-default with an explicit policy table keyed by folder; treat an unmapped
folder as 403. Better still, store owner and visibility *on the `FileBlob` row* so authorisation is
a data question, not a string-parsing question.

#### BUG-1 — Students can never see or download their admission receipt
`classroom/(app)/payments/page.tsx:10` · `api/receipts/[id]/route.ts:20`

> **Status: FIXED (22 Aug 2026).** Activation now adopts the application's payments
> (`payerUserId`) inside the same transaction that creates the user. The Payment Report and the
> receipt route also accept ownership via `application.createdStudentUserId`, so rows predating the
> fix work too. `prisma/backfill-payer-user-id.ts` (`npm run db:backfill-payer -- --apply`,
> dry-run by default) repairs existing data — tested against a seeded orphan, 0 remaining.

Admission payments are written with `applicationId` set and `payerUserId` `null` — the student
account does not exist yet. When `activateEnrollmentForApplication` later creates that account it
**never back-fills `payerUserId`**. So the Payment Report queries `{ payerUserId: session.userId }`
and returns nothing, and the receipt route's owner check fails too. Meanwhile the confirmation
email promises "your payment receipt is available from the Classroom portal → Payments". Every new
student hits this.

**Fix** — set `payerUserId` on the application's payments inside the same transaction that creates
the user; backfill existing rows; widen the receipt route's owner test to also accept
`payment.application.createdStudentUserId`.

#### BUG-2 — Enrolment activation is a six-step sequence with no transaction
`src/lib/payments.ts:68–150`

> **Status: FIXED (22 Aug 2026).** User, profile, enrolments, payment adoption and the application
> status now commit in one `db.$transaction`; `nextStudentId()` allocates inside it. Enrolments use
> `createMany` instead of a per-row await loop. The credentials email moved outside the transaction
> and is wrapped in its own try/catch — an SMTP outage can no longer cost a family their enrolment.
> The temporary password went from 8 hex chars at cost 10 to 12 chars at cost 12.
> Verified by integration test: happy path adopts the payment and creates 4 enrolments; a re-run is
> idempotent (no duplicate user); and a forced mid-transaction failure rolls back completely —
> `createdStudentUserId` null, status still PAID, `payerUserId` null, zero orphan profiles.

Creating the user, fanning out enrolments, flipping the application status, and sending credentials
are separate awaits. A crash midway leaves a student account with no enrolments and an application
still marked `PAID` — and the guard at the top (`if (app.createdStudentUserId)`) will then report
"already-active" and refuse to repair it. `nextStudentId()` compounds this: a read-then-write with
no lock, so two concurrent confirmations race for the same ID and one hits the unique constraint.
The credentials email is inside the flow, so an SMTP failure takes activation down with it.

**Fix** — wrap steps 1–4 in `db.$transaction`; replace the ID scan with a Postgres sequence (or
retry on unique violation); move the email outside the transaction and make it non-fatal.

#### SEC-6 — CMS markdown is rendered unsanitised into the public site
`lib/content.ts:14` · `components/site/CmsPage.tsx:26` · `(public)/page.tsx:45,134`

> **Status: FIXED (22 Aug 2026).** `renderMarkdown` now pipes marked's output through
> `isomorphic-dompurify` with an explicit tag/attribute allowlist and a URL scheme regex that
> blocks `javascript:` and `data:`. Tables, links and headings still render. Backed by 7 unit
> tests covering script tags, event handlers, `javascript:` URLs, iframes and forms.

`marked.parse()` passes raw HTML through by default and the result goes straight into
`dangerouslySetInnerHTML`. Any admin — including a compromised or lower-trust ADMIN_SUPPORT account
— can inject a script into the homepage. Given SEC-2 and SEC-4, not a theoretical chain.

**Fix** — sanitise after parsing (`isomorphic-dompurify`) or configure marked to escape HTML. Add a
CSP header as defence in depth; `next.config.ts` currently has no `headers()` block at all.

#### SEC-7 — The Toss callback mutates state on a GET, with no idempotency
`src/app/api/payments/toss/confirm/route.ts:10`

> **Status: FIXED (22 Aug 2026).** The handler answers replays from stored state without calling
> the gateway again: settled → completion page, failed → payment page, neither writes. `gatewayTxnId`
> is now uniquely indexed, so a concurrent duplicate confirm raises P2002, which the route catches
> and treats as success. The payment and application transitions moved into one `$transaction`, and
> the FAILED write is scoped `where: { status: "PENDING" }` so it can never overwrite a settled row.
> Verified: a duplicate `gatewayTxnId` insert is rejected by the unique index, and the scoped
> update touches 0 rows against a PAID payment.

A refresh, a prefetch, or a link-preview bot re-runs the handler. The Toss confirm call fails the
second time and the `catch` writes the row to `FAILED` with a reject reason — **marking an
already-successful payment as failed**. There is also no check that the payment is still `PENDING`
before confirming.

**Fix** — return early when `payment.status` is already terminal; only write `FAILED` when the row
was `PENDING`; reconcile against Toss's webhook rather than relying solely on the redirect.

### Medium

#### BUG-3 — Dashboard counts do not mean what their labels say
`backend/src/modules/admin/admin.service.ts` · `backend/src/modules/office/office.service.ts`

> **Status: FIXED (23 Aug 2026).** All four counts corrected and pinned by
> `backend/test/dashboard-counts.test.ts` (8 tests asserting the query shape, database-free).

Four separate miscounts, all of them silent — nothing threw, the cards simply reported figures
that did not match their labels, which is the one class of defect a reader cannot catch by
looking at the page.

1. **"Active students" and "Teachers" counted deactivated accounts.** Deactivation is a soft
   flag — `setActive` writes `User.active = false` and keeps the row — but the dashboard ran a
   bare `studentProfile.count()` / `teacherProfile.count()`. Every account ever switched off was
   still being reported as active staff or roll.
2. **The same class showed two different roster sizes.** `office.dashboard` filtered enrolments
   to `status: "ACTIVE"`; `office.myClasses` and `admin.listSessions` did not. A teacher saw one
   number on their dashboard and a larger one — inflated by `CANCELLED`/`COMPLETED` rows — on
   their classes page and in admin scheduling.
3. **"Open applications" omitted `CORRECTIONS_REQUESTED`.** `APPROVED` and `REJECTED` are the
   only terminal statuses, so an application handed back to the applicant for corrections was
   in flight yet counted nowhere — the work simply disappeared from the dashboard until the
   applicant resubmitted.
4. **Unanswered questions were counted two different ways.** `office` filtered on `answer: null`
   while `admin` used `answeredAt: null`. `answerQuestion` writes both, so the totals agreed by
   luck; only `answeredAt` matches `@@index([teacherUserId, answeredAt])`.

**Fix** — scope the profile counts through the relation (`where: { user: { active: true } }`),
apply the same `status: "ACTIVE"` enrolment filter in all three `_count` selects, add
`CORRECTIONS_REQUESTED` to the open-application list, and standardise on `answeredAt`.
No schema change and no migration.

#### PERF-1 — Not one non-unique index exists on 34 tables
`prisma/schema.prisma` · `migrations/000000000000_init`

> **Status: FIXED (22 Aug 2026).** 38 indexes added across every foreign key plus the hot
> filter combinations (`Enrollment[studentUserId, semester, status]`,
> `Notification[userId, createdAt]`, `Payment[status, createdAt]`, `AuditLog[createdAt]` …).
> Database now reports 39 non-unique, non-PK indexes, up from 0.

The migration creates 18 unique constraints and **zero plain indexes**. Postgres does not index
foreign keys automatically and Prisma does not add them, so `Notification.userId`,
`Enrollment.studentUserId`, `Attendance.classSessionId`, `Payment.payerUserId`, `AuditLog.userId`,
`GalleryItem.albumId`, and `ContentPage.slug` are all sequential scans. Fine at seed scale; it
degrades steadily and invisibly, and the audit log grows fastest.

**Fix** — `@@index` on every FK column plus hot filter combinations:
`@@index([studentUserId, semester, status])` on Enrollment, `@@index([userId, createdAt])` on
Notification, `@@index([status, createdAt])` on Payment. One migration, no code change.

#### PERF-2 — Every guard call costs a database round-trip, and pages call it twice
`src/lib/auth.ts:37–56` — 96 call sites

> **Status: FIXED (22 Aug 2026).** `getSession` is wrapped in React's `cache()`, deduping it
> per request. The layout guard and the page guard on the same render now share one query.
> Because the cache is per-request, the live `active` and `mustChangePassword` checks are
> unaffected.

`getSession()` re-queries `User.active` on every invocation and is not memoised. The Classroom
dashboard pays for it twice — once in the layout, once in the page — before doing real work.

**Fix** — wrap `getSession` in React's `cache()` to dedupe per request. Two lines; removes roughly
half the auth queries site-wide.

#### PERF-3 — Writes that should be batched run one row at a time

> **Status: FIXED (22 Aug 2026).** All four loops replaced: enrolment fan-out uses
> `createMany` (in BUG-2's transaction), and re-admission renewal, attendance marking and the
> settings save each use a single `$transaction([...])`. Attendance also gained server-side
> validation of the status value, which was previously written straight from the form.
`lib/payments.ts:112` · `admin/payments/actions.ts:31` · `office/classes/[id]/actions.ts:36` ·
`admin/settings/actions.ts:11`

Enrolment fan-out, re-admission renewal, attendance marking, and the settings save all `await`
inside a `for` loop. Marking attendance for a class of 30 is 30 sequential round-trips.

**Fix** — `createMany` where rows are new, one `$transaction([...])` array where upserts are
required. The pattern is already correct for notifications in `postAssignment`.

#### PERF-4 — Uploaded files are Postgres rows served through the app
`prisma/schema.prisma` · `lib/uploads.ts` · `api/files/[...path]`

> **Status: deferred by agreement — scheduled after stability.**
> **Decision (22 Aug 2026): Cloudinary, not S3.** Credentials are already present in `.env`
> (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`).
> Migration plan when it is picked up: upload through the Cloudinary SDK in `lib/uploads.ts`,
> store the public id rather than a path, keep `/api/files/[...path]` as the authorisation
> gate but have it redirect to a signed delivery URL instead of streaming bytes, and backfill
> existing `FileBlob` rows with a one-off script before dropping the table. The SEC-5.1 policy
> table stays as-is — authorisation must not move to Cloudinary.

Blobs in the database was defensible for a serverless host with no writable disk, and the README
owns the trade-off honestly. But 30 MB textbook PDFs now flow database → serverless function →
client on every request, cannot be CDN-cached, and bloat every backup. Gallery images are public
and still pay the full cost.

**Fix** — object storage with signed URLs (Vercel Blob, S3, R2). Keep `/api/files` as the
authorisation gate and have it redirect to a short-lived signed URL rather than streaming bytes.

#### SEC-8 — No rate limiting anywhere, and no security headers

> **Status: FIXED (22 Aug 2026).** New `src/middleware.ts` sets a nonce-based CSP, HSTS,
> `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`
> on every response. Rate limiting is **database-backed** (`src/lib/rate-limit.ts`, new
> `RateLimit` model) rather than in-memory, because each serverless instance has its own heap
> and an in-memory counter protects nothing. Applied to login (per-IP *and* per-account),
> password reset, applications and contact. It fails **open** on a database error — a limiter
> outage must not lock every family out of the admission form; the controls that must fail
> closed are enforced separately.
>
> **Renamed to `src/proxy.ts` (23 Aug 2026).** Next 16.3 deprecated the `middleware` file
> convention in favour of `proxy`. File and exported function renamed; matcher, nonce
> contract and every header are unchanged, verified at runtime against a dev server.

Login, forgot-password, the application form, and the contact form are all unthrottled. reCAPTCHA
is the only brake and it **passes automatically when the secret is unset** — the current state.
`next.config.ts` sets no CSP, `X-Frame-Options`, or HSTS, and there is no `middleware.ts` to add
them centrally.

**Fix** — a `middleware.ts` for headers plus IP+identifier rate limiting on auth and public form
endpoints. Make `verifyRecaptcha` fail closed in production — but fix SEC-9 first, or that change
takes the public forms down.

#### SEC-9 — reCAPTCHA is wired up server-side only; enabling it breaks both public forms
`lib/recaptcha.ts` · `(public)/apply/actions.ts:56,93` · `(public)/contact/actions.ts:28`

> **Status: FIXED (22 Aug 2026).** The widget now exists
> (`src/components/forms/Recaptcha.tsx`, mounted on both application forms and the contact
> form), so verification can succeed. With that in place `verifyRecaptcha` fails **closed** —
> a missing, malformed or unverifiable token is a rejection, and so is an outage at Google.
> The two keys are treated as one unit: both set → enforced; neither → disabled for local
> development; **only one → a thrown configuration error**, because the half-configured state
> is precisely what made this a trap.

Three server actions read a `recaptchaToken` field off the form. **Nothing ever produces one.**
`RECAPTCHA_SITE_KEY` is documented in `.env.example` and the README but is not referenced anywhere
in `src/` — there is no reCAPTCHA script tag, no widget, no `grecaptcha.execute()` call. The field
is always absent.

Today that is invisible, because `verifyRecaptcha` short-circuits to `{ ok: true }` when
`RECAPTCHA_SECRET_KEY` is unset. But the function's next branch is `if (!token) return { ok: false }`.
So **the moment anyone sets `RECAPTCHA_SECRET_KEY` in production, every application submission and
every contact-form submission starts failing** with "Captcha verification failed. Please try again."
— with no way for the user to succeed. The bot protection the README promises has never been
active, and switching it on is an outage.

**Fix** — either render the widget and submit a real token (add the site key to the two forms and
pass `recaptchaToken`), or remove the dead server-side checks and rely on rate limiting from SEC-8.
Do not simply set the secret.

#### QUAL-1 — Domain enums live in comments, so the database cannot enforce them

Roles, statuses, and class levels are `String` columns with valid values in a trailing comment.
`constants.ts` defines the same sets in TypeScript and the two are kept in sync by hand. Nothing
stops `status = "PAID "` with a trailing space, and `setTicketStatus` accepts any string. The schema
comment says the types were chosen to stay MySQL-compatible — a reasonable motive, being paid for
in correctness.

**Fix** — Prisma `enum`s (Postgres supports them natively), with the TypeScript unions derived from
the generated client so `constants.ts` stops being a second source of truth. If MySQL portability
must be kept, add `CHECK` constraints and validate with Zod at every boundary.

#### QUAL-2 — No tests, no CI, and validation is inconsistent

No test file, no `.github/`, no typecheck step beyond `next build`. Only two of the 25 action files
use Zod; the rest parse with `String(formData.get("x") ?? "")` and `Number(...)`, which silently
coerces a missing numeric field to `NaN` and passes it to Prisma. For a system that moves money and
issues certificates, the fee calculation and enrolment activation need coverage before anyone
refactors them.

**Fix** — Vitest for `computeApplicationFee`, `nextStudentId`, the role guards, and the file-access
policy. Playwright over the admission funnel. A GitHub Action running `tsc --noEmit`, `eslint`, and
the unit tests. One shared `parseForm(schema, formData)` helper so validation stops being
per-author.

### Lower priority

- **User text interpolated into email HTML** unescaped (`replyTicket`, `rejectPayment`,
  `rejectApplication`) — HTML injection into outbound mail.
- **Temporary passwords are 8 hex chars** from `randomBytes(4)`, emailed in plaintext, with no
  forced rotation on first login.
- **`SEMESTER_CURRENT = "2026-2"` is hard-coded** and referenced in eight places. Rolling semesters
  is currently a code change and a redeploy; it belongs in `Setting`.
- **Search uses `contains` on `content`** — unindexed full-table `ILIKE` across three tables per
  query. Move to Postgres full-text search before the CMS grows.
- **No pagination anywhere** — admissions, payments, users, and audit pages all `findMany()`
  unbounded. The audit log hurts first.
- **Duplicated helpers** — `krw()` defined three times; the PDF-response builder twice.
- **`devSimulateCardSuccess` ships in the production bundle**, guarded only by a runtime throw.
- **Dead code** — `void assignment;` in `postAssignment`; unused `classLevelLabel` import in
  `lib/payments.ts`.

---

## Phase 2 — Skill building

### Three ideas behind most of the findings

**1. A Server Action is a public endpoint that looks like a function call.**
`createCardOrder(applicationId, bcsk)` reads like a local call. Next compiles it to an HTTP POST to
a generated URL, callable by anyone with `curl`, with any arguments. The client component is a
convenience, not a gate. This single misconception is the root of SEC-3 and SEC-4. The rule:
**every `"use server"` function must re-derive the actor and re-check authorisation from its own
arguments**, exactly as an Express handler would. `ownSession()` gets this right; the payment
actions do not.

**2. What the client sends is a claim, never a fact.**
The BCSK discount travels applicant → URL → server component → client prop → server action → fee
calculation, never re-derived from the database. Each hop looked reasonable alone; the chain is the
bug. Identify the *authoritative record* for each fact and read it there. Price comes from
`FeeConfig` plus the stored application. Identity comes from the verified session. When you catch
yourself passing an ID that determines money or access, ask what stops the caller passing a
different one.

**3. Multi-step writes need a transaction — and idempotency.**
`activateEnrollmentForApplication` performs six writes and an email. Without `$transaction`, a
failure at step four leaves a state no code path can describe or repair. Idempotency is the sibling
requirement and is what SEC-7 is really about: any handler a browser, webhook, or retry can invoke
twice must produce the same end state both times. Check current state before acting, use `upsert`
with a natural key, never let a second call downgrade a terminal status.

### Learning roadmap — ordered by benefit to *this* codebase

1. **Web authorisation models** — RBAC vs. capability checks; enforcing at the data layer, not the
   view layer. Fixes SEC-3/4/5. Read OWASP Broken Access Control against this repo's action files.
2. **Transactional design and idempotency** — `$transaction`, interactive transactions, unique
   constraints as concurrency control, safe retries.
3. **Postgres indexing and query planning** — why FKs need explicit indexes, reading
   `EXPLAIN ANALYZE`, composite index column order.
4. **Testing without a framework habit** — start with pure functions
   (`computeApplicationFee`), then a seeded test database for the admission funnel. The goal is
   confidence to refactor `lib/payments.ts`, which nobody can safely touch today.
5. **Next.js caching and rendering modes** — `cache()`, `revalidateTag`, PPR, and why cookie access
   forces dynamic rendering.
6. **Domain modelling** — making illegal states unrepresentable; a real state machine for
   application and payment status.

---

## Phase 3 — Module-by-module

| Module | Verdict | Findings |
|---|---|---|
| `lib/auth.ts` | Right structure, wrong defaults. Cookie flags correct (httpOnly, sameSite, secure-in-prod). The `active` re-check per request is a good call — it just needs memoising. | SEC-1, PERF-2 |
| `lib/payments.ts` | Highest-risk file, least protection. Toss confirmation is correct; the fee input, ID sequence, and multi-step write are not. Refactor only after tests exist. | SEC-3, BUG-2 |
| `lib/uploads.ts` | **Good.** Magic-byte verification is more than most projects do, and the comment is honest about AV scanning being out of scope. Only the storage medium is questionable. | PERF-4 |
| `api/files/[...path]` | Allowlist logic is fragile and worsens with each new folder. The `..` check is redundant but harmless. Cache headers sensible. | SEC-5 |
| `api/payments/toss/confirm` | The amount check against the stored row is the right instinct, undermined by a mutable amount upstream and no replay protection. | SEC-7 |
| `api/receipts/[id]` | Auth logic clean and correct as written — the ownership *data* is what's missing. | BUG-1 |
| `admin/(app)/*/actions.ts` | Impressively uniform across 12 modules; that consistency is the codebase's biggest asset. The uniformity is also the problem — all of them accept all three admin roles. | SEC-4, QUAL-1 |
| `office/(app)/classes/[id]` | **Best in repo.** `ownSession()` is the pattern every other surface should copy; `gradeSubmission` re-derives it independently. Video URLs validated. Only the attendance loop needs batching. | PERF-3 |
| `classroom/(app)/*` | Reads correctly scoped to `session.userId`. `submitAssignment` checks enrolment first. Re-admission fee read from config, not the client. | BUG-1 |
| `(public)/apply/*` | The only place Zod is used properly — undone at the payment step. | SEC-3 |
| `lib/pdf.ts` | **Good.** Pure, no I/O beyond the buffer. Absolute coordinates overflow the ID card for long names; cosmetic. | — |
| `lib/email.ts` | Nice DX fallback, but callers `await` it inline, so slow SMTP stalls admission and payment flows. Interpolates unescaped user text. | Low |
| `lib/content.ts` · `i18n` | English-fallback pattern well judged for a trilingual school. Markdown rendering is the weak point; the fallback double-query could be one `findMany`. | SEC-6 |
| `prisma/schema.prisma` | Thorough domain modelling, right relations. Two systemic gaps: stringly-typed enums, no secondary indexes. | PERF-1, QUAL-1 |

---

## Suggested order of work

| When | Work | Findings |
|---|---|---|
| **Now** | Set `JWT_SECRET` in Vercel and rotate. Remove demo hints. Rotate seeded passwords. Confirm `TOSS_SECRET_KEY` in production. | SEC-1, SEC-2 |
| **Week 1** | Persist the BCSK claim, derive fee from the record, bind payment actions to a signed application token, make the Toss callback idempotent. | SEC-3, SEC-7 |
| **Week 2** | One permission map; `requirePermission` in every admin action; sidebar derived from the same map. Deny-by-default file policy. | SEC-4, SEC-5 |
| **Week 2** | Back-fill `payerUserId` and wrap activation in a transaction — the same edit. | BUG-1, BUG-2 |
| **Week 3** | `middleware.ts` with security headers + rate limiting; sanitise CMS markdown; reCAPTCHA fails closed. | SEC-6, SEC-8 |
| **Week 3** | Index migration, `cache()` on `getSession`, `createMany` in the four loops. Low risk, immediate benefit. | PERF-1..3 |
| **Week 4+** | Vitest on fee and enrolment logic, Playwright on the admission funnel, CI running typecheck + lint + tests. Then the enum migration and object-storage move. | QUAL-1, QUAL-2, PERF-4 |

---

## Verification status

- `npm install` — 450 packages, 9 high-severity advisories reported by `npm audit` (not yet triaged).
- `npx tsc --noEmit` — **clean**.
- `npx prisma migrate deploy` — `000000000000_init` applied to Neon `bcsk`.
- `npx prisma db seed` — 12 users, 22 content pages, 34 class sessions, 12 fee configs.
- Runtime query through the pooled endpoint verified (the `pgbouncer=true` auto-append in
  `lib/db.ts` fires correctly).
- **Not run:** `next build`, `eslint`, any test suite (there is none).

All findings above come from reading source, not from executing exploits.
