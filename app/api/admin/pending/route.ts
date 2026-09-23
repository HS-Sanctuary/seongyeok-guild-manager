import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const actor = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!actor || !["길드마스터", "부마스터", "부마스터 대행"].includes(actor.role)) {
      return NextResponse.json({ message: "운영진 권한이 필요합니다." }, { status: 403 });
    }
    const { data, error } = await getServerSupabase().from("accounts")
      .select("id, nickname, role, status, created_at")
      .or("role.eq.승인대기,status.eq.승인대기,status.eq.pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ accounts: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM pending account error:", error);
    return NextResponse.json({ message: "가입 신청을 확인하지 못했습니다." }, { status: 503 });
  }
}
