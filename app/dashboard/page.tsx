"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [matchedScenario, setMatchedScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data.email);
        setMatchedScenario(data.matchedScenario || "");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="wide-container">
        <h1>Smart Email Builder</h1>
        <p className="subtitle">Describe the situation, get a properly toned client email</p>

        <form onSubmit={handleGenerate}>
          {error && <p className="error">{error}</p>}
          <textarea
            placeholder="e.g. Client is very angry that we missed the delivery deadline by a week, I need to calm them down and buy 3 more days"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Email"}
          </button>
        </form>

        {result && (
          <div className="card">
            {matchedScenario && (
              <p style={{ color: "#818cf8", fontSize: "0.75rem", marginBottom: "0.6rem" }}>
                Matched tone/scenario: {matchedScenario}
              </p>
            )}
            {result}
          </div>
        )}
      </div>
    </>
  );
}
