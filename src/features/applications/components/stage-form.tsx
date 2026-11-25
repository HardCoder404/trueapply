"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStage } from "@/lib/constants";

import { moveStage, type StageState } from "../actions";
import { nextStages } from "../schemas";
import { stageLabels } from "./stage-badge";

export function StageForm({
  applicationId,
  current,
}: {
  applicationId: string;
  current: ApplicationStage;
}) {
  const [state, formAction, pending] = useActionState<StageState, FormData>(
    moveStage,
    null,
  );
  const options = nextStages.filter((stage) => stage !== current);

  return (
    <form
      action={formAction}
      className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <label className="sr-only" htmlFor={`stage-${applicationId}`}>
        Move to
      </label>
      <select
        id={`stage-${applicationId}`}
        name="stage"
        required
        defaultValue=""
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="" disabled>
          Move to…
        </option>
        {options.map((stage) => (
          <option key={stage} value={stage}>
            {stageLabels[stage]}
          </option>
        ))}
      </select>
      <div>
        <label className="sr-only" htmlFor={`reason-${applicationId}`}>
          Reason the candidate will see
        </label>
        <Textarea
          id={`reason-${applicationId}`}
          name="reason"
          rows={2}
          required
          minLength={8}
          maxLength={400}
          placeholder="Reason the candidate will read. Required."
        />
        {state?.errors?.reason?.[0] && (
          <p className="mt-1 text-xs text-muted-foreground">{state.errors.reason[0]}</p>
        )}
        {state?.errors?.stage?.[0] && (
          <p className="mt-1 text-xs text-muted-foreground">{state.errors.stage[0]}</p>
        )}
        {state?.message && (
          <p className="mt-1 text-xs text-muted-foreground">{state.message}</p>
        )}
        {state?.saved ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Updated. The candidate has been emailed.
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="h-11 px-4 text-sm">
        {pending ? "Saving…" : "Update"}
      </Button>
    </form>
  );
}
