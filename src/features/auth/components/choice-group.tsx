import { cn } from "@/lib/utils";

type Choice<T extends string> = { value: T; label: string; hint?: string };

type ChoiceGroupProps<T extends string> = {
  name: string;
  label: string;
  choices: ReadonlyArray<Choice<T>>;
  defaultValue?: T;
  error?: string;
  columns?: 2 | 3;
};

export function ChoiceGroup<T extends string>({
  name,
  label,
  choices,
  defaultValue,
  error,
  columns = 2,
}: ChoiceGroupProps<T>) {
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm font-medium">{label}</legend>
      <div
        className={cn(
          "mt-2 grid gap-2",
          columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
        )}
      >
        {choices.map((choice) => (
          <label
            key={choice.value}
            className="flex min-h-11 cursor-pointer flex-col justify-center rounded-lg border border-border px-3 py-2 text-sm transition-colors has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-ring/60"
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              defaultChecked={choice.value === defaultValue}
              className="sr-only"
            />
            <span className="font-medium">{choice.label}</span>
            {choice.hint && <span className="text-xs opacity-70">{choice.hint}</span>}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </fieldset>
  );
}
