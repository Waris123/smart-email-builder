import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { userId, approve } = await req.json();
  if (!userId || typeof approve !== "boolean") {
    return NextResponse.json({ error: "userId and approve (boolean) are required" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update({ is_approved: approve }).eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
