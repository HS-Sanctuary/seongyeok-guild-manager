import { NextRequest, NextResponse } from "next/server";
import {
  getServerSupabase,
  getSessionAccount,
  SANCTUM_SESSION_COOKIE,
  type SanctumSessionAccount,
} from "@/lib/server/sanctumSession";

const ROLE_HIERARCHY: Record<string, number> = {
  승인대기: 0,
  가입대기: 0,
  길드원: 1,
  "부마스터 대행": 2,
  부마스터: 3,
  길드마스터: 4,
};

const ASSIGNABLE_BY_ROLE: Record<string, string[]> = {
  길드마스터: ["길드원", "부마스터 대행", "부마스터", "길드마스터"],
  부마스터: ["길드원", "부마스터 대행"],
  "부마스터 대행": [],
};

function level(role: string) {
  return ROLE_HIERARCHY[role] ?? -1;
}

async function requireOperator(request: NextRequest, minimumLevel = 2) {
  const actor = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  if (!actor || level(actor.role) < minimumLevel) return null;
  return actor;
}

function accountResponse(account: { id: string; nickname: string; role: string; status: string | null; created_at: string | null }) {
  return {
    id: account.id,
    nickname: account.nickname,
    role: account.role,
    status: account.status,
    created_at: account.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireOperator(request))) {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { data, error } = await getServerSupabase()
      .from("accounts")
      .select("id, nickname, role, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ accounts: (data ?? []).map(accountResponse) });
  } catch (error) {
    console.error("Admin account list error:", error);
    return NextResponse.json({ message: "계정 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireOperator(request);
    if (!actor) return NextResponse.json({ message: "계정 관리 권한이 필요합니다." }, { status: 403 });

    const body = await request.json();
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const action = body.action as "approve" | "change_role";
    const requestedRole = typeof body.role === "string" ? body.role : "";
    if (!nickname || !["approve", "change_role"].includes(action)) {
      return NextResponse.json({ message: "요청 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: target, error: targetError } = await supabase
      .from("accounts")
      .select("id, nickname, role, status")
      .eq("nickname", nickname)
      .maybeSingle();
    if (targetError || !target) return NextResponse.json({ message: "대상 계정을 찾지 못했습니다." }, { status: 404 });

    if (action === "approve") {
      const { error } = await supabase.from("accounts").update({ role: "길드원", status: "승인" }).eq("id", target.id);
      if (error) throw error;
      return NextResponse.json({ account: { ...target, role: "길드원", status: "승인" } });
    }

    if (!ASSIGNABLE_BY_ROLE[actor.role]?.includes(requestedRole)) {
      return NextResponse.json({ message: "해당 직책을 부여할 권한이 없습니다." }, { status: 403 });
    }
    if (level(target.role) >= level(actor.role)) {
      return NextResponse.json({ message: "동급 또는 상위 직책의 권한은 변경할 수 없습니다." }, { status: 403 });
    }

    if (requestedRole === "길드마스터") {
      const { error: promoteError } = await supabase.from("accounts").update({ role: "길드마스터", status: "승인" }).eq("id", target.id);
      if (promoteError) throw promoteError;
      const { error: demoteError } = await supabase.from("accounts").update({ role: "부마스터", status: "승인" }).eq("id", actor.id);
      if (demoteError) throw demoteError;
      return NextResponse.json({ account: { ...target, role: "길드마스터", status: "승인" }, transferred: true });
    }

    const { error } = await supabase.from("accounts").update({ role: requestedRole, status: "승인" }).eq("id", target.id);
    if (error) throw error;
    return NextResponse.json({ account: { ...target, role: requestedRole, status: "승인" } });
  } catch (error) {
    console.error("Admin account update error:", error);
    return NextResponse.json({ message: "계정 권한을 변경하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireOperator(request, 3);
    if (!actor) return NextResponse.json({ message: "추방 및 거절은 부마스터 이상만 실행할 수 있습니다." }, { status: 403 });

    const nickname = new URL(request.url).searchParams.get("nickname")?.trim();
    if (!nickname) return NextResponse.json({ message: "대상 닉네임이 필요합니다." }, { status: 400 });

    const supabase = getServerSupabase();
    const { data: target } = await supabase.from("accounts").select("id, role").eq("nickname", nickname).maybeSingle();
    if (!target) return NextResponse.json({ message: "대상 계정을 찾지 못했습니다." }, { status: 404 });
    if (level(target.role) >= level(actor.role)) {
      return NextResponse.json({ message: "동급 또는 상위 직책 계정은 삭제할 수 없습니다." }, { status: 403 });
    }

    const { error } = await supabase.from("accounts").delete().eq("id", target.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin account delete error:", error);
    return NextResponse.json({ message: "계정을 삭제하지 못했습니다." }, { status: 500 });
  }
}
