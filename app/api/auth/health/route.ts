import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/sanctumSession";

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const [login, sessions, limits] = await Promise.all([
      supabase.rpc("sanctum_verify_login", { input_nickname: "__sanctum_health__", input_code: "invalid" }),
      supabase.from("sanctum_sessions").select("id", { head: true }).limit(1),
      supabase.from("sanctum_login_attempts").select("nickname", { head: true }).limit(1),
    ]);
    if (login.error || sessions.error || limits.error) {
      return NextResponse.json({ ready: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
