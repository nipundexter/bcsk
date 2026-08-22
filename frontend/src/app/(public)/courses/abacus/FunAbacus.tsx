"use client";

import { useEffect, useRef, useState } from "react";
import { recordGameScore } from "./actions";

type Mode = "flash-race" | "balloon-pop";

/** FR-ABC-07: gamified practice — Flash Race (flash anzan) and Balloon Pop (quick sums). */
export function FunAbacus({ loggedIn }: { loggedIn: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <div className="max-w-3xl">
      {!mode && (
        <div className="grid sm:grid-cols-2 gap-5">
          <button onClick={() => setMode("flash-race")} className="text-left bg-gradient-to-br from-sky to-navy text-white rounded-3xl p-8 hover:scale-[1.02] transition-transform">
            <span className="text-4xl" aria-hidden>⚡</span>
            <h3 className="mt-3 font-display text-2xl font-semibold">Flash Race</h3>
            <p className="mt-1.5 text-sm text-white/80">Numbers flash one by one — keep the running sum in your head, anzan style!</p>
          </button>
          <button onClick={() => setMode("balloon-pop")} className="text-left bg-gradient-to-br from-sunrise to-red-500 text-white rounded-3xl p-8 hover:scale-[1.02] transition-transform">
            <span className="text-4xl" aria-hidden>🎈</span>
            <h3 className="mt-3 font-display text-2xl font-semibold">Balloon Pop</h3>
            <p className="mt-1.5 text-sm text-white/80">Pop the balloon with the right answer before the 60 seconds run out!</p>
          </button>
        </div>
      )}
      {mode === "flash-race" && <FlashRace loggedIn={loggedIn} onExit={() => setMode(null)} />}
      {mode === "balloon-pop" && <BalloonPop loggedIn={loggedIn} onExit={() => setMode(null)} />}
    </div>
  );
}

function FlashRace({ loggedIn, onExit }: { loggedIn: boolean; onExit: () => void }) {
  const [phase, setPhase] = useState<"ready" | "flashing" | "answer" | "done">("ready");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  function startRound() {
    const count = 3 + Math.min(round, 4); // 4..7 numbers
    const nums = Array.from({ length: count }, () => Math.floor(Math.random() * 9) + 1);
    setNumbers(nums);
    setPhase("flashing");
    setInput("");
    setLastCorrect(null);
    const speed = Math.max(900 - round * 100, 450);
    nums.forEach((n, i) => {
      timeouts.current.push(setTimeout(() => setCurrent(n), i * speed));
    });
    timeouts.current.push(
      setTimeout(() => {
        setCurrent(null);
        setPhase("answer");
      }, nums.length * speed)
    );
  }

  async function check() {
    const correct = Number(input) === numbers.reduce((a, b) => a + b, 0);
    setLastCorrect(correct);
    const newScore = correct ? score + numbers.length * 10 : score;
    if (correct) setScore(newScore);
    if (round >= 5) {
      setPhase("done");
      if (loggedIn) {
        await recordGameScore("flash-race", round, newScore);
        setSaved(true);
      }
    } else {
      setRound(round + 1);
      setPhase("ready");
    }
  }

  return (
    <div className="bg-white border border-line rounded-3xl p-8 text-center">
      <div className="flex items-center justify-between mb-6 text-xs font-bold text-ink-soft">
        <button onClick={onExit} className="hover:text-sky">← All games</button>
        <span>Round {Math.min(round, 5)} / 5 · Score {score}</span>
      </div>

      {phase === "ready" && (
        <>
          <p className="text-sm text-ink-soft mb-5">
            {round === 1 ? "Numbers will flash one at a time. Add them in your head!" : lastCorrect ? "Correct! 🎉 Next round is faster…" : "Not quite — next round!"}
          </p>
          <button onClick={startRound} className="bg-sky hover:bg-sky/85 text-white font-bold rounded-lg px-8 py-3 text-sm transition-colors">
            {round === 1 ? "Start Flash Race" : `Start round ${round}`}
          </button>
        </>
      )}

      {phase === "flashing" && (
        <div className="h-36 flex items-center justify-center">
          <span className="font-display text-7xl font-bold text-navy tabular-nums" aria-live="assertive">
            {current ?? ""}
          </span>
        </div>
      )}

      {phase === "answer" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
          className="flex flex-col items-center gap-4"
        >
          <label className="text-sm font-bold text-ink">What's the total?</label>
          <input
            autoFocus
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            className="text-center font-display text-3xl font-bold text-navy border-2 border-line focus:border-sky rounded-xl px-4 py-2 w-40 focus:outline-none"
          />
          <button className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-8 py-2.5 text-sm transition-colors">
            Check ✓
          </button>
        </form>
      )}

      {phase === "done" && (
        <>
          <p className="text-5xl" aria-hidden>{score >= 200 ? "🏆" : score >= 120 ? "🌟" : "💪"}</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-navy">{score} points</h3>
          <p className="mt-2 text-sm text-ink-soft">
            {lastCorrect ? "Finished with a correct answer — brilliant anzan!" : "Great effort — keep training that mental abacus!"}
            {saved && <span className="block mt-1 text-teal font-bold">Saved to your progress report ✓</span>}
          </p>
          <button
            onClick={() => { setRound(1); setScore(0); setPhase("ready"); setSaved(false); }}
            className="mt-5 bg-navy hover:bg-navy-deep text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
          >
            Play again
          </button>
        </>
      )}
    </div>
  );
}

function BalloonPop({ loggedIn, onExit }: { loggedIn: boolean; onExit: () => void }) {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState<{ a: number; b: number; op: "+" | "−"; options: number[] } | null>(null);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setDone(true);
      if (loggedIn) {
        recordGameScore("balloon-pop", 1, score).then(() => setSaved(true));
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft, loggedIn, score]);

  function nextProblem() {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * Math.min(a, 15)) + 1;
    const op = Math.random() > 0.5 ? "+" : "−";
    const answer = op === "+" ? a + b : a - b;
    const options = [answer];
    while (options.length < 3) {
      const alt = answer + (Math.floor(Math.random() * 7) - 3);
      if (alt !== answer && alt >= 0 && !options.includes(alt)) options.push(alt);
    }
    options.sort(() => Math.random() - 0.5);
    setProblem({ a, b, op, options });
  }

  function start() {
    setScore(0);
    setTimeLeft(60);
    setDone(false);
    setSaved(false);
    setRunning(true);
    nextProblem();
  }

  function pop(n: number) {
    if (!problem || !running) return;
    const answer = problem.op === "+" ? problem.a + problem.b : problem.a - problem.b;
    if (n === answer) setScore((s) => s + 10);
    else setScore((s) => Math.max(0, s - 5));
    nextProblem();
  }

  return (
    <div className="bg-white border border-line rounded-3xl p-8 text-center">
      <div className="flex items-center justify-between mb-6 text-xs font-bold text-ink-soft">
        <button onClick={onExit} className="hover:text-sky">← All games</button>
        <span>⏱ {timeLeft}s · Score {score}</span>
      </div>

      {!running && !done && (
        <>
          <p className="text-sm text-ink-soft mb-5">Pop the balloon with the correct answer. +10 for right, −5 for wrong. 60 seconds!</p>
          <button onClick={start} className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-8 py-3 text-sm transition-colors">
            Start Balloon Pop
          </button>
        </>
      )}

      {running && problem && (
        <>
          <p className="font-display text-5xl font-bold text-navy mb-8 tabular-nums">
            {problem.a} {problem.op} {problem.b} = ?
          </p>
          <div className="flex justify-center gap-6">
            {problem.options.map((n, i) => (
              <button
                key={`${n}-${i}`}
                onClick={() => pop(n)}
                className={`relative w-24 h-28 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] text-white font-display text-2xl font-bold shadow-lg hover:scale-110 transition-transform ${
                  ["bg-sunrise", "bg-sky", "bg-teal"][i]
                }`}
              >
                {n}
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-lg" aria-hidden>🧵</span>
              </button>
            ))}
          </div>
        </>
      )}

      {done && (
        <>
          <p className="text-5xl" aria-hidden>{score >= 150 ? "🏆" : score >= 80 ? "🌟" : "💪"}</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-navy">{score} points</h3>
          {saved && <p className="mt-1 text-teal text-sm font-bold">Saved to your progress report ✓</p>}
          <button onClick={start} className="mt-5 bg-navy hover:bg-navy-deep text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors">
            Play again
          </button>
        </>
      )}
    </div>
  );
}
