import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { experienceLevelLabels, experienceLevels } from "@/lib/constants";

import type { TalentFilters } from "../schemas";

export function TalentFiltersForm({ filters }: { filters: TalentFilters }) {
  return (
    <form
      method="get"
      action="/recruiter/talent"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto_1fr_1fr_auto]"
    >
      <label className="sr-only" htmlFor="q">
        Describe the role
      </label>
      <Input
        id="q"
        name="q"
        placeholder="Describe who you need, e.g. React engineer for fintech"
        defaultValue={filters.q ?? ""}
        className="h-11"
      />
      <label className="sr-only" htmlFor="skill">
        Skill
      </label>
      <Input
        id="skill"
        name="skill"
        placeholder="Verified skill"
        defaultValue={filters.skill ?? ""}
        className="h-11"
      />
      <label className="sr-only" htmlFor="min">
        Minimum score
      </label>
      <Input
        id="min"
        name="min"
        type="number"
        min={0}
        max={100}
        placeholder="Min score"
        defaultValue={filters.min ?? ""}
        className="h-11 lg:w-28"
      />
      <label className="sr-only" htmlFor="level">
        Experience
      </label>
      <select
        id="level"
        name="level"
        defaultValue={filters.level ?? ""}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Any experience</option>
        {experienceLevels.map((level) => (
          <option key={level} value={level}>
            {experienceLevelLabels[level]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="location">
        Location
      </label>
      <Input
        id="location"
        name="location"
        placeholder="Location"
        defaultValue={filters.location ?? ""}
        className="h-11"
      />
      <Button type="submit" variant="outline" className="h-11 px-4 text-sm">
        Search
      </Button>
    </form>
  );
}
