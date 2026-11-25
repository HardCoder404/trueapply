"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { Field } from "@/components/forms/field";
import { TagInput } from "@/components/forms/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inrToLakhs, toDateInputValue } from "@/lib/format";

import { saveJob, type JobFormState } from "../actions";
import type { Job } from "../types";

export function JobForm({ job }: { job?: Job }) {
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    saveJob,
    null,
  );
  const errors = state?.errors ?? {};
  const [minDeadline] = useState(() =>
    toDateInputValue(new Date(Date.now() + 86_400_000)),
  );

  return (
    <form action={formAction} className="space-y-6">
      {job && <input type="hidden" name="jobId" value={job.id} />}

      <Field id="title" label="Role title" error={errors.title?.[0]}>
        <Input
          id="title"
          name="title"
          defaultValue={job?.title}
          placeholder="Senior Frontend Engineer"
          required
          maxLength={100}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        hint="What the person will actually do, the stack, the team, and how you interview. Specific postings score higher."
        error={errors.description?.[0]}
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={job?.description}
          rows={10}
          required
          minLength={120}
          maxLength={8000}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="salaryMinLakhs"
          label="Salary from (₹ lakhs / year)"
          error={errors.salaryMinLakhs?.[0]}
        >
          <Input
            id="salaryMinLakhs"
            name="salaryMinLakhs"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            defaultValue={job ? inrToLakhs(job.salaryMin) : ""}
            placeholder="12"
            required
          />
        </Field>
        <Field
          id="salaryMaxLakhs"
          label="Salary to (₹ lakhs / year)"
          error={errors.salaryMaxLakhs?.[0]}
        >
          <Input
            id="salaryMaxLakhs"
            name="salaryMaxLakhs"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            defaultValue={job ? inrToLakhs(job.salaryMax) : ""}
            placeholder="18"
            required
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <Field id="location" label="Location" error={errors.location?.[0]}>
          <Input
            id="location"
            name="location"
            defaultValue={job?.location}
            placeholder="Bengaluru"
            required
            maxLength={80}
          />
        </Field>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end rounded-lg border border-border px-3 text-sm has-checked:border-foreground">
          <input
            type="checkbox"
            name="remote"
            defaultChecked={job?.remote}
            className="accent-foreground"
          />
          Remote friendly
        </label>
      </div>

      <Field
        id="skills"
        label="Skills"
        hint="Press Enter or comma after each one. Candidates will be challenged on these."
        error={errors.skills?.[0]}
      >
        <TagInput
          id="skills"
          name="skills"
          placeholder="React, Postgres…"
          max={15}
          defaultTags={job?.skills}
          describedBy="skills-hint"
        />
      </Field>

      <Field
        id="deadline"
        label="Application deadline"
        hint="Between a week and two months keeps the score high."
        error={errors.deadline?.[0]}
      >
        <Input
          id="deadline"
          name="deadline"
          type="date"
          min={minDeadline}
          defaultValue={job ? toDateInputValue(job.deadline) : ""}
          required
          suppressHydrationWarning
          className="w-fit"
        />
      </Field>

      {state?.message && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          className="h-11 px-5 text-sm"
        >
          {pending
            ? "Scoring…"
            : job?.status === "open"
              ? "Save and rescore"
              : "Publish role"}
          <ArrowRight data-icon="inline-end" />
        </Button>
        {job?.status !== "open" && (
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="outline"
            disabled={pending}
            className="h-11 px-5 text-sm"
          >
            Save as draft
          </Button>
        )}
      </div>
    </form>
  );
}
