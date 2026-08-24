import "server-only";
import { api } from "./api-client";
import type * as T from "./types";

export * from "./types";
export { api, ApiError, toActionError } from "./api-client";

/**
 * Typed access to the backend, grouped by domain.
 *
 * Pages and Server Actions import from here rather than calling `api.get("/some/path")`
 * inline: one place knows the URL shapes and the response types, so a route change is one
 * edit rather than a search across 80 files.
 *
 * Reads that are the same for everyone are cached; anything scoped to a person is not.
 */

/* ----------------------------- public content ----------------------------- */

export type CmsPageResponse = { slug: string; lang: string; title: string; html: string; updatedAt: T.ISODate };
export type PublicTeacher = {
  teacherId: string; name: string; designation: string | null;
  subjects: string | null; bio: string | null; photoUrl: string | null;
};

export const cms = {
  page: (slug: string, lang = "en") =>
    api.public<CmsPageResponse>(`/cms/pages/${slug}?lang=${lang}`, 60, [`cms:${slug}`]),
  news: (limit = 20) => api.public<T.EventNews[]>(`/cms/news?limit=${limit}`, 60, ["cms:news"]),
  newsByType: (type: string, limit = 50) =>
    api.public<T.EventNews[]>(`/cms/news?type=${type}&limit=${limit}`, 60, ["cms:news"]),
  newsItem: (id: number) => api.public<T.EventNews & { html: string }>(`/cms/news/${id}`, 60, ["cms:news"]),
  teachers: () => api.public<PublicTeacher[]>("/cms/teachers", 300, ["cms:teachers"]),
  governingBody: () => api.public<T.GoverningMemberRow[]>("/cms/governing-body", 300),
  regionalReps: () => api.public<T.GoverningMemberRow[]>("/cms/regional-representatives", 300),
  fees: () => api.public<T.FeeConfig[]>("/cms/fees", 300, ["cms:fees"]),
  gallery: () => api.public<T.GalleryAlbum[]>("/cms/gallery", 300),
};

export const files = {
  /** Returns the stored path to hand to whichever record references it. */
  upload: (file: File, folder: string) => api.upload(file, folder),
};

export const site = {
  curriculum: () => api.public<T.CurriculumEntry[]>("/public/curriculum", 300),
  studentCorner: () => api.public<T.StudentCornerPost[]>("/public/student-corner", 60),
  course: (slug: string) => api.public<T.CourseDetail | null>(`/public/courses/${slug}`, 300),
  search: (q: string, lang = "en") =>
    api.public<{ pages: T.ContentPageRow[]; courses: T.Course[]; news: T.EventNews[] }>(
      `/public/search?q=${encodeURIComponent(q)}&lang=${lang}`,
      0,
    ),
  specialCourses: () => api.public<T.Course[]>("/public/special-courses", 300),
  /** Homepage "campus right now" widget. Short cache — reflects real teacher-toggled state. */
  campusStatus: () => api.public<T.CampusStatus>("/public/campus-status", 30),
  heroImages: () => api.public<T.HeroImage[]>("/public/hero-images", 300),
  /** Answers for anonymous visitors too — an empty list, not an error. */
  enrolledCourseSlugs: () => api.get<string[]>("/classroom/enrolled-courses"),
  recordGameScore: (game: string, level: number, score: number) =>
    api.post<{ recorded: boolean }>("/classroom/game-score", { game, level, score }),
  recordPracticeScore: (score: number, total: number) =>
    api.post<{ recorded: boolean }>("/classroom/practice-score", { score, total }),
  contact: (input: Record<string, unknown>) => api.post<{ ok: boolean }>("/public/contact", input, { auth: false }),
  verify: (serial: string) =>
    api.public<
      | { valid: false; serial: string }
      | { valid: true; serial: string; type: string; studentName: string; studentId: string | null; issuedAt: T.ISODate }
    >(`/verify/${encodeURIComponent(serial)}`, 0),
};

/* -------------------------------- admission -------------------------------- */

export type ApplicationCreated = { applicationId: number; paymentToken: string };

export const admissions = {
  submitRegular: (input: Record<string, unknown>) =>
    api.post<ApplicationCreated>("/admissions/regular", input, { auth: false }),
  submitSpecial: (input: Record<string, unknown>) =>
    api.post<ApplicationCreated>("/admissions/special", input, { auth: false }),
  /**
   * The staff queue. Cursor-paginated server-side, so a limit is passed explicitly rather
   * than relying on the 25-row default the admin table would silently truncate to.
   */
  list: (status?: string, limit = 100) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (status) qs.set("status", status);
    return api.get<T.ApplicationForm[]>(`/admissions?${qs}`);
  },
  one: (id: number) => api.get<T.ApplicationForm>(`/admissions/${id}`),
  /** SEC-7: the applicant's own view, gated by the same capability token as payment. */
  summary: (id: number, token: string) =>
    api.public<{
      id: number; type: string; status: string; applicantName: string; email: string | null;
      courseName: string | null; grade: string | null;
      payments: { id: number; status: string; amount: number; method: string; virtualRef: string | null }[];
    }>(`/admissions/${id}/summary?token=${encodeURIComponent(token)}`, 0),
  approve: (id: number) => api.post<unknown>(`/admissions/${id}/approve`),
  reject: (id: number, reason: string) => api.post<unknown>(`/admissions/${id}/reject`, { reason }),
  /** Sends the application back to the applicant with a note; it stays in the queue. */
  requestCorrections: (id: number, note: string) =>
    api.post<unknown>(`/admissions/${id}/corrections`, { note }),
};

/* --------------------------------- payment --------------------------------- */

export type Quote = { applicationId: number; applicantName: string; amount: number; breakdown: string };

export const payments = {
  /** SEC-3: the amount comes from the server. A client never proposes a price. */
  quote: (applicationId: number, token: string) =>
    api.public<Quote>(`/payments/quote/${applicationId}?token=${encodeURIComponent(token)}`, 0),
  createCardOrder: (applicationId: number, token: string) =>
    api.post<{ orderId: string; amount: number }>("/payments/card-order", { applicationId, token }, { auth: false }),
  /** Publishable gateway config. The secret key never reaches the frontend. */
  config: () => api.public<{ cardEnabled: boolean; clientKey: string }>("/payments/config", 60),
  mine: () => api.get<T.Payment[]>("/payments/mine"),
  list: () => api.get<T.Payment[]>("/payments"),
};

/* -------------------------------- classroom -------------------------------- */

export type ClassroomDashboard = {
  profile: T.StudentProfile | null;
  enrollments: T.Enrollment[];
  notifications: T.Notification[];
  semester: string;
};

export const classroom = {
  dashboard: () => api.get<ClassroomDashboard>("/classroom/dashboard"),
  /** The class title and this student's submission are always included. */
  assignments: () =>
    api.get<(T.Assignment & { classSession: { title: string }; submissions: T.Submission[] })[]>(
      "/classroom/assignments",
    ),
  submit: (assignmentId: number, text?: string, filePath?: string) =>
    api.post<T.Submission>("/classroom/assignments/submit", { assignmentId, text, filePath }),
  results: () =>
    api.get<{ exams: T.ExamResult[]; progress: T.ProgressRecord[]; hifz: T.HifzProgress[]; games: T.GameScore[] }>(
      "/classroom/results",
    ),
  attendance: () => api.get<T.Attendance[]>("/classroom/attendance"),
  routine: () => api.get<T.ClassSession[]>("/classroom/routine"),
  videos: () => api.get<(T.ClassVideo & { classSession: { title: string } })[]>("/classroom/videos"),
  teachers: () =>
    api.get<{ userId: number; name: string; designation: string | null; subjects: string | null }[]>(
      "/classroom/teachers",
    ),
  syllabus: () =>
    api.get<{
      classSessionId: number; title: string; courseName: string; levelName: string | null;
      syllabus: string | null; studentBookUrl: string | null; workBookUrl: string | null;
    }[]>("/classroom/syllabus"),
  reAdmissionInfo: () =>
    api.get<{
      classLevel: string;
      studentId: string;
      semesterFee: number | null;
      existing: { id: number; status: string; amount: number; virtualRef: string | null } | null;
      semester: string;
    }>("/classroom/re-admission"),
  submitReAdmission: (receiptPath: string) =>
    api.post<{ virtualRef: string; amount: number }>("/classroom/re-admission", { receiptPath }),
  questions: () => api.get<T.Question[]>("/classroom/questions"),
  ask: (teacherUserId: number, subject: string, body: string) =>
    api.post<T.Question>("/classroom/questions", { teacherUserId, subject, body }),
};

/* ---------------------------------- office ---------------------------------- */

/** Everything the class page renders. The relations are always populated here. */
export type ClassDetail = {
  classSession: T.ClassSession;
  roster: (Omit<T.Enrollment, "student"> & { student: T.StudentRef })[];
  assignments: (Omit<T.Assignment, "submissions"> & {
    submissions: (Omit<T.Submission, "student"> & { student: T.StudentRef })[];
  })[];
  videos: T.ClassVideo[];
  todayAttendance: T.Attendance[];
};

export const office = {
  dashboard: () =>
    api.get<{
      profile: T.TeacherRow;
      sessions: (T.ClassSession & { _count: { enrollments: number } })[];
      notifications: T.Notification[];
      openQuestions: number;
    }>("/office/dashboard"),
  /** Guardian contacts, scoped to the classes this teacher actually teaches. */
  guardians: () =>
    api.get<
      (T.ClassSession & {
        enrollments: (Omit<T.Enrollment, "student"> & { student: T.StudentRef })[];
      })[]
    >("/office/guardians"),
  classes: () => api.get<(T.ClassSession & { _count: { enrollments: number } })[]>("/office/classes"),
  classDetail: (id: number) => api.get<ClassDetail>(`/office/classes/${id}`),
  setLive: (id: number, live: boolean, zoomLink?: string) =>
    api.patch<T.ClassSession>(`/office/classes/${id}/live`, { live, zoomLink }),
  markAttendance: (id: number, date: string, entries: { studentUserId: number; status: string }[]) =>
    api.post<{ updated: number }>(`/office/classes/${id}/attendance`, { date, entries }),
  postAssignment: (id: number, input: Record<string, unknown>) =>
    api.post<T.Assignment>(`/office/classes/${id}/assignments`, input),
  addVideo: (id: number, title: string, videoUrl: string) =>
    api.post<T.ClassVideo>(`/office/classes/${id}/videos`, { title, videoUrl }),
  grade: (submissionId: number, grade: string, feedback?: string) =>
    api.post<T.Submission>(`/office/submissions/${submissionId}/grade`, { grade, feedback }),
  questions: () => api.get<(Omit<T.Question, "student"> & { student: T.StudentRef })[]>("/office/questions"),
  answer: (id: number, answer: string) => api.post<T.Question>(`/office/questions/${id}/answer`, { answer }),
  tasks: () => api.get<T.TeacherTask[]>("/office/tasks"),
  toggleTask: (id: number, done: boolean) => api.patch<T.TeacherTask>(`/office/tasks/${id}`, { done }),
};

/* ---------------------------------- users ----------------------------------- */

export const users = {
  list: () => api.get<T.UserListRow[]>("/users"),
  create: (input: Record<string, unknown>) =>
    api.post<{ loginId: string; temporaryPassword: string }>("/users", input),
  resetPassword: (id: number) => api.post<{ temporaryPassword: string }>(`/users/${id}/reset-password`),
  setActive: (id: number, active: boolean) => api.patch<unknown>(`/users/${id}/active`, { active }),
};

/* ---------------------------------- admin ----------------------------------- */

export const admin = {
  dashboard: () => api.get<T.DashboardStats>("/admin/dashboard"),

  pages: () => api.get<T.ContentPageRow[]>("/admin/pages"),
  page: (slug: string, lang: string) => api.get<T.ContentPageRow | null>(`/admin/pages/${slug}/${lang}`),
  savePage: (input: { slug: string; lang: string; title: string; content: string; publish: boolean }) =>
    api.post<T.ContentPageRow>("/admin/pages", input),
  deletePage: (slug: string, lang: string) => api.delete<unknown>(`/admin/pages/${slug}/${lang}`),

  news: () => api.get<T.EventNews[]>("/admin/news"),
  saveNews: (input: Record<string, unknown>) => api.post<T.EventNews>("/admin/news", input),
  deleteNews: (id: number) => api.delete<unknown>(`/admin/news/${id}`),

  albums: () => api.get<T.GalleryAlbum[]>("/admin/gallery"),
  createAlbum: (title: string, category: string | null) =>
    api.post<T.GalleryAlbum>("/admin/gallery/albums", { title, category }),
  addGalleryItem: (albumId: number, url: string, caption: string | null) =>
    api.post<T.GalleryItem>("/admin/gallery/items", { albumId, url, caption }),
  deleteGalleryItem: (id: number) => api.delete<unknown>(`/admin/gallery/items/${id}`),
  deleteAlbum: (id: number) => api.delete<unknown>(`/admin/gallery/albums/${id}`),

  heroImages: () => api.get<T.HeroImage[]>("/admin/hero-images"),
  addHeroImage: (url: string, caption: string | null) =>
    api.post<T.HeroImage>("/admin/hero-images", { url, caption }),
  deleteHeroImage: (id: number) => api.delete<unknown>(`/admin/hero-images/${id}`),

  members: () => api.get<T.GoverningMemberRow[]>("/admin/governing"),
  saveMember: (input: Record<string, unknown>) => api.post<T.GoverningMemberRow>("/admin/governing", input),
  deleteMember: (id: number) => api.delete<unknown>(`/admin/governing/${id}`),

  cornerPosts: () => api.get<T.StudentCornerPost[]>("/admin/student-corner"),
  saveCornerPost: (input: Record<string, unknown>) =>
    api.post<T.StudentCornerPost>("/admin/student-corner", input),
  deleteCornerPost: (id: number) => api.delete<unknown>(`/admin/student-corner/${id}`),

  courses: () => api.get<(Omit<T.Course, "levels"> & { levels: T.CourseLevel[] })[]>("/admin/courses"),
  updateCourse: (id: number, input: Record<string, unknown>) => api.patch<T.Course>(`/admin/courses/${id}`, input),
  updateLevel: (id: number, input: Record<string, unknown>) => api.patch<T.CourseLevel>(`/admin/levels/${id}`, input),
  addLevel: (courseId: number) => api.post<T.CourseLevel>(`/admin/courses/${courseId}/levels`),

  fees: () => api.get<T.FeeConfig[]>("/admin/fees"),
  updateFee: (id: number, input: Record<string, unknown>) => api.patch<T.FeeConfig>(`/admin/fees/${id}`, input),

  /** Course, level, teacher and enrolment count are always populated here. */
  sessions: () =>
    api.get<(T.ClassSession & { _count: { enrollments: number } })[]>("/admin/sessions"),
  teachers: () => api.get<T.TeacherRow[]>("/admin/teachers"),
  updateSession: (id: number, input: Record<string, unknown>) =>
    api.patch<T.ClassSession>(`/admin/sessions/${id}`, input),
  createSession: (input: Record<string, unknown>) => api.post<T.ClassSession>("/admin/sessions", input),

  tickets: () => api.get<T.SupportTicket[]>("/admin/tickets"),
  replyTicket: (id: number, reply: string, close: boolean) =>
    api.post<T.SupportTicket>(`/admin/tickets/${id}/reply`, { reply, close }),
  setTicketStatus: (id: number, status: string) =>
    api.patch<T.SupportTicket>(`/admin/tickets/${id}/status`, { status }),

  students: () =>
    api.get<(T.UserRow & { studentProfile: T.StudentProfile | null; _count: { examResults: number } })[]>(
      "/admin/students",
    ),
  addResult: (input: Record<string, unknown>) => api.post<T.ExamResult>("/admin/results", input),

  /**
   * The audit log is genuinely long-lived and append-only, so it is the one admin read that
   * pages: `nextCursor` comes back with the rows and drives the "older entries" link.
   */
  auditLog: (cursor?: string, limit = 100) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    return api.getPage<T.AuditLogRow>(`/admin/audit?${qs}`);
  },

  settings: () => api.get<T.Setting[]>("/admin/settings"),
  saveSettings: (values: Record<string, string>) => api.post<{ updated: number }>("/admin/settings", values),

  verifyPayment: (id: number) => api.post<unknown>(`/admin/payments/${id}/verify`),
  rejectPayment: (id: number, reason: string) => api.post<unknown>(`/admin/payments/${id}/reject`, { reason }),
  refundPayment: (id: number, reason: string) => api.post<unknown>(`/admin/payments/${id}/refund`, { reason }),
};

/** Settings as a plain map, which is how pages consume them. */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await api.public<T.Setting[]>("/public/settings", 300).catch(() => [] as T.Setting[]);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(keys.map((k) => [k, map[k] ?? ""]));
}
