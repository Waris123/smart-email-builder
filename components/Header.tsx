"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function Header() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(!!profile?.is_admin);
      }
      setLoaded(true);
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="app-header">
      <div className="logo-badge">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sapphire Consulting Services" />
      </div>

      <div className="header-actions">
        {loaded && isAdmin && (
          <>
            <Link href="/dashboard" className="nav-btn">
              Dashboard
            </Link>
            <Link href="/admin" className="nav-btn">
              Admin Panel
            </Link>
          </>
        )}
        <button className="signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
