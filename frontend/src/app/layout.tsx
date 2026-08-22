import type { Metadata } from "next";
import { Fraunces, Nunito_Sans, Hind_Siliguri, Noto_Sans_KR } from "next/font/google";
import { getLang } from "@/lib/i18n";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});
const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
});
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-bangla",
  weight: ["400", "500", "600", "700"],
});
const notoKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-korean",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bangladesh Community School, Korea (BCSK)",
    template: "%s | BCSK",
  },
  description:
    "The first Bangladeshi community school in South Korea — NCTB curriculum from Pre-Primary to Class 5, Qur'an & Islamic studies, IELTS for Kids, Abacus, and more.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${fraunces.variable} ${nunito.variable} ${hindSiliguri.variable} ${notoKr.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
