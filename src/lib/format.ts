const dayMs = 86_400_000;

export function lakhsToInr(lakhs: number) {
  return Math.round(lakhs * 100_000);
}

export function inrToLakhs(inr: number) {
  return inr / 100_000;
}

export function formatLakhs(inr: number) {
  const lakhs = inrToLakhs(inr);
  return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
}

export function formatSalaryRange(min: number, max: number) {
  return `${formatLakhs(min)} – ${formatLakhs(max)}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / dayMs);
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}
