"use client";

import { useState } from "react";
import { recordPracticeScore } from "./actions";

const QUESTIONS = [
  {
    skill: "Reading",
    q: "Mina has a red kite. She flies it in the park on windy days. — Where does Mina fly her kite?",
    options: ["At school", "In the park", "At home", "On the beach"],
    answer: 1,
  },
  {
    skill: "Vocabulary",
    q: "Which word means the OPPOSITE of 'happy'?",
    options: ["Glad", "Sad", "Sunny", "Fast"],
    answer: 1,
  },
  {
    skill: "Grammar",
    q: "Choose the correct sentence:",
    options: ["She go to school.", "She goes to school.", "She going school.", "She gone to school."],
    answer: 1,
  },
  {
    skill: "Listening (read-aloud)",
    q: "'Please open your books to page ten.' — What should the students do?",
    options: ["Close their books", "Open page ten", "Stand up", "Sing a song"],
    answer: 1,
  },
  {
    skill: "Writing",
    q: "Which is the best ending for: 'On Saturday, I …'",
    options: ["play with my friends.", "plays with my friends.", "playing my friends.", "played with friends tomorrow."],
    answer: 0,
  },
];

export function PracticeQuiz({ enrolled, studentUserId }: { enrolled: boolean; studentUserId: number | null }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const q = QUESTIONS[i];

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    const correct = idx === q.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(async () => {
      if (i + 1 < QUESTIONS.length) {
        setI(i + 1);
        setPicked(null);
      } else {
        setDone(true);
        const final = score + (correct ? 1 : 0);
        if (enrolled && studentUserId) {
          await recordPracticeScore(final, QUESTIONS.length);
          setSaved(true);
        }
      }
    }, 900);
  }

  function restart() {
    setI(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setSaved(false);
  }

  if (done) {
    return (
      <div className="bg-white border border-line rounded-3xl p-8 max-w-xl text-center">
        <p className="text-4xl" aria-hidden>{score >= 4 ? "🌟" : score >= 3 ? "👏" : "💪"}</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-navy">
          {score} / {QUESTIONS.length} correct
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          {score >= 4 ? "Excellent! Ready for the next level." : score >= 3 ? "Good work — keep practicing!" : "Nice try — practice makes perfect!"}
          {saved && <span className="block mt-1 text-teal font-bold">Saved to your progress report ✓</span>}
        </p>
        <button onClick={restart} className="mt-5 bg-navy hover:bg-navy-deep text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-3xl p-8 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-extrabold uppercase tracking-wide text-sky">{q.skill}</span>
        <span className="text-xs font-bold text-ink-soft">
          {i + 1} / {QUESTIONS.length}
        </span>
      </div>
      <p className="font-bold text-ink leading-relaxed">{q.q}</p>
      <div className="mt-5 grid gap-2.5">
        {q.options.map((opt, idx) => {
          const state =
            picked === null ? "idle" : idx === q.answer ? "correct" : idx === picked ? "wrong" : "idle";
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`text-left text-sm font-semibold rounded-xl border-2 px-4 py-3 transition-colors ${
                state === "correct"
                  ? "border-teal bg-teal/10 text-teal"
                  : state === "wrong"
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-line hover:border-sky text-ink"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
