import { requireStudent } from "@/lib/auth";

/** FR-STU-05/09: document downloads hub. */
export default async function DocumentsPage() {
  await requireStudent();
  const docs = [
    {
      href: "/api/documents/certificate",
      title: "Enrollment Certificate",
      desc: "Official PDF certificate of current enrollment, signed by the Principal.",
      icon: "📜",
    },
    {
      href: "/api/documents/id-card",
      title: "Digital ID Card",
      desc: "Printable student ID card with a QR verification code.",
      icon: "🪪",
    },
    {
      href: "/api/documents/result-sheet",
      title: "Result Sheet",
      desc: "Latest semester result sheet as PDF.",
      icon: "📈",
    },
  ];
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Documents & Certificates</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        {docs.map((d) => (
          <a key={d.href} href={d.href} className="bg-white rounded-2xl border border-line p-6 hover:shadow-md transition-shadow">
            <span className="text-3xl" aria-hidden>{d.icon}</span>
            <h2 className="mt-3 font-bold text-navy">{d.title}</h2>
            <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">{d.desc}</p>
            <span className="inline-block mt-3 text-sunrise text-xs font-bold uppercase tracking-wide">Download PDF →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
