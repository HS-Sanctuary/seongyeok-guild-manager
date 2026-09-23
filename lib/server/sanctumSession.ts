import "server-only";

import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const SANCTUM_SESSION_COOKIE = "sanctum_session";
export const SANCTUM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ACCOUNT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function savedSessionCookieName(accountId: string) {
  if (!ACCOUNT_ID_PATTERN.test(accountId)) return null;
  return `sanctum_saved_${accountId.replaceAll("-", "").toLowerCase()}`;
}

export type SanctumSessionAccount = {
  id: string;
  nickname: string;
  role: string;
  status: string | null;
};

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("서버 인증 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPendingAccount(account: SanctumSessionAccount) {
  return ["승인대기", "pending"].includes(account.role) || ["승인대기", "pending"].includes(account.status ?? "");
}

export async function getSessionAccount(token?: string) {
  if (!token) return null;

  const supabase = getServerSupabase();
  const { data: session } = await supabase
    .from("sanctum_sessions")
    .select("account_id, expires_at")
    .eq("token_hash", hashSessionToken(token))
    .maybeSingle();

  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;

  const { data: account } = await supabase
    .from("accounts")
    .select("id, nickname, role, status")
    .eq("id", session.account_id)
    .maybeSingle();

  return (account as SanctumSessionAccount | null) ?? null;
}
