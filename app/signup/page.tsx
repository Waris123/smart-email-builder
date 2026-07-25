"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import LogoBadge from "@/components/LogoBadge";

export default function SignupPage() {
  const supabase = createSupabaseBrowserClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="container">
        <LogoBadge />
        <h1>Check your email</h1>
        <p className="subtitle">
          We sent a confirmation link to {email}. Confirm it, then sign in —
          an admin will also need to approve your account before you can use
          the tool.
        </p>
        <a className="link" href="/">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="container">
      <LogoBadge />
      <h1>Create account</h1>
      <p className="subtitle">Team signup for Smart Email Builder</p>

      <form onSubmit={handleSignup}>
        {error && <p className="error">{error}</p>}
        <input
          type="text"
          placeholder="Your name (shown to admin)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        <a className="link" href="/">
          Already have an account? Sign in
        </a>
      </p>
    </div>
  );
}
