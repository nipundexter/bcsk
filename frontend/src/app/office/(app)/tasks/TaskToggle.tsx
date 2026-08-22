"use client";

import { useTransition } from "react";
import { toggleTask } from "./actions";

export function TaskToggle({ taskId, done }: { taskId: number; done: boolean }) {
  const [pending, start] = useTransition();
  return (
    <input
      type="checkbox"
      checked={done}
      disabled={pending}
      onChange={() => start(() => toggleTask(taskId, !done))}
      className="w-5 h-5 accent-teal cursor-pointer"
      aria-label="Mark task done"
    />
  );
}
