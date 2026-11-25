"use client";

import { ArrowRight, Play } from "lucide-react";
import dynamic from "next/dynamic";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";

import { Button } from "@/components/ui/button";

import { submitChallenge, type SubmissionState } from "../actions";
import { runJavascript } from "./run-javascript";

const CodeEditor = dynamic(() => import("./code-editor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="min-h-[26rem] motion-safe:animate-pulse" aria-hidden />,
});

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
  const [pasteNotice, setPasteNotice] = useState(false);
  const integrity = useRef({
    pasteAttempts: 0,
    tabSwitches: 0,
    hiddenSince: 0,
    hiddenMs: 0,
    openedAt: 0,
  });
  const canRun = language === "javascript";
  const isCode = language !== null;

  useEffect(() => {
    integrity.current.openedAt = Date.now();
    const onVisibility = () => {
      const now = Date.now();
      if (document.hidden) {
        integrity.current.tabSwitches += 1;
        integrity.current.hiddenSince = now;
      } else if (integrity.current.hiddenSince) {
        integrity.current.hiddenMs += now - integrity.current.hiddenSince;
        integrity.current.hiddenSince = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onPasteBlocked = useCallback(() => {
    integrity.current.pasteAttempts += 1;
    setPasteNotice(true);
  }, []);

  function blockPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    onPasteBlocked();
  }

  function submitWithSignals(formData: FormData) {
    const { pasteAttempts, tabSwitches, hiddenMs, openedAt } = integrity.current;
    formData.set(
      "integrity",
      JSON.stringify({
        pasteAttempts,
        tabSwitches,
        activeSeconds: openedAt
          ? Math.max(0, Math.round((Date.now() - openedAt - hiddenMs) / 1000))
          : 0,
      }),
    );
    formAction(formData);
  }

  async function run() {
    setRunning(true);
    setRunOutput(await runJavascript(answer));
    setRunning(false);
  }

  return (
    <form action={submitWithSignals} className="space-y-4">
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
        {isCode ? (
          <CodeEditor
            value={answer}
            language={language}
            onChange={setAnswer}
            onPasteBlocked={onPasteBlocked}
          />
        ) : (
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onPaste={blockPaste}
            aria-label="Your answer"
            rows={14}
            className="block w-full resize-y bg-background p-4 text-sm leading-relaxed outline-none"
            placeholder="Write your answer here."
          />
        )}
        <textarea
          name="answer"
          value={answer}
          readOnly
          hidden
          aria-hidden
          tabIndex={-1}
        />
      </div>

      {pasteNotice && (
        <p className="text-xs text-muted-foreground">
          Pasting is off during a challenge. Type your answer; the company can see paste
          attempts.
        </p>
      )}

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
