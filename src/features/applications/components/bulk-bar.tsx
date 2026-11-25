"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { bulkMoveStage, type StageState } from "../actions";
import { nextStages } from "../schemas";
import { stageLabels } from "./stage-badge";

export const bulkFormId = "bulk-stage";

export function BulkBar() {
  const [state, formAction, pending] = useActionState<StageState, FormData>(
    bulkMoveStage,
    null,
  );

  return (
    <form
      id={bulkFormId}
      action={formAction}
      className="sticky top-14 z-30 grid gap-2 rounded-xl bg-background/95 p-3 ring-1 ring-foreground/15 backdrop-blur sm:grid-cols-[auto_1fr_auto] sm:items-center"
    >
      <label className="sr-only" htmlFor="bulk-stage-select">
        Move selected to
      </label>
      <select
        id="bulk-stage-select"
        name="stage"
        required
        defaultValue=""
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="" disabled>
          Move selected to…
        </option>
        {nextStages.map((stage) => (
          <option key={stage} value={stage}>
            {stageLabels[stage]}
          </option>
        ))}
      </select>
      <div>
        <label className="sr-only" htmlFor="bulk-reason">
          Reason
        </label>
        <Input
          id="bulk-reason"
          name="reason"
          required
          minLength={8}
          maxLength={400}
          placeholder="Reason every selected candidate will read"
          className="h-11"
        />
        {(state?.message || state?.errors?.reason?.[0]) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {state?.errors?.reason?.[0] ?? state?.message}
          </p>
        )}
        {state?.saved ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Updated {state.saved} application{state.saved === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="h-11 px-4 text-sm"
      >
        {pending ? "Saving…" : "Apply to selected"}
      </Button>
    </form>
  );
}
