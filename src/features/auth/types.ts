import type { companies, seekerProfiles, users } from "@/db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type SeekerProfile = typeof seekerProfiles.$inferSelect;
export type Company = typeof companies.$inferSelect;

export type AccountWithProfiles = User & {
  seekerProfile: SeekerProfile | null;
  company: Company | null;
};
