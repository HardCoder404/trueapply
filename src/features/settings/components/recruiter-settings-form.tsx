"use client";

import { useActionState } from "react";

import { ChoiceGroup } from "@/components/forms/choice-group";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import type { Company, User } from "@/features/auth/types";
import { companySizes, industries } from "@/lib/constants";

import { saveRecruiterSettings, type SettingsState } from "../actions";
import { SaveRow } from "./seeker-settings-form";

export function RecruiterSettingsForm({
  user,
  company,
}: {
  user: User;
  company: Company;
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    saveRecruiterSettings,
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

      <Field id="companyName" label="Company" error={errors.companyName?.[0]}>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={company.name}
          autoComplete="organization"
          required
          maxLength={120}
        />
      </Field>

      <Field
        id="companyDomain"
        label="Company domain"
        hint={
          company.verified
            ? "Verified against your sign-up email. Contact us to change it."
            : "Locked after sign-up so the verified mark cannot be gamed."
        }
      >
        <Input
          id="companyDomain"
          defaultValue={company.domain ?? ""}
          readOnly
          className="text-muted-foreground"
        />
      </Field>

      <ChoiceGroup
        name="companySize"
        label="Company size"
        columns={3}
        defaultValue={company.size ?? undefined}
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
        defaultValue={company.industry ?? undefined}
        choices={industries.map((industry) => ({ value: industry, label: industry }))}
        error={errors.industry?.[0]}
      />

      <SaveRow state={state} pending={pending} />
    </form>
  );
}
