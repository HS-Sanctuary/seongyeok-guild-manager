import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const id = Number(request.nextUrl.searchParams.get("inquiryId"));
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ message: "글 번호가 올바르지 않습니다." }, { status: 400 });

    const db = getServerSupabase();
    const { data: inquiry, error } = await db.from("inquiries")
      .select("reporter_account_id, attachment_paths").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!inquiry) return NextResponse.json({ message: "글을 찾지 못했습니다." }, { status: 404 });
    if (account.role !== "길드마스터" && inquiry.reporter_account_id !== account.id) {
      return NextResponse.json({ message: "첨부 사진을 볼 권한이 없습니다." }, { status: 403 });
    }
    const paths = Array.isArray(inquiry.attachment_paths) ? inquiry.attachment_paths : [];
    if (!paths.length) return NextResponse.json({ images: [] }, { headers: { "Cache-Control": "private, no-store" } });
    const { data, error: signError } = await db.storage.from("logos-reports").createSignedUrls(paths, 300);
    if (signError) throw signError;
    return NextResponse.json({ images: (data ?? []).filter((item) => item.signedUrl).map((item) => item.signedUrl) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("SANCTUM report image read failed:", error);
    return NextResponse.json({ message: "첨부 사진을 불러오지 못했습니다." }, { status: 500 });
  }
}
