"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

interface ProfileRow {
  id: string;
  email: string;
  username: string | null;
  is_approved: boolean;
  created_at: string;
}

interface LogRow {
  id: string;
  user_id: string | null;
  username: string | null;
  input_prompt: string;
  output_email: string;
  matched_scenario: string | null;
  out_of_context: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/logs"),
      ]);
      const usersData = await usersRes.json();
      const logsData = await logsRes.json();

      if (!usersRes.ok) throw new Error(usersData.error);
      if (!logsRes.ok) throw new Error(logsData.error);

      setProfiles(usersData.profiles);
      setLogs(logsData.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(userId: string, approve: boolean) {
    setBusyUserId(userId);
    try {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approve }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  }

  const pending = profiles.filter((p) => !p.is_approved);
  const approved = profiles.filter((p) => p.is_approved);

  return (
    <>
      <Header />
      <div className="wide-container">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Approve signups and review all generated emails</p>

        {error && <p className="error">{error}</p>}
      {loading && <p className="subtitle">Loading...</p>}

      {!loading && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>
            Pending approval ({pending.length})
          </h2>
          {pending.length === 0 && (
            <p className="subtitle" style={{ marginBottom: "1.5rem" }}>
              No pending signups.
            </p>
          )}
          {pending.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{p.username || "(no name)"}</strong>
                <br />
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{p.email}</span>
              </div>
              <button
                style={{ width: "auto", padding: "0.5rem 1rem" }}
                disabled={busyUserId === p.id}
                onClick={() => handleApprove(p.id, true)}
              >
                {busyUserId === p.id ? "..." : "Approve"}
              </button>
            </div>
          ))}

          <h2 style={{ fontSize: "1.1rem", marginTop: "2rem" }}>
            Approved users ({approved.length})
          </h2>
          {approved.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{p.username || "(no name)"}</strong>
                <br />
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{p.email}</span>
              </div>
              <button
                className="signout"
                style={{ width: "auto" }}
                disabled={busyUserId === p.id}
                onClick={() => handleApprove(p.id, false)}
              >
                {busyUserId === p.id ? "..." : "Revoke"}
              </button>
            </div>
          ))}

          <h2 style={{ fontSize: "1.1rem", marginTop: "2rem" }}>
            Prompt log ({logs.length})
          </h2>
          {logs.length === 0 && <p className="subtitle">No prompts sent yet.</p>}
          {logs.map((log) => (
            <div key={log.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                <span>
                  <strong style={{ color: "#e2e8f0" }}>{log.username || "unknown"}</strong>
                  {log.out_of_context && (
                    <span style={{ color: "#f87171", marginLeft: "0.5rem" }}>· refused (out of context)</span>
                  )}
                  {!log.out_of_context && log.matched_scenario && (
                    <span style={{ marginLeft: "0.5rem" }}>· matched: {log.matched_scenario}</span>
                  )}
                </span>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>

              <p style={{ marginTop: "0.6rem", marginBottom: "0.3rem" }}>
                <strong>Prompt:</strong> {log.input_prompt}
              </p>

              {expandedLog === log.id ? (
                <>
                  <p style={{ marginBottom: "0.3rem" }}>
                    <strong>Output:</strong>
                  </p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{log.output_email}</p>
                  <button
                    className="signout"
                    style={{ width: "auto", marginTop: "0.5rem" }}
                    onClick={() => setExpandedLog(null)}
                  >
                    Collapse
                  </button>
                </>
              ) : (
                <button
                  className="signout"
                  style={{ width: "auto" }}
                  onClick={() => setExpandedLog(log.id)}
                >
                  Show output
                </button>
              )}
            </div>
          ))}
        </>
      )}
      </div>
    </>
  );
}
