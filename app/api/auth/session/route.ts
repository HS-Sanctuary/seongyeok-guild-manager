import { NextRequest, NextResponse } from "next/server";
import {
  getSessionAccount,
  SANCTUM_SESSION_COOKIE,
} from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SANCTUM_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ account: null }, { headers: { "Cache-Control": "private, no-store" } });

    const account = await getSessionAccount(token);
    return NextResponse.json({ account }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM session lookup error:", error);
    return NextResponse.json({ account: null }, { status: 503 });
  }
}
