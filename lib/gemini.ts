const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const EMBED_MODEL = "gemini-embedding-001";
const GEN_MODEL = "gemini-3.5-flash-lite";

// --- Embeddings (used both by the seed script and at query time) ---
// taskType: "RETRIEVAL_DOCUMENT" when embedding dataset rows (seed script),
// "RETRIEVAL_QUERY" when embedding the user's live prompt — this pairing
// gives noticeably better retrieval quality than using one type for both.
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: 768, // matches the vector(768) column in Supabase
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding error: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

// --- Generation ---
export async function generateEmail(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini generation error: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text as string;
}
