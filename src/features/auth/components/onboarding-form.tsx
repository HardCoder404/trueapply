"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  companySizes,
  experienceLevelLabels,
  experienceLevels,
  industries,
  type UserRole,
} from "@/lib/constants";

import { completeOnboarding, type OnboardingState } from "../actions";
import { ChoiceGroup } from "@/components/forms/choice-group";
import { Field } from "@/components/forms/field";
import { TagInput } from "@/components/forms/tag-input";

type OnboardingFormProps = {
  defaultName: string;
  defaultRole: UserRole | null;
  emailDomain: string | null;
};

const roleChoices = [
  {
    value: "seeker",
    label: "I'm looking for work",
    hint: "Prove skills, apply with a verified score",
  },
  {
    value: "recruiter",
    label: "I'm hiring",
    hint: "Post real roles, get ranked applicants",
  },
] as const;

export function OnboardingForm({
  defaultName,
  defaultRole,
  emailDomain,
}: OnboardingFormProps) {
  const [role, setRole] = useState<UserRole | null>(defaultRole);
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    null,
  );
  const errors = state?.errors ?? {};

  return (
    <form
      action={formAction}
      className="space-y-8"
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.name === "role") {
          setRole(target.value as UserRole);
        }
      }}
    >
      <ChoiceGroup
        name="role"
        label="What brings you here?"
        choices={roleChoices}
        defaultValue={role ?? undefined}
      />

      {role && (
        <div className="space-y-6">
          <Field id="name" label="Your name" error={errors.name?.[0]}>
            <Input
              id="name"
              name="name"
              defaultValue={defaultName}
              autoComplete="name"
              required
              maxLength={80}
            />
          </Field>

          {role === "seeker" ? (
            <>
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
                  placeholder="Frontend engineer who ships"
                  maxLength={120}
                />
              </Field>
              <Field
                id="skills"
                label="Skills"
                hint="Press Enter or comma after each skill. Verified scores come later."
                error={errors.skills?.[0]}
              >
                <TagInput
                  id="skills"
                  name="skills"
                  placeholder="React, Postgres, Go…"
                  describedBy="skills-hint"
                />
              </Field>
              <ChoiceGroup
                name="experienceLevel"
                label="Experience"
                columns={3}
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
                  placeholder="Bengaluru, India"
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
                  placeholder="What you have built, what you want to build next."
                />
              </Field>
            </>
          ) : (
            <>
              <Field id="companyName" label="Company" error={errors.companyName?.[0]}>
                <Input
                  id="companyName"
                  name="companyName"
                  autoComplete="organization"
                  required
                  maxLength={120}
                />
              </Field>
              <Field
                id="companyDomain"
                label="Company domain"
                hint={
                  emailDomain
                    ? `Matches your email domain (${emailDomain})? Your company gets the verified mark.`
                    : "Used to verify you work there."
                }
                error={errors.companyDomain?.[0]}
              >
                <Input
                  id="companyDomain"
                  name="companyDomain"
                  placeholder="acme.com"
                  defaultValue={emailDomain ?? ""}
                  inputMode="url"
                  required
                />
              </Field>
              <ChoiceGroup
                name="companySize"
                label="Company size"
                columns={3}
                choices={companySizes.map((size) => ({
                  value: size,
                  label: size,
                  hint: "people",
                }))}
                error={errors.companySize?.[0]}
              />
              <ChoiceGroup
                name="industry"
                label="Industry"
                columns={3}
                choices={industries.map((industry) => ({
                  value: industry,
                  label: industry,
                }))}
                error={errors.industry?.[0]}
              />
            </>
          )}

          {state?.message && (
            <p role="alert" className="rounded-lg border border-border px-3 py-2 text-sm">
              {state.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full px-5 text-sm sm:w-auto"
          >
            {pending ? "Saving…" : "Finish setup"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </form>
  );
}
