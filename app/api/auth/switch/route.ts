import { NextRequest, NextResponse } from "next/server";
import {
  getSessionAccount,
  isPendingAccount,
  savedSessionCookieName,
  SANCTUM_SESSION_COOKIE,
  SANCTUM_SESSION_MAX_AGE_SECONDS,
} from "@/lib/server/sanctumSession";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const savedCookie = savedSessionCookieName(accountId);
    const token = savedCookie ? request.cookies.get(savedCookie)?.value : undefined;
    const account = await getSessionAccount(token);
    if (!account || account.id !== accountId || isPendingAccount(account)) {
      return NextResponse.json({ message: "이 계정의 로그인 기간이 끝났습니다. 다시 접속해 주세요." }, { status: 401 });
    }

    const response = NextResponse.json({ account });
    response.cookies.set(SANCTUM_SESSION_COOKIE, token!, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SANCTUM_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("SANCTUM account switch error:", error);
    return NextResponse.json({ message: "계정을 전환하지 못했습니다." }, { status: 500 });
  }
}
