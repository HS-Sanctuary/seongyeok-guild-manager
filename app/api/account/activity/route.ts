import { NextRequest, NextResponse } from "next/server";
import { accountActivityEnabled, AccountActivityError, recordAccountActivity } from "@/lib/server/accountActivity";
import { SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const MAX_BODY_BYTES = 256;
const ACCOUNT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "no-store" };

async function readExpectedAccountId(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new AccountActivityError(415, "JSON 요청이 필요합니다.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AccountActivityError(400, "계정 정보를 확인해 주세요.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new AccountActivityError(413, "요청이 너무 큽니다.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new AccountActivityError(400, "요청 형식을 확인해 주세요."); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !("expectedAccountId" in body) || typeof body.expectedAccountId !== "string" || !ACCOUNT_ID.test(body.expectedAccountId)) {
    throw new AccountActivityError(400, "계정 정보를 확인해 주세요.");
  }
  return body.expectedAccountId;
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403, headers });
    }
    if (!accountActivityEnabled()) {
      return NextResponse.json({ code:"activity-disabled", message: "활동 기록을 준비 중입니다." }, { status: 503, headers });
    }
    const expectedAccountId = await readExpectedAccountId(request);
    const result = await recordAccountActivity(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value, expectedAccountId);
    return NextResponse.json(result, { headers });
  } catch (error) {
    const status = error instanceof AccountActivityError ? error.status : 503;
    const message = error instanceof AccountActivityError ? error.message : "활동 기록을 확인하지 못했습니다.";
    return NextResponse.json({ message }, { status, headers });
  }
}
