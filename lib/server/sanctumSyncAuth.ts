import "server-only";

import { NextRequest } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const SYNC_ROLES = new Set(["길드마스터", "부마스터"]);

export async function canRunSanctumSync(request: NextRequest) {
  const session = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  if (session && !isPendingAccount(session) && SYNC_ROLES.has(session.role)) return true;

  // The guild master's userscript runs on another origin, so it cannot use the
  // SANCTUM HttpOnly cookie. Require a fresh code instead of a stored API key.
  const nickname = request.headers.get("x-sanctum-nickname")?.trim() ?? "";
  const code = request.headers.get("x-sanctum-code") ?? "";
  if (!nickname || !code || nickname.length > 12 || code.length > 128) return false;

  const supabase = getServerSupabase();
  const { data: allowed, error: limitError } = await supabase.rpc("sanctum_allow_login_attempt", {
    input_nickname: nickname,
  });
  if (limitError) throw limitError;
  if (!allowed) return false;

  const { data, error } = await supabase.rpc("sanctum_verify_login", {
    input_nickname: nickname,
    input_code: code,
  });
  if (error) throw error;
  const account = data?.[0];
  if (!account || !SYNC_ROLES.has(account.role) || isPendingAccount(account)) return false;
  await supabase.from("sanctum_login_attempts").delete().eq("nickname", nickname.toLocaleLowerCase());
  return true;
}
