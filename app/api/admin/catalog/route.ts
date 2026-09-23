import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const TABLES = new Set([
  "nexus_banners",
  "nexus_tasks",
  "nexus_contents",
  "content_power_reqs",
  "nexus_classes",
  "nexus_trades",
  "nexus_missions",
  "gnosis_guides",
]);
type Action = "insert" | "update" | "upsert" | "delete";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    }

    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account) || !ADMIN_ROLES.has(account.role)) {
      return NextResponse.json({ message: "운영진 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const table = body?.table;
    const action = body?.action as Action;
    const id = body?.id;
    const payload = body?.payload;
    if (typeof table !== "string" || !TABLES.has(table) || !["insert", "update", "upsert", "delete"].includes(action)) {
      return NextResponse.json({ message: "허용되지 않은 관리 작업입니다." }, { status: 400 });
    }
    if (["update", "delete"].includes(action) && !(typeof id === "string" || typeof id === "number")) {
      return NextResponse.json({ message: "대상 ID가 필요합니다." }, { status: 400 });
    }
    if (action !== "delete" && (!payload || typeof payload !== "object" || Array.isArray(payload))) {
      return NextResponse.json({ message: "저장할 내용이 올바르지 않습니다." }, { status: 400 });
    }
    if (action === "upsert" && table !== "content_power_reqs") {
      return NextResponse.json({ message: "이 항목은 upsert를 지원하지 않습니다." }, { status: 400 });
    }

    const supabase = getServerSupabase();
    let query;
    if (action === "insert") query = supabase.from(table).insert(payload).select();
    else if (action === "update") query = supabase.from(table).update(payload).eq("id", id).select();
    else if (action === "upsert") query = supabase.from(table).upsert(payload, { onConflict: "content_id,difficulty" }).select();
    else query = supabase.from(table).delete().eq("id", id).select();

    const { data, error } = await query;
    if (error) {
      console.error("SANCTUM admin catalog mutation failed:", table, action, error.message);
      return NextResponse.json({ message: "관리 항목을 저장하지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("SANCTUM admin catalog error:", error);
    return NextResponse.json({ message: "관리 작업을 처리하지 못했습니다." }, { status: 500 });
  }
}
