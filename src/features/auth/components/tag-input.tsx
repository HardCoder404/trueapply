"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";

type TagInputProps = {
  name: string;
  id: string;
  placeholder?: string;
  max?: number;
  describedBy?: string;
};

export function TagInput({
  name,
  id,
  placeholder,
  max = 20,
  describedBy,
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim().replace(/,+$/, "");
    if (!value || tags.includes(value) || tags.length >= max) {
      setDraft("");
      return;
    }
    setTags([...tags, value]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        aria-describedby={describedBy}
        autoComplete="off"
      />
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-2.5 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
