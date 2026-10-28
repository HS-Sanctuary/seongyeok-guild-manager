import "server-only";

import { getServerSupabase, hashSessionToken } from "@/lib/server/sanctumSession";

const ACCOUNT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AccountActivityError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AccountActivityError";
  }
}

export function accountActivityEnabled() {
  return process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED === "true";
}

export type AccountActivityResult = {
  status: "recorded" | "throttled";
  accountId: string;
  lastActiveAt: string;
};

// expectedAccountId is only a stale-context/cross-account guard. The RPC derives
// write ownership from the active server session, and its clock is authoritative.
export async function recordAccountActivity(token: string | undefined, expectedAccountId: string): Promise<AccountActivityResult> {
  if (!accountActivityEnabled()) throw new AccountActivityError(503, "활동 기록을 준비 중입니다.");
  if (!token) throw new AccountActivityError(401, "로그인이 필요합니다.");
  if (typeof expectedAccountId !== "string" || !ACCOUNT_ID.test(expectedAccountId)) {
    throw new AccountActivityError(400, "계정 정보를 확인해 주세요.");
  }
  const expected = expectedAccountId.toLowerCase();
  try {
    const { data, error } = await getServerSupabase().rpc("sanctum_touch_account_activity", {
      input_token_hash: hashSessionToken(token),
      input_expected_account_id: expected,
    });
    if (error) throw new Error("rpc failed");
    if (data?.status === "unauthorized") throw new AccountActivityError(401, "로그인이 필요합니다.");
    if (data?.status === "conflict") throw new AccountActivityError(409, "현재 계정을 다시 확인해 주세요.");
    if (!data || !["recorded", "throttled"].includes(data.status) || data.accountId !== expected || typeof data.lastActiveAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(data.lastActiveAt)) {
      throw new Error("invalid activity response");
    }
    const time = new Date(data.lastActiveAt);
    if (!Number.isFinite(time.getTime())) throw new Error("invalid activity time");
    return { status: data.status, accountId: expected, lastActiveAt: time.toISOString() };
  } catch (error) {
    if (error instanceof AccountActivityError) throw error;
    throw new AccountActivityError(503, "활동 기록을 확인하지 못했습니다.");
  }
}
