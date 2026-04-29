import { redirect } from "next/navigation";

// /(app)/page.tsx is /(app)/ — redirect to dashboard
export default function AppRoot() {
  redirect("/dashboard");
}
