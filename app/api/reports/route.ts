import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    }
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getServerSupabase();
    if (body?.type === "deep_hole") {
      const zone = typeof body.zone === "string" ? body.zone.trim() : "";
      const channel = typeof body.channel === "string" || typeof body.channel === "number" ? String(body.channel).trim() : "";
      if (!zone || zone.length > 80 || !channel || channel.length > 20) {
        return NextResponse.json({ message: "구역과 채널을 확인해주세요." }, { status: 400 });
      }
      const { error } = await supabase.from("deep_holes").insert({ zone, channel, reporter_name: account.nickname });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body?.type === "abyss") {
      const minutes = Number(body.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) {
        return NextResponse.json({ message: "남은 시간을 확인해주세요." }, { status: 400 });
      }
      const { error } = await supabase.from("abyss_reports").insert({
        reporter_name: account.nickname,
        channel: String(minutes),
        hole_time: new Date(Date.now() + minutes * 60_000).toISOString(),
        status: "pending",
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ message: "제보 종류가 올바르지 않습니다." }, { status: 400 });
  } catch (error) {
    console.error("SANCTUM report error:", error);
    return NextResponse.json({ message: "제보를 저장하지 못했습니다." }, { status: 500 });
  }
}
