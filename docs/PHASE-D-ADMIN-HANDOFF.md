# Phase D - Admin surface migration (handoff)

> **DONE - 23 Aug 2026.** All 32 admin files were migrated, the transitional Prisma layer was
> deleted, and the frontend now builds with no database credentials present. This file is kept
> as the record of what was done and what changed on the way; it is no longer a task.
> Current state lives in [ARCHITECTURE-SEPARATION.md](ARCHITECTURE-SEPARATION.md).

**Read this first, then [ARCHITECTURE-SEPARATION.md](ARCHITECTURE-SEPARATION.md) for context.**

This is the last piece of the frontend/backend split. Public, classroom and office are done
and verified. **32 admin files still query Prisma directly.** When they are migrated,
`frontend/prisma/`, the `_transitional` dependency block and the last two env vars all get
deleted together.

---

## The job in one sentence

Replace every `db.<table>.<query>()` in `src/app/admin/**` with the matching `admin.*` call
from `@/services`, then delete the frontend's database access entirely.

**The backend is already complete** — 116 endpoints. No new backend work should be needed
except where a page turns out to want a field the endpoint does not return; widen the
endpoint explicitly rather than re-exposing whole rows.

---

## File → SDK mapping

Every one of these SDK methods exists today in `frontend/src/services/index.ts`.

| File | Replace with |
|---|---|
| `dashboard/page.tsx` | `admin.dashboard()` |
| `admissions/page.tsx` | `admissions.list(status?)` |
| `admissions/[id]/page.tsx` | `admissions.one(id)` |
| `admissions/[id]/actions.ts` | `admissions.approve(id)` · `admissions.reject(id, reason)` |
| `payments/page.tsx` | `payments.list()` |
| `payments/actions.ts` | `admin.verifyPayment(id)` · `rejectPayment(id, reason)` · `refundPayment(id, reason)` |
| `fees/page.tsx` | `admin.fees()` |
| `fees/actions.ts` | `admin.updateFee(id, input)` |
| `cms/page.tsx` | `admin.pages()` |
| `cms/edit/page.tsx` | `admin.page(slug, lang)` |
| `cms/actions.ts` | `admin.savePage(input)` · `admin.deletePage(slug, lang)` |
| `news/page.tsx` | `admin.news()` |
| `news/actions.ts` | `admin.saveNews(input)` · `admin.deleteNews(id)` |
| `gallery/page.tsx` | `admin.albums()` |
| `gallery/actions.ts` | `admin.createAlbum` · `addGalleryItem` · `deleteGalleryItem` · `deleteAlbum` |
| `governing/page.tsx` | `admin.members()` |
| `governing/actions.ts` | `admin.saveMember(input)` · `admin.deleteMember(id)` |
| `student-corner/page.tsx` | `admin.cornerPosts()` |
| `student-corner/actions.ts` | `admin.saveCornerPost(input)` · `admin.deleteCornerPost(id)` |
| `courses/page.tsx` | `admin.courses()` |
| `courses/actions.ts` | `admin.updateCourse` · `updateLevel` · `addLevel` |
| `scheduling/page.tsx` | `admin.sessions()` · `admin.teachers()` · `admin.courses()` |
| `scheduling/actions.ts` | `admin.updateSession(id, input)` · `admin.createSession(input)` |
| `tickets/page.tsx` | `admin.tickets()` |
| `tickets/actions.ts` | `admin.replyTicket(id, reply, close)` · `admin.setTicketStatus(id, status)` |
| `reports/page.tsx` | `admin.students()` |
| `reports/actions.ts` | `admin.addResult(input)` |
| `users/page.tsx` | `users.list()` |
| `users/actions.ts` | `users.create` · `users.resetPassword` · `users.setActive` |
| `settings/page.tsx` | `admin.settings()` |
| `settings/actions.ts` | `admin.saveSettings(values)` |
| `audit/page.tsx` | `admin.auditLog(cursor?)` |

**File uploads** (course books, gallery images): `files.upload(file, folder)` returns
`{ path }`. Allowed folders are `applications`, `receipts`, `submissions`, `assignments`,
`gallery`, `books`.

---

## Four gotchas — all of these cost time on the other three surfaces

1. **Dates are ISO strings, not `Date`.** `.toLocaleDateString()` / `.toISOString()` /
   `.getDate()` on an API value is a runtime error. Use `formatDate`, `isoAttr`,
   `dayOfMonth`, `monthShort` from `@/lib/dates`.

2. **Overriding an optional relation needs `Omit`, not intersection.**
   `T.Payment & { payer: X }` keeps the base optionality and still errors as possibly
   undefined. Write `Omit<T.Payment, "payer"> & { payer: X }`.

3. **Every export in a `"use server"` file must be `async`.** An arrow const that returns a
   promise compiles fine and then fails at runtime with an opaque *"Ecmascript file had an
   error"* that 500s unrelated pages. Use `export async function`.

4. **`audit()` no longer exists in `@/lib/auth`.** The backend writes audit rows itself
   inside each admin operation — delete the call, do not reimplement it.

Also: `requirePermission("x")` still works in pages and now checks the permission list the
backend returned from `/auth/me`. Keep those guards; they render the 403 boundary. They are
defence in depth — the API refuses the call regardless.

---

## How to run it

> **Superseded (23 Aug 2026).** The root `package.json` was removed; `backend/` and `frontend/`
> are now independent npm projects with no orchestration between them. The commands recorded in
> this document are kept as the historical record of the phase and no longer run as written —
> see **Commands** in `CLAUDE.md` for the current per-project equivalents.

```bash
npm run dev            # from code/ — starts api :4000 and web :3000 together
```

Backend must be running for any admin page to render.

## Definition of done

```bash
# 1. no Prisma anywhere in the frontend
grep -rl '@/lib/db' frontend/src        # must return nothing

# 2. typecheck and build
npm run typecheck && npm run build      # from code/

# 3. tests
npm run test                            # backend 32 + frontend unit
npm run test:e2e                        # 14 Playwright, needs both services

# 4. then, and only then, delete the transitional layer
#    - frontend/prisma/ and frontend/scripts/sync-schema.mjs
#    - the "_transitional" block in frontend/package.json, and those dependencies
#    - DATABASE_URL and DIRECT_URL from frontend/.env
#    - the postinstall schema-sync from frontend/package.json
```

Then re-run 2 and 3. **The frontend must build with no database credentials present** —
that is the actual acceptance test for this phase.

---

## What actually happened

- **All 32 files migrated.** Both typecheck targets are at 0 errors, both projects build, and
  the frontend `node_modules` no longer contains Prisma.
- **One endpoint added:** `POST /admissions/:id/corrections` (117 total). "Request corrections"
  had no backend equivalent - it is not a rejection, so `reject` could not stand in for it.
- **Four endpoints narrowed, not widened.** `GET /payments`, `GET /admin/students`,
  `GET /admin/sessions` and `GET /users` were `include`-ing whole `User` rows, so
  `passwordHash` was crossing to the web tier. They now `select` the named fields, plus the
  three counts the tables needed (`examResults`, `enrollments`) and the profile fields the
  Users table shows.
- **The audit log now pages.** It used to read `take: 300`; the endpoint is cursor-paginated
  with a 100-row cap, so `api.getPage` was added to keep `meta.nextCursor` and the page has an
  "Older entries" link rather than a silent truncation to 25.
- **Actions surface API refusals.** The old versions returned early and silently when a
  payment was in the wrong state; the backend now answers with a reason and the row shows it.
