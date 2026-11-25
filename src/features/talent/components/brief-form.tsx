"use client";

import { useActionState } from "react";

import { ChoiceGroup } from "@/components/forms/choice-group";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { challengeLanguages } from "@/features/challenges/schemas";
import { challengeDifficulties, challengeTypes } from "@/lib/constants";

import { createBrief, type BriefState } from "../actions";

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BriefForm({
  jobId,
  defaultSkill,
}: {
  jobId: string;
  defaultSkill: string;
}) {
  const [state, formAction, pending] = useActionState<BriefState, FormData>(
    createBrief,
    null,
  );
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="jobId" value={jobId} />

      <Field id="title" label="Title" error={errors.title?.[0]}>
        <Input id="title" name="title" maxLength={100} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="skill" label="Skill it tests" error={errors.skill?.[0]}>
          <Input
            id="skill"
            name="skill"
            defaultValue={defaultSkill}
            maxLength={40}
            required
          />
        </Field>
        <Field
          id="timeLimitMinutes"
          label="Time limit (minutes)"
          error={errors.timeLimitMinutes?.[0]}
        >
          <Input
            id="timeLimitMinutes"
            name="timeLimitMinutes"
            type="number"
            min={10}
            max={90}
            defaultValue={45}
            required
          />
        </Field>
      </div>

      <ChoiceGroup
        name="type"
        label="Type"
        columns={3}
        defaultValue="general"
        choices={challengeTypes.map((type) => ({ value: type, label: capitalise(type) }))}
        error={errors.type?.[0]}
      />

      <ChoiceGroup
        name="difficulty"
        label="Difficulty"
        columns={3}
        defaultValue="medium"
        choices={challengeDifficulties.map((d) => ({ value: d, label: capitalise(d) }))}
        error={errors.difficulty?.[0]}
      />

      <Field
        id="language"
        label="Language"
        optional
        hint="Pick JavaScript to let candidates run code in the browser."
        error={errors.language?.[0]}
      >
        <select
          id="language"
          name="language"
          defaultValue=""
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Written answer</option>
          {challengeLanguages.map((language) => (
            <option key={language} value={language}>
              {capitalise(language)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="description"
        label="The problem"
        hint="A real, anonymised problem from your work. Strip names, keys and anything confidential."
        error={errors.description?.[0]}
      >
        <Textarea
          id="description"
          name="description"
          rows={8}
          minLength={80}
          maxLength={4000}
          required
        />
      </Field>

      <Field
        id="starterCode"
        label="Starter code"
        optional
        error={errors.starterCode?.[0]}
      >
        <Textarea
          id="starterCode"
          name="starterCode"
          rows={5}
          maxLength={4000}
          className="font-mono text-[13px]"
        />
      </Field>

      <Field
        id="rubric"
        label="Rubric"
        hint="One line per criterion, two to six lines. The grader scores against these."
        error={errors.rubric?.[0]}
      >
        <Textarea id="rubric" name="rubric" rows={4} required />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-5 text-sm">
          {pending ? "Adding…" : "Add brief to this role"}
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
