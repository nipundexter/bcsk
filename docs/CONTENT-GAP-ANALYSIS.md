# BCSK Website — Content & IA Gap Analysis

**Source:** school content specification (9 sections) · **Compared against:** `D:\SF\bcsk\code` as of 22 Aug 2026
**Companion:** [CODEBASE-REVIEW.md](CODEBASE-REVIEW.md) covers code quality and security. This document covers
*what the site says and how it is organised* — no code defects here, only requirement gaps.

> Rendered artifact (same content): https://claude.ai/code/artifact/84d1e4d5-6e65-4d05-92ec-e42a5a63fdfa
> This file is the source of truth — update it first, then republish.

---

## Gap register

Referenced by ID elsewhere and in conversation, the same way `SEC-n` / `BUG-n` are used in
[CODEBASE-REVIEW.md](CODEBASE-REVIEW.md). Update the **State** column as each is closed.

| ID | Gap | Kind | Blocked by | State |
|---|---|---|---|---|
| **GAP-1** | Every semester fee is understated by ₩100,000–150,000 | 🔴 Money | — | open |
| **GAP-2** | Site names Hana Bank; spec says Woori | 🔴 Money | Q1 | open |
| **GAP-3** | Abacus billed twice — bundled in spec, separate course in system | 🔴 Money | Q2 | open |
| **GAP-4** | IELTS priced at ₩180k/₩230k against a specified ₩100k/₩150k | 🔴 Money | Q2 | open |
| **GAP-5** | Only 7 of 9 top-level sections; IELTS, KOIE, Student Corner buried | 🟠 IA | — | open |
| **GAP-6** | "Student Lounge" dropdown is not in the spec | 🟠 IA | Q8 | open |
| **GAP-7** | Home missing Why BCSK, Mission & Vision, Education Management, Class Schedule | 🟠 Content | Q6 | open |
| **GAP-8** | KOIE has no page; nearest is `/courses/deen`, misframed and misnamed | 🟠 Content | Q3 | open |
| **GAP-9** | "Education System" page is thinner than spec §2.2 and misnamed | 🟠 Content | — | open |
| **GAP-10** | Principal's Talk sits under BCSK; spec puts it under Contact | 🟡 Content | — | open |
| **GAP-11** | Admission form omits learning mode, ID upload, school records | 🟠 Process | — | open |
| **GAP-12** | Age-5 minimum is not enforced | 🟡 Process | — | open |
| **GAP-13** | Scholarships and orientation are specified but not modelled | 🟡 Process | — | open |
| **GAP-14** | Curriculum missing Abacus (all classes) and Pre-Primary Math | 🟡 Data | Q2 | open |
| **GAP-15** | "Bangladesh & Global Studies" where spec says "Social Science" | 🟡 Data | — | open |
| **GAP-16** | 5 of 11 teaching staff missing; no IT officer; no permanent/semi-permanent field | 🟡 Data | school | open |
| **GAP-17** | Book fees present in DB but blank in spec | 🟡 Data | Q4 | open |
| **GAP-18** | Platform set to semester 2026-2; fee table is Session 2026 Semester 1 | 🟡 Data | Q5 | open |
| **GAP-19** | Five pages live that the spec never mentions | 🟢 Tidy | Q8 | open |
| **GAP-20** | Spec copy contains typos that must not ship | 🟢 Copy | — | open |

**Only GAP-1, GAP-5, GAP-9, GAP-10, GAP-11, GAP-12, GAP-15 and GAP-20 can start today.**
The rest wait on an answer from the school.

## Decision log — fill these in before the fix phase

| # | Question | Answer |
|---|---|---|
| Q1 | Woori or Hana? Account number? | _pending_ |
| Q2 | Abacus bundled into the semester fee, or charged separately? | _pending_ |
| Q3 | Section 6 — "IOM" or "KOIE"? | _pending_ |
| Q4 | Book fee amounts (6 classes + debate + abacus) | _pending_ |
| Q5 | Which semester is live — 2026-1 or 2026-2? | _pending_ |
| Q6 | Home page structure — TOC numbering or body numbering? | _pending_ |
| Q7 | Semester 2 length — four months or five? | _pending_ |
| Q8 | Keep or retire the five unlisted pages? | _pending_ |
| Q9 | Add "Quran Program for ladies only" as its own course? | _pending_ |
| Q10 | Boys'/girls' Quran — two courses or one with sections? | _pending_ |

## Headline

| # | Gap | Severity |
|---|---|---|
| 1 | **Every published tuition fee is too low** — by ₩100,000–150,000 per class | 🔴 Financial |
| 2 | **Wrong bank.** Spec says Woori; the site tells families to pay Hana Bank | 🔴 Financial |
| 3 | **Abacus is billed twice** — spec bundles it into the semester fee, the system charges separately | 🔴 Financial |
| 4 | Two required top-level sections (**IELTS for Kids**, **KOIE**) are buried in a dropdown | 🟠 IA |
| 5 | **Mission & Vision** and **Why admit at BCSK** have no page at all | 🟠 Content |
| 6 | The admission form omits **ID/passport** and **preferred learning mode** | 🟠 Process |
| 7 | 5 of 11 required teaching staff are missing; no IT officer record | 🟡 Data |

Nothing in this document is a bug in the sense of the code review — the platform does what it was built
to do. These are places where **what was built and what the school specified have diverged**.

---

## 1. Information architecture

The spec defines **9 top-level sections**. The site has **7**, and two of them do not correspond to
anything in the spec.

| # | Spec section | Present? | Where it lives today |
|---|---|---|---|
| 1 | Home | ✅ | `/` |
| 2 | BCSK | ✅ | dropdown |
| 3 | Admission | ✅ | dropdown |
| 4 | Academic | ✅ | dropdown |
| 5 | **IELTS for Kids** | ⚠️ misplaced | `/courses/ielts-for-kids`, nested under *Academic* |
| 6 | **KOIE** | ⚠️ misplaced + misnamed | `/courses/deen`, nested under *Academic*, labelled "Deen" |
| 7 | **Student Corner** | ⚠️ misplaced | `/student-corner`, nested under *Student Lounge* |
| 8 | Events and News | ✅ | dropdown |
| 9 | Contact | ✅ | `/contact` |

**Not in the spec but in the navigation:** a *Student Lounge* dropdown (an invented grouping holding
Student Login, Student Corner, Gallery, Re-Admission). Its members belong elsewhere; the portal login
belongs in the top bar, where it already is.

**Recommended top-level bar:** Home · BCSK · Admission · Academic · IELTS for Kids · KOIE ·
Student Corner · Events & News · Contact.

---

## 2. Page inventory, section by section

### 2.1 Home (spec §1)

| Spec requirement | Status |
|---|---|
| 1.1 First Bangladeshi School in Korea | ✅ hero copy exists (`home-hero` CMS page) |
| 1.2 Apply Now | ✅ CTA present |
| 1.3 School Overview | ⚠️ partial — no dedicated section matching the spec's text |
| 1.3.1 Why do you have to be admitted in BCSK? | ❌ **missing entirely** |
| 1.3.2 Mission & Vision | ❌ **missing entirely** (no `mission-vision` page) |
| 1.3.3 Education Management → *Teachers* linked | ❌ no such link |
| 1.3.3.1 Class Schedule → linked | ❌ no public class-schedule page |
| 1.3.4 Tuition Fees and Others → linked | ⚠️ page exists, not linked from Home |

The Home page currently carries school stats, news and course teasers. The spec asks for a
narrative overview with four named subsections and three outbound links. This is the largest
content gap in the document.

### 2.2 BCSK (spec §2)

| Spec | Present | Note |
|---|---|---|
| About Us | ✅ `about-us` | |
| **Education System** | ⚠️ `education-process` | Rename — spec calls it *Education System*, and the required content (curriculum structure, teaching methodology, academic calendar, assessment, special programs, goals) is more detailed than the current page |
| Administration | ✅ `administration` | Needs the named leadership team + the IT-team paragraph |
| Teachers | ✅ `/bcsk/teachers` | Data incomplete — see §5 |
| Governing Body | ✅ `governing-body` | Needs the six "Key Activities" bullets |
| Regional Representatives | ✅ | Correctly shows *recruitment in progress* ✓ |

**Extra pages with no home in the spec:** `message-chairman`, `our-community`.
**Misplaced:** `message-principal` — the spec puts the Principal's Talk under **Contact** (§9), not BCSK.

### 2.3 Admission (spec §3)

Spec requires **4** items; the site has **7**.

| Spec | Present |
|---|---|
| Apply Now | ⚠️ `/apply` exists but is **not in the Admission dropdown** — only in the top bar |
| Admission Process | ✅ `admission-process` |
| Tuition Fees | ✅ `/admission/tuition-fee` |
| Special Course | ✅ `special-course` |

**Extra:** `regular-course`, `quran-department`, `re-admission`, `brochure`. Not wrong — but the school
did not ask for them, so confirm whether they stay before investing in their content.

### 2.4 Academic (spec §4)

| Spec | Present | Note |
|---|---|---|
| Curriculum | ✅ | Data incomplete — see §4 |
| Academic Calendar | ✅ | |
| Syllabus | ✅ | |
| **Books** | ⚠️ `book-list` | Rename to *Books*; fee amounts are blank in the spec |

The Academic dropdown also carries Deen, IELTS and Abacus links. Two of those become top-level
sections; Abacus needs a decision (see §3.3).

### 2.5 IELTS for Kids (§5), KOIE (§6), Student Corner (§7), Events (§8), Contact (§9)

- **IELTS for Kids** — page exists and is rich, but the spec's own copy is not used. Promote to top level.
- **KOIE** — the spec gives a full name (*Korea Online Islamic Education*) and body copy that does not
  exist on the site. The nearest page, `/courses/deen`, is framed as a course, not a programme.
- **Student Corner** — page and CMS model exist ✅; spec copy not used.
- **Events and News** — ✅ present. Spec says *"Need to add pictures"* → **awaiting school assets**.
- **Contact** — ✅ present, but must gain the **Principal's Talk** block (spec §9).

---

## 3. Money — the critical gaps

### 3.1 Tuition fees are all understated

Spec §3.3 (Session 2026, Semester 1) against the seeded `FeeConfig`:

| Class | Spec admission | DB admission | Spec semester | DB semester | Shortfall |
|---|---|---|---|---|---|
| Pre-Primary | 50,000 | 50,000 ✅ | **300,000** | 200,000 | **−100,000** |
| Class 1 | 50,000 | 50,000 ✅ | **400,000** | 300,000 | **−100,000** |
| Class 2 | 50,000 | 50,000 ✅ | **400,000** | 300,000 | **−100,000** |
| Class 3 | 50,000 | 50,000 ✅ | **400,000** | 300,000 | **−100,000** |
| Class 4 | 50,000 | 50,000 ✅ | **450,000** | 300,000 | **−150,000** |
| Class 5 | 50,000 | 50,000 ✅ | **450,000** | 300,000 | **−150,000** |

Every family currently applying is quoted — and charged — too little. This is a data fix
(`FeeConfig`, editable in Admin → Fee Configuration), not a code change.

### 3.2 IELTS for Kids pricing

| | Spec | Current |
|---|---|---|
| BCSK student | **100,000** | 150,000 + 30,000 admission = 180,000 |
| Non-BCSK student | **150,000** | 200,000 + 30,000 admission = 230,000 |

The spec describes IELTS as an **optional add-on** to a class, with no separate admission fee.
The system models it as a standalone special course that charges its own admission fee.

### 3.3 Abacus is charged twice — needs a decision

The spec states each class's semester fee is *"Including Abacus course"*, and lists Abacus as a
curriculum subject for Classes 1–5. The system models Abacus as a paid special course
(30,000 admission + 120,000/160,000). **A Class-3 family following the site today would pay the
class fee and then be offered Abacus again as a paid extra.**

### 3.4 Wrong bank

| | Spec §3.2 step 5 | Code (`src/lib/constants.ts`, `Setting`) |
|---|---|---|
| Bank | **Woori bank** | Hana Bank |
| Account no. | *(blank in the spec)* | 298-910032-72304 |

The site prints bank-transfer instructions on the payment page and in emails. If the school has
moved to Woori, **families are currently transferring to the wrong account.** This needs
confirmation before anything else in this document.

### 3.5 Other fee items

- **Book fees**: the spec's table is blank (`won` with no amount) for all six classes plus the debate
  and abacus books. The DB has values (30,000–50,000) of unknown provenance. **Awaiting school figures.**
- **Semester mismatch**: the spec's fee table is for *Session 2026, Semester 1*; the platform is set to
  `SEMESTER_CURRENT = "2026-2"`.
- **Special-course admission fees** (20,000–30,000) appear nowhere in the spec.
- ✅ *"No admission fee for 2nd semester"* is already implemented correctly in the re-admission flow.

---

## 4. Curriculum data (spec §4.1)

| Class | Spec subjects | Missing from DB |
|---|---|---|
| Pre-Primary | Bangla, English, **Math**, Islamic Religion | Math (DB has "Bangla & English (combined)") |
| Class 1–2 | Bangla, English, Math, Islamic Religion, **Abacus** | **Abacus** |
| Class 3–5 | Bangla, English, Math, Islamic/Hindu Religion, **Social Science**, Science, **Abacus** | **Abacus**; DB says *Bangladesh & Global Studies* where the spec says *Social Science* |

---

## 5. People data

| Spec | Current |
|---|---|
| 6 permanent teachers | 7 `TeacherProfile` rows total — but 2 are Principal and Vice Principal, leaving **5 teaching staff** |
| 5 semi-permanent teachers | ❌ none distinguished; no permanent/semi-permanent field |
| 1 IT officer | ❌ no record |
| Principal Dr. Manwar Hussain, PhD Materials Science & Engineering | ✅ present, but no qualification text |
| Vice Principal Dr. Kamrul Hasan, PhD Information & Communications Engineering | ✅ present, but no qualification text |
| Teacher photos and details | ⚠️ spec says *"Pic and details of teachers"* → **awaiting school assets** |

---

## 6. Admission process (spec §3.2)

| Spec step | Status |
|---|---|
| 1. Initial inquiry (email, two phone numbers, regional rep) | ✅ contact details match |
| 2. Application form | ⚠️ missing **preferred learning mode (online or hybrid)** |
| 3. Document verification: passport/ID copy, recent photo, previous school records | ⚠️ only the photo is collected — **no ID upload, no school-records upload** |
| 4. Admission confirmation email | ✅ implemented |
| 5. Fee payment | ⚠️ wrong bank (§3.4); **scholarships** mentioned in the spec are not modelled |
| 6. Orientation & class start | ❌ no orientation content or scheduling |

**Also unenforced:** the spec restricts admission to students **aged 5 and above**. The form accepts
any date of birth.

---

## 7. Questions the school must answer

These are places where the specification contradicts itself or leaves a blank. I have not guessed.

1. **Woori or Hana?** And what is the account number? (§3.2 leaves it blank.) — *blocks payments*
2. **Abacus:** bundled into the class semester fee, or charged separately? (§3.3 vs §3.4.6 conflict.)
3. **"IOM" or "KOIE"?** The table of contents says section 6 is *IOM*; the body says *KOIE*.
4. **Book fees** — all amounts are blank in the spec.
5. **Which semester is live** — the fee table says Session 2026 Semester 1; the platform says 2026-2.
6. **Home page numbering** — the contents list 1.1/1.2 Apply Now/1.3 School Overview, but the body
   numbers them 1.1/1.2 School Overview/1.2.1–1.2.3. Which structure is intended?
7. **Semester length** — §2.2 says each semester is five months, but Semester 2 (Sep 1 – Dec 31) is four.
8. **Do the extra pages stay?** `regular-course`, `quran-department`, `brochure`, `message-chairman`,
   `our-community` are live but unlisted in the spec.
9. **Quran Program for ladies only** (§3.4.5) has no course record — add it as a distinct course?
10. **Separate boys'/girls' Quran classes** (§3.4.3) — model as two courses, or one with sections?

### Copy corrections needed on ingest

The spec text contains typos that must not reach the live site: *ILTS/IELS* → **IELTS**;
*canter of excellence* → **centre**; *Student-Cantered* → **Student-Centred**; *sepeak* → **speak**;
*Principle Talk* → **Principal's Talk**; *"Why do you have to admit in BCSK?"* reads awkwardly in
English — suggest *"Why choose BCSK?"*.

---

## 8. Suggested sequencing

| Order | Work | Why first |
|---|---|---|
| 1 | Confirm the bank, then correct fee data | Money is moving to a possibly wrong account at wrong amounts |
| 2 | Resolve the Abacus billing question | Changes both fee data and curriculum data |
| 3 | Restructure the top-level navigation (9 sections) | Cheap, high visibility, unblocks content placement |
| 4 | Author the missing pages: Mission & Vision, Why BCSK, KOIE, Education System | Largest content gap; all are CMS pages, no code needed |
| 5 | Extend the admission form (learning mode, ID upload, age rule) | Schema + form change, so batch it |
| 6 | Complete people and curriculum data | Needs school-supplied photos and details |
| 7 | Move Principal's Talk to Contact; retire or adopt the orphan pages | Tidy-up once decisions are made |

Items 3–7 are ordinary content work. Only item 5 requires a migration.
