import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";
import { MISSION_TOWNS } from "@/lib/kronos";

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const TABLES = new Set([
  "nexus_banners",
  "nexus_tasks",
  "nexus_contents",
  "content_power_reqs",
  "nexus_classes",
  "nexus_trades",
  "nexus_missions",
  "kronos_shop_items",
  "kronos_missions",
  "gnosis_guides",
]);
type Action = "insert" | "update" | "upsert" | "delete";

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account) || !ADMIN_ROLES.has(account.role)) return NextResponse.json({ message: "운영진 권한이 필요합니다." }, { status: 403 });
    const table = request.nextUrl.searchParams.get("table") || "";
    if (!TABLES.has(table)) return NextResponse.json({ message: "허용되지 않은 항목입니다." }, { status: 400 });
    const { data, error } = await getServerSupabase().from(table).select("*").order("id", { ascending: false });
    if (error) return NextResponse.json({ message: "카탈로그를 불러오지 못했습니다. 새 기능 준비 SQL 적용 여부를 확인해 주세요." }, { status: 503 });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "카탈로그 조회에 실패했습니다." }, { status: 503 }); }
}

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
    if (action !== "delete" && ["nexus_trades", "kronos_shop_items"].includes(table)) {
      const validNumber = (v: unknown, min: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= 1000000000;
      if (![payload.map, payload.npc, payload.reward].every(v => typeof v === "string" && v.trim() && v.length <= 200)
        || !validNumber(payload.reward_cnt, 1) || !validNumber(payload.cost_cnt, 0) || !validNumber(payload.limit, 1) || payload.limit > 9999
        || !["일간", "주간"].includes(payload.reset_type) || !["캐릭당", "계정당"].includes(payload.scope)
        || (table === "nexus_trades" && (typeof payload.cost !== "string" || !payload.cost.trim() || payload.cost.length > 200))) {
        return NextResponse.json({ message: "품목 이름·수량·초기화 기준을 확인해 주세요." }, { status: 400 });
      }
    }
    if (table === "kronos_missions" && action !== "delete") {
      if (!MISSION_TOWNS.includes(payload.town) || typeof payload.title !== "string" || !payload.title.trim() || payload.title.length > 200
        || typeof payload.description !== "string" || payload.description.length > 3000 || !Number.isSafeInteger(payload.max_count) || payload.max_count < 1 || payload.max_count > 9999
        || !Array.isArray(payload.rewards) || payload.rewards.length < 1 || payload.rewards.length > 6
        || !payload.rewards.every((r: {name?: unknown; count?: unknown}) => typeof r.name === "string" && r.name.trim() && r.name.length <= 100 && typeof r.count === "number" && Number.isSafeInteger(r.count) && r.count > 0 && r.count <= 1000000000)) {
        return NextResponse.json({ message: "마을·임무·보상 수량을 확인해 주세요." }, { status: 400 });
      }
    }
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
