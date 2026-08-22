/**
 * The shapes the API returns.
 *
 * Hand-written rather than imported from Prisma on purpose: the frontend must not depend on
 * the database schema. These describe the *contract*, which is narrower than the tables —
 * the backend deliberately omits fields (password hashes, staff contact details) that pages
 * have no business receiving.
 *
 * Dates arrive as ISO strings over JSON, not `Date` objects. Typing them as `string` is
 * honest; the previous code got `Date` from Prisma and called `.toLocaleDateString()` on it,
 * which is exactly the kind of thing that breaks silently across a network boundary.
 */

export type ISODate = string;

/* --------------------------------- people --------------------------------- */

export type Role = "STUDENT" | "TEACHER" | "ADMIN_SUPPORT" | "IT_SUPPORT" | "SUPER_ADMIN";

export type UserRow = {
  id: number;
  loginId: string;
  name: string;
  email: string | null;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: ISODate;
};

export type StudentProfile = {
  id: number;
  userId: number;
  studentId: string;
  classLevel: string;
  photoUrl: string | null;
  dob: ISODate | null;
  gender: string | null;
  religion: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  addressKorea: string | null;
  addressBangladesh: string | null;
  emergencyContact: string | null;
};

export type TeacherRow = {
  id: number;
  teacherId: string;
  designation: string | null;
  subjects: string | null;
  bio: string | null;
  photoUrl: string | null;
  guideClass: string | null;
  displayOrder: number;
  user: { name: string };
};

/* -------------------------------- academic -------------------------------- */

export type CourseLevel = {
  id: number;
  courseId: number;
  name: string;
  displayOrder: number;
  syllabus: string | null;
  studentBookUrl: string | null;
  workBookUrl: string | null;
};

export type Course = {
  id: number;
  slug: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  heroText: string | null;
  active: boolean;
  displayOrder: number;
  levels?: CourseLevel[];
  sessions?: ClassSession[];
};

/**
 * A course as `/public/courses/:slug` returns it — levels and this semester's sessions are
 * always present, so pages need no optional chaining. The looser `Course` above is what list
 * endpoints return.
 */
export type CourseDetail = Course & {
  levels: CourseLevel[];
  sessions: ClassSession[];
};

export type ClassSession = {
  id: number;
  courseId: number;
  courseLevelId: number | null;
  title: string;
  classLevel: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string | null;
  semester: string;
  teacherId: number | null;
  zoomLink: string | null;
  isLive: boolean;
  notice: string | null;
  active: boolean;
  course?: Course;
  level?: CourseLevel | null;
  teacher?: { userId: number; user: { name: string } } | null;
  _count?: { enrollments: number };
};

export type CurriculumEntry = {
  id: number;
  classLevel: string;
  subject: string;
  details: string | null;
  displayOrder: number;
};

/** A student as related records reference them. */
export type StudentRef = { id: number; name: string; studentProfile: StudentProfile | null };

export type Enrollment = {
  id: number;
  studentUserId: number;
  classSessionId: number;
  semester: string;
  status: string;
  classSession: ClassSession;
  student?: StudentRef;
};

export type Assignment = {
  id: number;
  classSessionId: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  dueDate: ISODate | null;
  createdAt: ISODate;
  classSession?: { title: string };
  submissions?: Submission[];
};

export type Submission = {
  id: number;
  assignmentId: number;
  studentUserId: number;
  fileUrl: string | null;
  text: string | null;
  submittedAt: ISODate;
  grade: string | null;
  feedback: string | null;
  gradedAt: ISODate | null;
  student?: StudentRef;
};

export type ClassVideo = {
  id: number;
  classSessionId: number;
  title: string;
  videoUrl: string;
  recordedAt: ISODate;
  classSession?: { title: string };
};

export type Attendance = {
  id: number;
  classSessionId: number;
  studentUserId: number;
  date: ISODate;
  status: string;
  /** Always present from /classroom/attendance. */
  classSession: { title: string };
};

export type ExamResult = {
  id: number;
  studentUserId: number;
  semester: string;
  subject: string;
  fullMarks: number;
  marks: number;
  grade: string | null;
  remark: string | null;
};

export type ProgressRecord = {
  id: number;
  courseSlug: string;
  label: string;
  score: string;
  note: string | null;
  recordedAt: ISODate;
};

export type HifzProgress = { id: number; surahNumber: number; surahName: string; juz: number | null; completedAt: ISODate };
export type GameScore = { id: number; game: string; level: number; score: number; createdAt: ISODate };

export type Notification = {
  id: number;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  read: boolean;
  createdAt: ISODate;
};

export type Question = {
  id: number;
  studentUserId: number;
  teacherUserId: number | null;
  subject: string;
  body: string;
  answer: string | null;
  answeredAt: ISODate | null;
  createdAt: ISODate;
  student?: StudentRef;
};

export type TeacherTask = {
  id: number;
  title: string;
  detail: string | null;
  done: boolean;
  dueDate: ISODate | null;
};

/* -------------------------------- admission ------------------------------- */

export type ApplicationForm = {
  id: number;
  type: string;
  status: string;
  applicantName: string;
  dob: ISODate | null;
  gender: string | null;
  religion: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  addressKorea: string | null;
  addressBangladesh: string | null;
  emergencyContact: string | null;
  grade: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianProfession: string | null;
  guardianEducation: string | null;
  guardianPhone2: string | null;
  courseName: string | null;
  highestEducation: string | null;
  isBcskStudent: boolean;
  parentalConsent: boolean;
  adminNote: string | null;
  correctionNote: string | null;
  createdStudentUserId: number | null;
  createdAt: ISODate;
  payments?: Payment[];
};

export type Payment = {
  id: number;
  applicationId: number | null;
  payerUserId: number | null;
  purpose: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  gatewayTxnId: string | null;
  virtualRef: string | null;
  receiptUploadUrl: string | null;
  receiptPdfSerial: string | null;
  rejectReason: string | null;
  verifiedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  application?: { applicantName: string } | null;
  payer?: { name: string } | null;
  verifiedBy?: { name: string } | null;
};

export type FeeConfig = {
  id: number;
  key: string;
  label: string;
  kind: string;
  admissionFee: number;
  semesterFee: number;
  bcskPrice: number | null;
  nonBcskPrice: number | null;
  bookFee: number | null;
  displayOrder: number;
  active: boolean;
};

/* --------------------------------- content -------------------------------- */

export type ContentPageRow = {
  id: number;
  slug: string;
  lang: string;
  title: string;
  content: string;
  status: string;
  updatedAt: ISODate;
};

export type EventNews = {
  id: number;
  type: string;
  title: string;
  body: string;
  imageUrl: string | null;
  date: ISODate;
  published: boolean;
};

export type GalleryItem = { id: number; albumId: number; type: string; url: string; caption: string | null };
export type GalleryAlbum = { id: number; title: string; category: string | null; coverUrl: string | null; items: GalleryItem[] };

export type StudentCornerPost = {
  id: number;
  title: string;
  body: string;
  studentName: string;
  kind: string;
  imageUrl: string | null;
  published: boolean;
  createdAt: ISODate;
};

export type GoverningMemberRow = {
  id: number;
  kind: string;
  name: string;
  role: string;
  organization: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  bio: string | null;
  displayOrder: number;
};

export type SupportTicket = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  reply: string | null;
  createdAt: ISODate;
};

export type AuditLogRow = {
  id: number;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: ISODate;
  user: { loginId: string; name: string } | null;
};

export type Setting = { key: string; value: string };

export type DashboardStats = {
  paymentsToVerify: number;
  openApplications: number;
  openTickets: number;
  students: number;
  teachers: number;
  unanswered: number;
};
