# Phase D — Admin surface migration (handoff)

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

## Current state

- Backend: 116 endpoints, typechecks, builds, 32 tests green.
- Frontend: public / classroom / office at **0** typecheck errors; admin is the only
  remaining source of errors.
- `frontend/.env` already holds URLs only, apart from the two database vars kept alive
  solely for these 32 files.
- **The working tree has a large number of uncommitted changes.** Consider committing
  before starting, so the admin migration is a reviewable diff on its own.
