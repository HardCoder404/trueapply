// Creates a Clerk user for local testing. Sign-up in the browser is gated by
// bot protection, which automated browsers cannot pass; this goes through
// the Backend API instead.
//
//   node --env-file=.env scripts/create-test-user.mjs <email> <password> <seeker|recruiter>

import { createClerkClient } from "@clerk/backend";

const [email, password, role = "seeker"] = process.argv.slice(2);

if (!email || !password) {
  console.error("usage: create-test-user.mjs <email> <password> [role]");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const { data: existing } = await clerk.users.getUserList({ emailAddress: [email] });
if (existing.length) {
  console.log(`exists ${existing[0].id}`);
  process.exit(0);
}

const user = await clerk.users.createUser({
  emailAddress: [email],
  password,
  firstName: "Test",
  lastName: role[0].toUpperCase() + role.slice(1),
  unsafeMetadata: { role },
  skipPasswordChecks: true,
});

console.log(`created ${user.id}`);
