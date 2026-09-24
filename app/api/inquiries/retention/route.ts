import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const CATEGORIES = ["생텀 버그 제보", "생텀 건의사항"];
const BUCKET = "logos-reports";
const REVIEW_DAYS = 60;

async function requireMaster(request: NextRequest) {
  const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  return account && !isPendingAccount(account) && account.role === "길드마스터" ? account : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!await requireMaster(request)) return NextResponse.json({ message: "길드마스터만 확인할 수 있습니다." }, { status: 403 });
    const now = new Date().toISOString();
    const { data, error } = await getServerSupabase().from("inquiries")
      .select("id, title, category, created_at, retention_review_at")
      .in("category", CATEGORIES).lte("retention_review_at", now)
      .order("retention_review_at", { ascending: true }).limit(200);
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM report retention read failed:", error);
    return NextResponse.json({ message: "정리 검토 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await requireMaster(request)) return NextResponse.json({ message: "길드마스터만 보류할 수 있습니다." }, { status: 403 });
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ message: "글 번호가 올바르지 않습니다." }, { status: 400 });
    const db = getServerSupabase();
    const dueAt = new Date(Date.now() + REVIEW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await db.from("inquiries").update({ retention_review_at: dueAt })
      .eq("id", id).in("category", CATEGORIES).lte("retention_review_at", new Date().toISOString())
      .select("id, retention_review_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "검토 대상 글이 아니거나 이미 처리됐습니다." }, { status: 409 });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM report retention defer failed:", error);
    return NextResponse.json({ message: "검토를 보류하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await requireMaster(request)) return NextResponse.json({ message: "길드마스터만 삭제할 수 있습니다." }, { status: 403 });
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ message: "글 번호가 올바르지 않습니다." }, { status: 400 });
    const db = getServerSupabase();
    const { data: item, error: readError } = await db.from("inquiries")
      .select("id, attachment_paths, retention_review_at")
      .eq("id", id).in("category", CATEGORIES).lte("retention_review_at", new Date().toISOString()).maybeSingle();
    if (readError) throw readError;
    if (!item) return NextResponse.json({ message: "검토 대상 글이 아니거나 이미 처리됐습니다." }, { status: 409 });
    const paths = Array.isArray(item.attachment_paths) ? item.attachment_paths.filter((path): path is string => typeof path === "string") : [];
    if (paths.length) {
      const { error: storageError } = await db.storage.from(BUCKET).remove(paths);
      if (storageError) throw storageError;
    }
    const { data: deleted, error: deleteError } = await db.from("inquiries").delete()
      .eq("id", id).in("category", CATEGORIES).eq("retention_review_at", item.retention_review_at)
      .select("id").maybeSingle();
    if (deleteError) throw deleteError;
    if (!deleted) return NextResponse.json({ message: "글 상태가 바뀌어 삭제하지 않았습니다. 목록을 새로고침해 주세요." }, { status: 409 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM report retention delete failed:", error);
    return NextResponse.json({ message: "글 또는 첨부 사진을 삭제하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
