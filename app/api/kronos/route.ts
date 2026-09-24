import { NextRequest, NextResponse } from "next/server";
import {
  getServerSupabase,
  getSessionAccount,
  isPendingAccount,
  SANCTUM_SESSION_COOKIE,
} from "@/lib/server/sanctumSession";
import { NOTE_COLORS, NOTE_FONTS } from "@/lib/kronos";

async function actor(request: NextRequest, character: unknown) {
  const account = await getSessionAccount(
    request.cookies.get(SANCTUM_SESSION_COOKIE)?.value,
  );
  if (!account || isPendingAccount(account)) return null;
  if (typeof character !== "string" || !character || character.length > 100)
    return null;
  const db = getServerSupabase();
  const { data, error } = await db
    .from("characters")
    .select("nickname")
    .eq("nickname", character)
    .eq("owner", account.nickname)
    .maybeSingle();
  return !error && data ? { account, db, character } : null;
}
const unavailable = () =>
  NextResponse.json(
    {
      message:
        "추가 기능을 준비 중입니다. 운영진에게 준비 상태를 확인해 주세요.",
    },
    { status: 503 },
  );

export async function GET(request: NextRequest) {
  try {
    const ctx = await actor(
      request,
      request.nextUrl.searchParams.get("character"),
    );
    if (!ctx)
      return NextResponse.json(
        { message: "본인 캐릭터로 로그인해 주세요." },
        { status: 403 },
      );
    const { db, account, character } = ctx;
    const [shops, missions, progress, notes] = await Promise.all([
      db
        .from("kronos_shop_items")
        .select("*")
        .eq("is_active", true)
        .order("id"),
      db.from("kronos_missions").select("*").eq("is_active", true).order("id"),
      db.from("kronos_progress").select("*").eq("account_id", account.id),
      db
        .from("kronos_reminders")
        .select("slot,title,content,color,font,font_size")
        .eq("account_id", account.id)
        .eq("character_name", character),
    ]);
    if ([shops, missions, progress, notes].some((r) => r.error))
      return unavailable();
    return NextResponse.json(
      {
        shops: shops.data,
        missions: missions.data,
        progress: progress.data?.filter(
          (p) => !p.character_name || p.character_name === character,
        ),
        notes: notes.data,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin)
      return NextResponse.json(
        { message: "요청 출처를 확인할 수 없습니다." },
        { status: 403 },
      );
    const body = await request.json();
    const ctx = await actor(request, body.character);
    if (!ctx)
      return NextResponse.json(
        { message: "본인 캐릭터만 수정할 수 있습니다." },
        { status: 403 },
      );
    const { db, account, character } = ctx;
    if (body.action === "progress") {
      if (
        !["shop", "mission"].includes(body.kind) ||
        !Number.isSafeInteger(body.itemId) ||
        body.itemId < 1 ||
        !Number.isSafeInteger(body.delta) ||
        body.delta < -9999 || body.delta > 9999 ||
        (body.bookmarked !== undefined && typeof body.bookmarked !== "boolean")
      ) {
        return NextResponse.json(
          { message: "진행 정보가 올바르지 않습니다." },
          { status: 400 },
        );
      }
      const { data, error } = await db.rpc("sanctum_kronos_progress", {
        p_account: account.id,
        p_character: character,
        p_kind: body.kind,
        p_item: body.itemId,
        p_delta: body.delta,
        p_bookmarked: body.bookmarked ?? null,
      });
      if (error || !data?.[0]) return unavailable();
      return NextResponse.json({ progress: data?.[0] });
    }
    if (body.action === "note" || body.action === "delete-note") {
      if (![0, 1].includes(body.slot))
        return NextResponse.json(
          { message: "메모 슬롯이 올바르지 않습니다." },
          { status: 400 },
        );
      if (body.action === "delete-note") {
        const { error } = await db
          .from("kronos_reminders")
          .delete()
          .eq("account_id", account.id)
          .eq("character_name", character)
          .eq("slot", body.slot);
        return error ? unavailable() : NextResponse.json({ success: true });
      }
      if (
        typeof body.title !== "string" ||
        body.title.length > 100 ||
        typeof body.content !== "string" ||
        body.content.length > 10000 ||
        !NOTE_COLORS.includes(body.color) ||
        !NOTE_FONTS.includes(body.font) ||
        ![0.7, 0.85, 1, 1.2].includes(body.font_size)
      ) {
        return NextResponse.json(
          { message: "메모 내용을 확인해 주세요." },
          { status: 400 },
        );
      }
      const { data, error } = await db
        .from("kronos_reminders")
        .upsert(
          {
            account_id: account.id,
            character_name: character,
            slot: body.slot,
            title: body.title,
            content: body.content,
            color: body.color,
            font: body.font,
            font_size: body.font_size,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "account_id,character_name,slot" },
        )
        .select("slot,title,content,color,font,font_size")
        .single();
      return error ? unavailable() : NextResponse.json({ note: data });
    }
    return NextResponse.json(
      { message: "허용되지 않은 작업입니다." },
      { status: 400 },
    );
  } catch {
    return unavailable();
  }
}
