"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

/** Ensure the logged-in teacher owns this class session. */
async function ownSession(classSessionId: number) {
  const session = await requireTeacher();
  const cs = await db.classSession.findUnique({
    where: { id: classSessionId },
    include: { teacher: true },
  });
  if (!cs || cs.teacher?.userId !== session.userId) throw new Error("Not your class");
  return { teacher: session, cs };
}

/** FR-TCH-03: start/end a live session. */
export async function toggleLive(classSessionId: number, live: boolean, zoomLink?: string) {
  const { cs } = await ownSession(classSessionId);
  await db.classSession.update({
    where: { id: cs.id },
    data: { isLive: live, ...(zoomLink ? { zoomLink } : {}) },
  });
  revalidatePath(`/office/classes/${cs.id}`);
  revalidatePath("/classroom/dashboard");
}

/** FR-TCH-03: mark attendance for today's session. */
export async function markAttendance(classSessionId: number, formData: FormData) {
  const { cs } = await ownSession(classSessionId);
  const dateStr = String(formData.get("date") ?? new Date().toISOString().slice(0, 10));
  const date = new Date(dateStr + "T00:00:00Z");
  const entries = [...formData.entries()].filter(([k]) => k.startsWith("att-"));
  for (const [key, value] of entries) {
    const studentUserId = Number(key.slice(4));
    await db.attendance.upsert({
      where: { classSessionId_studentUserId_date: { classSessionId: cs.id, studentUserId, date } },
      update: { status: String(value) },
      create: { classSessionId: cs.id, studentUserId, date, status: String(value) },
    });
  }
  revalidatePath(`/office/classes/${cs.id}`);
}

export type TeacherFormState = { ok?: boolean; error?: string } | null;

/** FR-TCH-04: post an assignment. */
export async function postAssignment(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const classSessionId = Number(formData.get("classSessionId"));
  const { cs } = await ownSession(classSessionId);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!title) return { error: "Give the assignment a title." };

  let fileUrl: string | null = null;
  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    const saved = await saveUpload(file, "assignments", 10 * 1024 * 1024);
    if ("error" in saved) return { error: saved.error };
    fileUrl = saved.path;
  }

  const assignment = await db.assignment.create({
    data: {
      classSessionId: cs.id,
      title,
      description: description || null,
      fileUrl,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  // FR-STU-06: reminder for each enrolled student
  const enrolled = await db.enrollment.findMany({ where: { classSessionId: cs.id, status: "ACTIVE" } });
  await db.notification.createMany({
    data: enrolled.map((e) => ({
      userId: e.studentUserId,
      title: `New assignment: ${title}`,
      body: `${cs.title}${dueDate ? ` · due ${dueDate}` : ""}`,
      kind: "ASSIGNMENT",
      link: "/classroom/assignments",
    })),
  });
  void assignment;
  revalidatePath(`/office/classes/${cs.id}`);
  return { ok: true };
}

/** FR-TCH-04: grade a submission. */
export async function gradeSubmission(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const submissionId = Number(formData.get("submissionId"));
  const grade = String(formData.get("grade") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!grade) return { error: "Enter a grade." };

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { classSession: { include: { teacher: true } } } } },
  });
  const session = await requireTeacher();
  if (!sub || sub.assignment.classSession.teacher?.userId !== session.userId) {
    return { error: "Not your class." };
  }
  await db.submission.update({
    where: { id: submissionId },
    data: { grade, feedback: feedback || null, gradedAt: new Date() },
  });
  await db.notification.create({
    data: {
      userId: sub.studentUserId,
      title: `Graded: ${sub.assignment.title}`,
      body: `Grade ${grade}`,
      kind: "ASSIGNMENT",
      link: "/classroom/assignments",
    },
  });
  revalidatePath(`/office/classes/${sub.assignment.classSessionId}`);
  return { ok: true };
}

/** FR-TCH-04: upload/link a class video. */
export async function addClassVideo(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const classSessionId = Number(formData.get("classSessionId"));
  const { cs } = await ownSession(classSessionId);
  const title = String(formData.get("title") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (!title || !videoUrl) return { error: "Provide a title and a video link (YouTube/Zoom recording URL)." };
  try {
    const u = new URL(videoUrl);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error();
  } catch {
    return { error: "The video link must be a valid http(s) URL." };
  }
  await db.classVideo.create({ data: { classSessionId: cs.id, title, videoUrl } });
  revalidatePath(`/office/classes/${cs.id}`);
  return { ok: true };
}
