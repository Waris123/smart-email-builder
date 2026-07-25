import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { retrieveTemplates, isLikelyOutOfContext, buildSystemPrompt } from "@/lib/rag";
import { generateEmail } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    // 1. Require a logged-in AND admin-approved user
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, is_approved")
      .eq("id", user.id)
      .single();

    if (!profile?.is_approved) {
      return NextResponse.json(
        { error: "Your account is pending admin approval." },
        { status: 403 }
      );
    }

    // 2. Read prompt
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Please provide a valid prompt" }, { status: 400 });
    }

    // 3. RAG retrieval
    const templates = await retrieveTemplates(prompt);

    // 4. Guardrail — cheap pre-check before even calling generation
    if (isLikelyOutOfContext(templates)) {
      const refusal =
        "I’m sorry, but this request is outside my scope. I can only help with drafting professional client emails..";

      await supabase.from("prompt_logs").insert({
        user_id: user.id,
        username: profile.username,
        input_prompt: prompt,
        output_email: refusal,
        matched_scenario: null,
        out_of_context: true,
      });

      return NextResponse.json({ email: refusal, outOfContext: true });
    }

    // 5. Build strict system prompt + generate
    const systemPrompt = buildSystemPrompt(templates);
    const email = await generateEmail(systemPrompt, prompt);

    // 6. Log the request + response
    await supabase.from("prompt_logs").insert({
      user_id: user.id,
      username: profile.username,
      input_prompt: prompt,
      output_email: email,
      matched_scenario: templates[0]?.scenario ?? null,
      out_of_context: false,
    });

    return NextResponse.json({ email, outOfContext: false, matchedScenario: templates[0]?.scenario });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
