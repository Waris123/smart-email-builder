"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import LogoBadge from "@/components/LogoBadge";

export default function PendingPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="container">
      <LogoBadge />
      <h1>Waiting for approval</h1>
      <p className="subtitle">
        Your email is confirmed, but an admin still needs to approve your
        account before you can use the email builder. Check back shortly, or
        reach out to your admin directly.
      </p>
      <button className="signout" style={{ width: "100%" }} onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
