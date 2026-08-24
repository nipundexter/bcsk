# BCSK Platform

The complete web platform for **Bangladesh Community School, Korea** — public website, student Classroom portal, teacher Office portal, and Admin Panel, built to the BCSK Website SRS v1.0.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS 4) — one codebase for all four surfaces
- **Prisma + PostgreSQL** — `npx prisma dev` locally, Vercel Postgres/Neon (or any Postgres) in production; uploads are stored as DB blobs so the app runs on serverless hosts
- **JWT sessions** (jose) + bcrypt password hashing, role-based access control
- **Toss Payments** sandbox for card payments; manual Hana Bank transfer with receipt verification
- **pdfkit** for receipts, enrollment certificates, result sheets, and QR-verified digital ID cards
- **nodemailer** for email (simulated — logged/saved locally — until SMTP is configured)

## Getting started

`backend/` and `frontend/` are two independent npm projects, each with its own manifest and
lockfile — every real dependency lives in one of them. The root `package.json` holds none of its
own; it only proxies `npm run <script>` into each via `--prefix`, so `npm run install:all` and
`npm run dev` (both projects together, via `concurrently`) work from the repo root without a
`cd`. Env files still need setting up per project first:

```bash
# backend — API on :4000
cd backend
npm install
cp .env.example .env         # DATABASE_URL (pooled), DIRECT_URL (unpooled), JWT_SECRET, …
npx prisma migrate deploy    # creates the schema
npm run db:seed              # loads real bcskr.org content + demo accounts
```

```bash
# frontend — web on :3000
cd frontend
npm install
cp .env.example .env         # BACKEND_API_URL and NEXT_PUBLIC_* only — no secrets
```

Then, from the repo root:

```bash
npm run dev                  # api :4000 and web :3000 together — http://localhost:3000
```

Or run each on its own, in two terminals: `npm --prefix backend run start:dev` and
`npm --prefix frontend run dev`.

> **One `.env` per project, and neither has a `.env.local`.** Do not run `vercel env pull` — it
> recreates `.env.local` and `.env.production.local`, which Next loads *above* `.env` and which
> carried a stale database URL and empty overrides.

## Deploying to Vercel

1. Import the GitHub repo into Vercel.
2. In the Vercel dashboard → **Storage → Create Database → Postgres (Neon)** and connect it to the project — this auto-adds `DATABASE_URL` to the project's environment variables.
3. Add the remaining environment variables (Project → Settings → Environment Variables): `JWT_SECRET` (strong random string), `NEXT_PUBLIC_BASE_URL` (e.g. `https://bcsk.vercel.app`), `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, and optionally the `SMTP_*`/`RECAPTCHA_*` keys.
4. From your machine, apply the schema and seed the production database:
   ```bash
   DATABASE_URL="<the Neon URL from Vercel>" npx prisma migrate deploy
   DATABASE_URL="<the Neon URL from Vercel>" npm --prefix backend run db:seed
   ```
   (PowerShell: `$env:DATABASE_URL="<url>"; npx prisma migrate deploy` then `npm --prefix backend run db:seed`.)
5. Redeploy. The build runs `prisma generate` automatically (`postinstall`).

### Demo accounts

> **SEC-2:** the shared `bcsk1234` password no longer exists. `npm --prefix backend run db:seed` now generates a
> random password and prints it once; pass `ALLOW_DEMO_PASSWORD=1` for the old shared password in
> local development only (the seed refuses it when `NODE_ENV=production`). Every seeded account is
> flagged `mustChangePassword`, so the first login goes to `/change-password` before the portal
> opens. To rotate credentials on an existing database:
> `npx tsx prisma/rotate-passwords.ts --apply`.

| Surface | URL | Login |
|---|---|---|
| Admin Panel (Super Admin) | `/admin` | `admin` |
| Admin (office support) | `/admin` | `office` |
| Admin (IT support) | `/admin` | `itsupport` |
| Teacher Office portal | `/office` | `BCSK-T-001` … `BCSK-T-007` |
| Student Classroom portal | `/classroom` | `BCSK-2026-0001`, `BCSK-2026-0002` |

## The four surfaces

- **Public site** — Home, BCSK/About (teachers, governing body, representatives), Admission (process, fees, brochure), Academic (curriculum, book list, calendar), Events & News (gallery with lightbox), Student Corner, Contact (support tickets + map), global search, and the three course pages:
  - `/courses/deen` — Qur'an & Islamic Studies with KOIE program and Hifz tracking
  - `/courses/ielts-for-kids` — levels 1–9, BCSK/non-BCSK pricing, practice quiz
  - `/courses/abacus` — levels 0–7, interactive **virtual soroban**, and **Fun Abacus** games (Flash Race, Balloon Pop) with scores saved to progress reports
- **Admission & payment** — `/apply` → Regular or Special course form (photo upload ≤ 1 MB, PIPA parental consent) → card payment (Toss sandbox) or bank transfer (auto virtual reference + receipt upload). Confirmed payments **automatically create the student account, enroll them, and email Classroom credentials**.
- **Classroom** (students) — dashboard with live-class tiles and Zoom joins, assignments with submission/grading, class videos, routine, results + progress + Hifz + game scores, attendance, payment history with PDF receipts, certificate/ID-card/result-sheet downloads, Ask Teacher, re-admission (semester fee only).
- **Office** (teachers) — assigned classes, start/end live sessions, roster + attendance marking, post & grade assignments (with student notifications), upload class videos, answer questions, guardians directory, task list.
- **Admin Panel** — role-scoped modules: Admissions review, Payments (verify/reject bank transfers, refunds, CSV export), Fee Configuration, trilingual CMS with draft/publish, News & Events, Media Gallery, Student Corner, Governing Body, Courses & Levels (book PDFs), Scheduling (teacher assignment + routine), Users (create/reset/deactivate), Reports (result entry + per-student document generation), Support Tickets, Settings, and Audit Log.

## Languages

English (default), বাংলা, and 한국어 — switcher in the top bar. UI strings live in `src/lib/i18n/dictionaries.ts`; CMS page content is stored per-language in the database with English fallback.

## Going to production — what you need to provide

1. **PostgreSQL** — any hosted Postgres (Vercel Postgres/Neon, Supabase, RDS…). If the school later self-hosts with MySQL 8 per the SRS, switch the provider in `prisma/schema.prisma`; the model types are MySQL-compatible.
2. **Toss Payments live keys** — replace `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` (currently the public sandbox keys). Any Korean PG with a confirm-API works with small changes in `src/lib/payments.ts`.
3. **SMTP credentials** — set `SMTP_HOST/PORT/USER/PASS/FROM`; until then emails are simulated (logged, or saved to `storage/outbox/` where the disk is writable).
4. **Zoom** — teachers paste meeting links per session (works today). For API-generated meetings, set the `ZOOM_*` env vars and extend `LiveControls`.
5. **Google reCAPTCHA** — ⚠️ **do not set `RECAPTCHA_SECRET_KEY` yet (SEC-9).** No reCAPTCHA widget is rendered anywhere, so no token is ever submitted; setting the secret makes every application and contact submission fail. Render the widget first, or drop the server-side checks.
6. **JWT_SECRET** — set a strong random value.
7. **Backups** — user uploads live in the database (`FileBlob` table, served role-checked via `/api/files/...`), so backing up the database backs up everything (NFR-REL-02).

## Notes

- Payment card data never touches this server — cards are tokenized by the gateway (PCI-DSS SAQ-A); only a transaction reference and status are stored (NFR-SEC-03).
- Student personal data is collected with parental consent at application time (PIPA / NFR-LEGAL-01); the Privacy and Refund policies are linked in the footer of every page (NFR-LEGAL-02).
- In development, the payment page shows a **"DEV: simulate successful card payment"** button (hidden in production builds) so the whole admission flow can be exercised without the gateway.
- Card payment is offered only when both `TOSS_CLIENT_KEY` and `TOSS_SECRET_KEY` are set (SEC-2.1); otherwise the payment page shows bank transfer only rather than a checkout that cannot complete.
