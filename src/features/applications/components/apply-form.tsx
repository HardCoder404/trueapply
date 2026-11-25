"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { applyToJob, type ApplyState } from "../actions";

export function ApplyForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(
    applyToJob,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <Field
        id="note"
        label="A note for the team"
        optional
        hint="One or two lines. Why this role, or anything the score does not show."
        error={state?.errors?.note?.[0]}
      >
        <Textarea id="note" name="note" rows={3} maxLength={300} />
      </Field>
      {state?.message && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-sm">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 px-5 text-sm">
        {pending ? "Sending…" : "Send application"}
        <ArrowRight data-icon="inline-end" />
      </Button>
      <p className="text-xs text-muted-foreground">
        You will see every stage change the moment it happens, with the reason. Companies
        that leave you waiting past a week are marked as slow responders.
      </p>
    </form>
  );
}
