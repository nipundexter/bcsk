"use client";

import { useEffect, useState } from "react";
import { SCHOOL } from "@/lib/constants";

/**
 * The homepage hero visual. When the admin has uploaded photos (Admin → Homepage Slider,
 * capped at 5), those rotate — real content, so each gets real alt text and the region is
 * not hidden from assistive tech. With none uploaded yet, falls back to the three-language
 * illustration below, which *is* purely decorative (`aria-hidden`) — a screen reader gains
 * nothing from three foreign scripts read aloud.
 */
const BUBBLES = [
  {
    key: "bn",
    lang: "bn",
    text: "অ আ",
    bg: "bg-teal",
    corner: "rounded-[2rem] rounded-bl-md",
    tailBorder: "border-t-teal",
    tailPos: "-bottom-3 left-6",
  },
  {
    key: "en",
    lang: undefined,
    text: "ABC",
    bg: "bg-sunrise",
    corner: "rounded-[2.4rem] rounded-br-md",
    tailBorder: "border-t-sunrise",
    tailPos: "-bottom-3 right-6",
  },
  {
    key: "ko",
    lang: "ko",
    text: "한글",
    bg: "bg-sky",
    corner: "rounded-[2rem] rounded-bl-md",
    tailBorder: "border-t-sky",
    tailPos: "-bottom-3 left-6",
  },
] as const;

const INTERVAL_MS = 3000;

/** Cycles `0..count-1` every INTERVAL_MS; paused entirely when count <= 1. */
function useRotation(count: number) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [count]);
  return active;
}

export type HeroImage = { id: number; url: string; caption: string | null };

export function HeroLanguageSlider({ images = [] }: { images?: HeroImage[] }) {
  if (images.length > 0) return <PhotoSlider images={images} />;
  return <IllustrationSlider />;
}

function PhotoSlider({ images }: { images: HeroImage[] }) {
  const active = useRotation(images.length);

  return (
    <div
      className="relative h-72 sm:h-80 lg:h-[380px] rounded-3xl overflow-hidden shadow-md"
      role="region"
      aria-label={`${SCHOOL.name} — photos`}
    >
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.url}
          alt={img.caption ?? SCHOOL.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {images.map((img, i) => (
            <span
              key={img.id}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === active ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IllustrationSlider() {
  const active = useRotation(BUBBLES.length);

  return (
    <div className="relative h-72 sm:h-80 lg:h-[380px] select-none" aria-hidden>
      {/* one bubble at a time, crossfading in place */}
      <div className="absolute left-1/2 top-2 sm:top-4 -translate-x-1/2 w-32 h-28 sm:w-40 sm:h-32">
        {BUBBLES.map((b, i) => (
          <div
            key={b.key}
            className={`bubble-float absolute inset-0 flex items-center justify-center transition-opacity duration-700 motion-reduce:transition-none ${
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className={`relative ${b.bg} text-white ${b.corner} w-full h-full flex items-center justify-center shadow-md`}>
              <span lang={b.lang} className="text-4xl sm:text-5xl font-bold">
                {b.text}
              </span>
              <div
                className={`absolute ${b.tailPos} w-0 h-0 border-l-[14px] border-l-transparent border-t-[16px] ${b.tailBorder}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* the child beneath the bubbles: open book, shifted up to leave room for the dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-10">
        <svg width="220" height="130" viewBox="0 0 220 130" fill="none" aria-hidden>
          <ellipse cx="110" cy="122" rx="85" ry="8" fill="#F6ECD6" />
          <path
            d="M110 45c-14-12-38-16-60-10v62c22-6 46-2 60 10 14-12 38-16 60-10V35c-22-6-46-2-60 10Z"
            fill="#fff"
            stroke="#1D2B64"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M110 45v62" stroke="#1D2B64" strokeWidth="4" />
          <path
            d="M62 52c14-3 28-1 38 5M62 66c14-3 28-1 38 5M62 80c14-3 28-1 38 5M158 52c-14-3-28-1-38 5M158 66c-14-3-28-1-38 5M158 80c-14-3-28-1-38 5"
            stroke="#38A8DC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path d="m40 30 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" fill="#F5820B" />
          <path d="m184 22 2 4.8 4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2 2-4.8Z" fill="#0FB5A6" />
          <circle cx="170" cy="52" r="4" fill="#38A8DC" />
          <circle cx="52" cy="14" r="3" fill="#1D2B64" />
        </svg>
      </div>

      {/* position dots */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2">
        {BUBBLES.map((b, i) => (
          <span
            key={b.key}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === active ? "bg-navy" : "bg-navy/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
