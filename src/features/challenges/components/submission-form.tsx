"use client";

import { ArrowRight, Play } from "lucide-react";
import { useActionState, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";

import { submitChallenge, type SubmissionState } from "../actions";
import { runJavascript } from "./run-javascript";

type SubmissionFormProps = {
  challengeId: string;
  language: string | null;
  starterCode: string | null;
};

export function SubmissionForm({
  challengeId,
  language,
  starterCode,
}: SubmissionFormProps) {
  const [state, formAction, pending] = useActionState<SubmissionState, FormData>(
    submitChallenge,
    null,
  );
  const [answer, setAnswer] = useState(starterCode ?? "");
  const [runOutput, setRunOutput] = useState("");
  const [running, setRunning] = useState(false);
  const canRun = language === "javascript";
  const isCode = language !== null;

  async function run() {
    setRunning(true);
    setRunOutput(await runJavascript(answer));
    setRunning(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab" || !isCode) return;
    event.preventDefault();
    const target = event.currentTarget;
    const { selectionStart, selectionEnd } = target;
    const next = `${answer.slice(0, selectionStart)}  ${answer.slice(selectionEnd)}`;
    setAnswer(next);
    requestAnimationFrame(() =>
      target.setSelectionRange(selectionStart + 2, selectionStart + 2),
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="challengeId" value={challengeId} />
      <input type="hidden" name="runOutput" value={runOutput} />

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/15 focus-within:ring-foreground/40">
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            {language ?? "written answer"}
          </span>
          {canRun && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={run}
              disabled={running || !answer.trim()}
            >
              <Play data-icon="inline-start" />
              {running ? "Running…" : "Run"}
            </Button>
          )}
        </div>
        <textarea
          name="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={!isCode}
          aria-label="Your answer"
          rows={isCode ? 22 : 14}
          className={`block w-full resize-y bg-background p-4 text-sm leading-relaxed outline-none ${isCode ? "font-mono" : ""}`}
          placeholder={isCode ? "// Your solution" : "Write your answer here."}
        />
      </div>

      {canRun && runOutput && (
        <pre className="max-h-48 overflow-auto rounded-lg bg-card p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap ring-1 ring-foreground/10">
          {runOutput}
        </pre>
      )}

      {state?.errors?.answer?.[0] && (
        <p className="text-sm text-muted-foreground">{state.errors.answer[0]}</p>
      )}
      {state?.message && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          One attempt per challenge. Grading takes a few seconds.
        </p>
        <Button type="submit" disabled={pending} className="h-11 px-5 text-sm">
          {pending ? "Grading…" : "Submit for grading"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </form>
  );
}
