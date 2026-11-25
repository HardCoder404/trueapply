import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { JobFilters } from "../schemas";

const salaryFloors = [5, 10, 20, 30, 50];

export function JobFiltersForm({ filters }: { filters: JobFilters }) {
  return (
    <form
      method="get"
      action="/jobs"
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[2fr_1.2fr_1fr_auto_auto]"
    >
      <label className="sr-only" htmlFor="q">
        Search
      </label>
      <Input
        id="q"
        name="q"
        placeholder="Search roles"
        defaultValue={filters.q}
        className="h-11"
      />

      <label className="sr-only" htmlFor="location">
        Location
      </label>
      <Input
        id="location"
        name="location"
        placeholder="City"
        defaultValue={filters.location}
        className="h-11"
      />

      <label className="sr-only" htmlFor="min">
        Minimum salary
      </label>
      <select
        id="min"
        name="min"
        defaultValue={filters.min ?? ""}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Any salary</option>
        {salaryFloors.map((floor) => (
          <option key={floor} value={floor}>
            ₹{floor}L+
          </option>
        ))}
      </select>

      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-sm">
        <input
          type="checkbox"
          name="remote"
          value="1"
          defaultChecked={Boolean(filters.remote)}
          className="accent-foreground"
        />
        Remote
      </label>

      <Button type="submit" className="h-11 px-4">
        <Search data-icon="inline-start" />
        Filter
      </Button>
    </form>
  );
}
