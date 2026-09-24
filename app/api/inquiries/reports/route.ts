import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const BUCKET = "logos-reports";
const CATEGORIES = new Set(["생텀 버그 제보", "생텀 건의사항"]);
const MAX_IMAGE_BYTES = 350 * 1024;

export async function POST(request: NextRequest) {
  const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2 * 1024 * 1024) return NextResponse.json({ message: "요청 용량이 너무 큽니다." }, { status: 413 });

  const uploaded: string[] = [];
  let saved = false;
  const db = getServerSupabase();
  try {
    const form = await request.formData();
    const category = String(form.get("category") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const images = form.getAll("images");
    if (!CATEGORIES.has(category) || !title || title.length > 120 || !content || content.length > 10000 || images.length > 3) {
      return NextResponse.json({ message: "제목·내용·사진 수를 확인해 주세요." }, { status: 400 });
    }
    if (images.some((image) => !(image instanceof File) || image.type !== "image/webp" || image.size < 1 || image.size > MAX_IMAGE_BYTES)) {
      return NextResponse.json({ message: "사진은 350KB 이하 WebP 파일 3장까지 첨부할 수 있습니다." }, { status: 400 });
    }

    const { data: recent, error: recentError } = await db.from("inquiries")
      .select("created_at").eq("reporter_account_id", account.id)
      .in("category", [...CATEGORIES]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (recentError) throw recentError;
    if (recent && Date.now() - Date.parse(recent.created_at) < 30000) {
      return NextResponse.json({ message: "연속 등록을 막기 위해 30초 뒤 다시 작성해 주세요." }, { status: 429 });
    }

    const buffers = await Promise.all(images.map(async (image) => Buffer.from(await (image as File).arrayBuffer())));
    for (const bytes of buffers) {
      if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
        return NextResponse.json({ message: "사진 파일 형식이 올바르지 않습니다." }, { status: 400 });
      }
    }
    const requestId = randomUUID();
    for (const [index, bytes] of buffers.entries()) {
      const path = `${account.id}/${requestId}/${index + 1}.webp`;
      const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      uploaded.push(path);
    }

    const { data, error } = await db.from("inquiries").insert({
      category, title, content, author: account.nickname, status: "대기중",
      is_secret: true, attachment_paths: uploaded, reporter_account_id: account.id,
      retention_review_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id, category, title, content, author, status, created_at, reply, attachment_paths").single();
    if (error) throw error;
    saved = true;
    return NextResponse.json({ data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM report creation failed:", error);
    return NextResponse.json({ message: "제보를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  } finally {
    if (!saved && uploaded.length) {
      const { error } = await db.storage.from(BUCKET).remove(uploaded);
      if (error) console.error("SANCTUM orphaned report image cleanup failed:", error);
    }
  }
}
