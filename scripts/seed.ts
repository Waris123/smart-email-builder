// Run with: npm run seed
// Reads dataset/email_templates.csv, generates a Gemini embedding for each
// row, and inserts everything into the Supabase email_templates table.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Check your .env.local (GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.embedding.values as number[];
}

async function main() {
  const csvPath = path.join(__dirname, "..", "dataset", "email_templates.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows: any[] = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`Found ${rows.length} rows. Embedding + inserting...`);

  for (const [i, row] of rows.entries()) {
    const combinedText = `Scenario: ${row.scenario}\nClient type: ${row.client_type}\nTone: ${row.tone}\nContext: ${row.context}\nSample email: ${row.sample_email}`;

    const embedding = await embedText(combinedText);

    const { error } = await supabase.from("email_templates").insert({
      scenario: row.scenario,
      client_type: row.client_type,
      tone: row.tone,
      context: row.context,
      sample_email: row.sample_email,
      embedding,
    });

    if (error) {
      console.error(`Row ${i + 1} failed:`, error.message);
    } else {
      console.log(`Row ${i + 1}/${rows.length} inserted: ${row.scenario}`);
    }

    // small delay to be gentle on the embeddings API rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("Done.");
}

main();
