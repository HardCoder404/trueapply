"use client";

import { useActionState, useState } from "react";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inrToLakhs } from "@/lib/format";

import { sendInvite, type InviteState } from "../actions";

type JobOption = { id: string; title: string; salaryMin: number; salaryMax: number };

export function InviteForm({
  candidateId,
  jobs,
  initialJobId,
  initialMessage,
}: {
  candidateId: string;
  jobs: JobOption[];
  initialJobId: string | null;
  initialMessage: string;
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    sendInvite,
    null,
  );
  const errors = state?.errors ?? {};
  const [jobId, setJobId] = useState(initialJobId ?? jobs[0]?.id ?? "");
  const job = jobs.find((j) => j.id === jobId);
  const [salary, setSalary] = useState(() => ({
    min: job ? String(inrToLakhs(job.salaryMin)) : "",
    max: job ? String(inrToLakhs(job.salaryMax)) : "",
  }));

  function pickJob(id: string) {
    setJobId(id);
    const next = jobs.find((j) => j.id === id);
    if (next) {
      setSalary({
        min: String(inrToLakhs(next.salaryMin)),
        max: String(inrToLakhs(next.salaryMax)),
      });
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="candidateId" value={candidateId} />

      <Field id="jobId" label="Role" error={errors.jobId?.[0]}>
        <select
          id="jobId"
          name="jobId"
          value={jobId}
          onChange={(event) => pickJob(event.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          {jobs.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="salaryMinLakhs"
          label="Salary from (₹ lakhs)"
          error={errors.salaryMinLakhs?.[0]}
        >
          <Input
            id="salaryMinLakhs"
            name="salaryMinLakhs"
            type="number"
            inputMode="decimal"
            min={1}
            step="0.5"
            value={salary.min}
            onChange={(event) => setSalary((s) => ({ ...s, min: event.target.value }))}
            required
          />
        </Field>
        <Field
          id="salaryMaxLakhs"
          label="To (₹ lakhs)"
          error={errors.salaryMaxLakhs?.[0]}
        >
          <Input
            id="salaryMaxLakhs"
            name="salaryMaxLakhs"
            type="number"
            inputMode="decimal"
            min={1}
            step="0.5"
            value={salary.max}
            onChange={(event) => setSalary((s) => ({ ...s, max: event.target.value }))}
            required
          />
        </Field>
      </div>

      <Field
        id="message"
        label="Why they are a match"
        hint="They read this before deciding. Be specific about what you saw in their scores."
        error={errors.message?.[0]}
      >
        <Textarea
          id="message"
          name="message"
          rows={6}
          minLength={40}
          maxLength={1200}
          defaultValue={initialMessage}
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={pending || !jobs.length}
          className="h-11 px-5 text-sm"
        >
          {pending ? "Sending…" : "Send interview invitation"}
        </Button>
        {state?.message && (
          <p role="alert" className="text-sm text-muted-foreground">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
