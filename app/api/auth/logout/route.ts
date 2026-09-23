import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, hashSessionToken, savedSessionCookieName, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SANCTUM_SESSION_COOKIE)?.value;
  let accountId: string | undefined;
  if (token) {
    try {
      accountId = (await getSessionAccount(token))?.id;
      await getServerSupabase().from("sanctum_sessions").delete().eq("token_hash", hashSessionToken(token));
    } catch (error) {
      console.error("SANCTUM logout cleanup error:", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SANCTUM_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  const savedCookie = accountId ? savedSessionCookieName(accountId) : null;
  if (savedCookie) response.cookies.set(savedCookie, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
