"use client";

import { useActionState } from "react";

import { ChoiceGroup } from "@/components/forms/choice-group";
import { Field } from "@/components/forms/field";
import { TagInput } from "@/components/forms/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SeekerProfile, User } from "@/features/auth/types";
import { experienceLevelLabels, experienceLevels } from "@/lib/constants";

import { saveSeekerSettings, type SettingsState } from "../actions";

export function SeekerSettingsForm({
  user,
  profile,
}: {
  user: User;
  profile: SeekerProfile | null;
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    saveSeekerSettings,
    null,
  );
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Field id="name" label="Your name" error={errors.name?.[0]}>
        <Input
          id="name"
          name="name"
          defaultValue={user.name}
          autoComplete="name"
          required
          maxLength={80}
        />
      </Field>

      <Field
        id="headline"
        label="Headline"
        optional
        hint="One line. What you do, not your job title."
        error={errors.headline?.[0]}
      >
        <Input
          id="headline"
          name="headline"
          defaultValue={profile?.headline ?? ""}
          maxLength={120}
        />
      </Field>

      <Field
        id="skills"
        label="Skills"
        hint="Claims stay outlined until a graded challenge verifies them."
        error={errors.skills?.[0]}
      >
        <TagInput
          id="skills"
          name="skills"
          defaultTags={profile?.skills ?? []}
          describedBy="skills-hint"
        />
      </Field>

      <ChoiceGroup
        name="experienceLevel"
        label="Experience"
        columns={3}
        defaultValue={profile?.experienceLevel ?? undefined}
        choices={experienceLevels.map((level) => ({
          value: level,
          label: experienceLevelLabels[level],
        }))}
        error={errors.experienceLevel?.[0]}
      />

      <Field id="location" label="Location" optional error={errors.location?.[0]}>
        <Input
          id="location"
          name="location"
          defaultValue={profile?.location ?? ""}
          autoComplete="address-level2"
          maxLength={80}
        />
      </Field>

      <Field id="bio" label="About you" optional error={errors.bio?.[0]}>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={600}
          defaultValue={profile?.bio ?? ""}
        />
      </Field>

      <SaveRow state={state} pending={pending} />
    </form>
  );
}

export function SaveRow({ state, pending }: { state: SettingsState; pending: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button type="submit" disabled={pending} className="h-11 px-5 text-sm">
        {pending ? "Saving…" : "Save changes"}
      </Button>
      {state?.saved && (
        <p role="status" className="text-sm text-muted-foreground">
          Saved.
        </p>
      )}
      {state?.message && (
        <p role="alert" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      )}
    </div>
  );
}
