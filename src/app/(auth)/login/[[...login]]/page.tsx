import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TrueApply account.",
  robots: { index: false },
};

export default function LoginPage() {
  return <SignIn />;
}
