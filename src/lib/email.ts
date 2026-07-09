import nodemailer from "nodemailer";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * SMTP email (4.3). If SMTP_HOST is configured, mail is sent for real;
 * otherwise (dev / credentials pending) the message is written to storage/outbox
 * so flows remain fully testable.
 */
export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.SMTP_FROM ?? "BCSK <bcskr22@gmail.com>";
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({ from, to, subject, html });
    return { simulated: false };
  }
  // Simulated outbox. On hosts with a writable disk the message is saved to
  // storage/outbox; on serverless (read-only FS) it is logged instead — either
  // way the calling flow never fails because SMTP isn't configured yet.
  try {
    const dir = join(process.cwd(), "storage", "outbox");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${Date.now()}-${subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.html`);
    writeFileSync(
      file,
      `<!-- SIMULATED EMAIL (no SMTP configured)\nTo: ${to}\nFrom: ${from}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n-->\n${html}`
    );
    console.log(`[email:simulated] to=${to} subject="${subject}" -> ${file}`);
  } catch {
    console.log(`[email:simulated] to=${to} subject="${subject}" (read-only FS — logged only)`);
  }
  return { simulated: true };
}

export function emailLayout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:#1d2b64;color:#ffffff;padding:20px 28px">
      <p style="margin:0;font-size:18px;font-weight:bold">Bangladesh Community School, Korea</p>
      <p style="margin:4px 0 0;font-size:12px;color:#d9eef8">বাংলাদেশ কমিউনিটি স্কুল, কোরিয়া</p>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#1d2b64">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;background:#fbf6ea;font-size:11px;color:#5b5b6b">
      bcskr22@gmail.com · +82 10-6893-6237 · Yongin-si, Gyeonggi-do, South Korea
    </div>
  </div></body></html>`;
}
