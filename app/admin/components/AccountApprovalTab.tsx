"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface AccountItem {
  id?: string;
  nickname: string;
  code?: string;
  entry_code?: string;
  role: string;
  status?: string;
  created_at?: string;
}

interface AccountApprovalTabProps {
  currentUser?: {
    nickname?: string;
    role?: string;
    [key: string]: any;
  };
}

const ROLE_HIERARCHY: Record<string, number> = {
  승인대기: 0,
  가입대기: 0,
  길드원: 1,
  "부마스터 대행": 2,
  부마스터: 3,
  길드마스터: 4,
};

const ALL_ROLES = ["승인대기", "가입대기", "길드원", "부마스터 대행", "부마스터", "길드마스터"];

const isPendingAccount = (acc: AccountItem) => {
  const roleVal = acc.role?.trim();
  const statusVal = acc.status?.trim();
  return (
    !roleVal ||
    roleVal === "승인대기" ||
    roleVal === "가입대기" ||
    statusVal === "승인대기" ||
    statusVal === "가입대기"
  );
};

export default function AccountApprovalTab({ currentUser }: AccountApprovalTabProps) {
  const myRole = currentUser?.role || "길드마스터";
  const myLevel = ROLE_HIERARCHY[myRole] ?? 4;

  const [activeSubTab, setActiveSubTab] = useState<"requests" | "members">("requests");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("전체");
  const [updatingNickname, setUpdatingNickname] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message || error.details || "Supabase 데이터베이스 연결 권한을 확인해주세요.");
        setAccounts([]);
      } else {
        setAccounts(data || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "알 수 없는 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleApproveJoin = async (targetNickname: string) => {
    if (myLevel < 2) return alert("가입 승인 권한이 없습니다.");
    if (!confirm(`[${targetNickname}] 님의 생텀 가입 신청을 승인하고 '길드원' 권한을 부여하시겠습니까?`)) return;

    setUpdatingNickname(targetNickname);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ role: "길드원", status: "승인" })
        .eq("nickname", targetNickname);

      if (error) alert(`가입 승인 실패: ${error.message}`);
      else {
        setAccounts((prev) =>
          prev.map((acc) => (acc.nickname === targetNickname ? { ...acc, role: "길드원", status: "승인" } : acc))
        );
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setUpdatingNickname(null);
    }
  };

  const handleRejectOrDelete = async (targetNickname: string, isKick: boolean = false) => {
    if (myLevel < 3) return alert("추방 및 거절 권한은 부마스터 이상만 실행 가능합니다.");

    const actionName = isKick ? "추방" : "거절/삭제";
    if (!confirm(`정말 [${targetNickname}] 계정을 ${actionName}하시겠습니까?`)) return;

    setUpdatingNickname(targetNickname);
    try {
      const { error } = await supabase.from("accounts").delete().eq("nickname", targetNickname);

      if (error) alert(`${actionName} 실패: ${error.message}`);
      else setAccounts((prev) => prev.filter((acc) => acc.nickname !== targetNickname));
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setUpdatingNickname(null);
    }
  };

  const handleRoleChange = async (targetAccount: AccountItem, newRole: string) => {
    const targetNickname = targetAccount.nickname;
    const targetLevel = ROLE_HIERARCHY[targetAccount.role || "길드원"] ?? 1;

    if (targetLevel >= myLevel) return alert("본인과 동급이거나 상위 직책인 길드원의 권한은 변경할 수 없습니다.");

    if (newRole === "길드마스터") {
      if (myRole !== "길드마스터") return alert("길드마스터 권한은 현재 길드마스터만 위임할 수 있습니다.");

      const confirmTransfer = confirm(
        `⚠️ 길드마스터 권한 위임 안내\n\n정말 [${targetNickname}] 님에게 길드마스터 직책을 위임하시겠습니까?\n\n위임 완료 후 [${currentUser?.nickname || "본인"}] 님의 직책은 '부마스터'로 변경됩니다.`
      );
      if (!confirmTransfer) return;

      setUpdatingNickname(targetNickname);
      try {
        const { error: targetErr } = await supabase
          .from("accounts")
          .update({ role: "길드마스터", status: "승인" })
          .eq("nickname", targetNickname);

        if (targetErr) throw targetErr;

        if (currentUser?.nickname) {
          await supabase
            .from("accounts")
            .update({ role: "부마스터", status: "승인" })
            .eq("nickname", currentUser.nickname);
        }

        alert(`[${targetNickname}] 님에게 길드마스터 권한이 성공적으로 위임되었습니다.`);
        await fetchAccounts();
      } catch (err: any) {
        alert(`위임 처리 중 오류 발생: ${err.message}`);
      } finally {
        setUpdatingNickname(null);
      }
      return;
    }

    setUpdatingNickname(targetNickname);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ role: newRole, status: "승인" })
        .eq("nickname", targetNickname);

      if (error) alert(`직책 변경 실패: ${error.message}`);
      else {
        setAccounts((prev) =>
          prev.map((acc) => (acc.nickname === targetNickname ? { ...acc, role: newRole, status: "승인" } : acc))
        );
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setUpdatingNickname(null);
    }
  };

  const joinRequests = useMemo(() => accounts.filter((acc) => isPendingAccount(acc)), [accounts]);
  const approvedMembers = useMemo(() => accounts.filter((acc) => !isPendingAccount(acc)), [accounts]);

  const filteredMembers = useMemo(() => {
    return approvedMembers.filter((acc) => {
      const matchesSearch = acc.nickname.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "전체" ? true : acc.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [approvedMembers, searchTerm, roleFilter]);

  const getAssignableRolesForTarget = (targetRole: string) => {
    const targetLevel = ROLE_HIERARCHY[targetRole] ?? 1;
    if (targetLevel >= myLevel) return [];

    if (myRole === "길드마스터") return ["길드원", "부마스터 대행", "부마스터", "길드마스터"];
    if (myRole === "부마스터") return ["길드원", "부마스터 대행"];
    return [];
  };

  return (
    <div className="space-y-5">
      {/* 🏛️ 최상위 2단 서브 탭 (전역 테마 동기화) */}
      <div className="flex border-b border-[var(--panel-border)] gap-2 pb-2">
        <button
          onClick={() => setActiveSubTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === "requests"
              ? "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] shadow-md"
              : "bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)]"
          }`}
        >
          <span>📩 생텀 가입 요청</span>
          {joinRequests.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono font-black">
              {joinRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("members")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === "members"
              ? "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] shadow-md"
              : "bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)]"
          }`}
        >
          <span>🛡️ 길드원 권한 관리</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--panel)] text-[var(--text-sub)] font-mono border border-[var(--panel-border)]">
            {approvedMembers.length}
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs space-y-1">
          <div className="font-bold">🚨 데이터베이스 연결 에러</div>
          <p className="font-mono text-[11px] break-all">{errorMessage}</p>
        </div>
      )}

      {/* 📩 TAB 1: 생텀 가입 요청 */}
      {activeSubTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)]">
            <span className="text-xs text-[var(--text-sub)] font-medium">
              생텀 스마트 플랫폼 가입 승인을 대기 중인 신청자 목록입니다.
            </span>
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="px-3 py-1.5 bg-[var(--panel)] hover:bg-[var(--panel-border)] text-[var(--text-main)] border border-[var(--panel-border)] rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              🔄 {loading ? "동기화 중..." : "새로고침"}
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold animate-pulse">
              ⏳ 가입 신청 내역을 조회 중입니다...
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              현재 승인 대기 중인 생텀 가입 신청이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {joinRequests.map((acc) => {
                const codeDisplay = acc.code || acc.entry_code || "코드 미발급";

                return (
                  <div
                    key={acc.nickname}
                    className="p-4 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl transition-all space-y-3 flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-[var(--text-main)] truncate">{acc.nickname}</span>
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] rounded-full font-bold shrink-0">
                          승인 대기
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-sub)] font-mono">
                        입장 코드: <span className="text-[var(--accent)] font-bold">{codeDisplay}</span>
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[var(--panel-border)] flex items-center gap-2">
                      <button
                        onClick={() => handleApproveJoin(acc.nickname)}
                        disabled={updatingNickname === acc.nickname || myLevel < 2}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition cursor-pointer disabled:opacity-40"
                      >
                        ✅ 승인 (길드원)
                      </button>

                      {myLevel >= 3 && (
                        <button
                          onClick={() => handleRejectOrDelete(acc.nickname, false)}
                          disabled={updatingNickname === acc.nickname}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                        >
                          ❌ 거절
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🛡️ TAB 2: 길드원 권한 관리 */}
      {activeSubTab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)]">
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                placeholder="닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)] font-bold placeholder:[var(--text-sub)]"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)] font-bold cursor-pointer"
              >
                <option value="전체">모든 직책</option>
                {ALL_ROLES.filter((r) => r !== "가입대기" && r !== "승인대기").map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="px-3.5 py-1.5 bg-[var(--panel)] hover:bg-[var(--panel-border)] text-[var(--text-main)] border border-[var(--panel-border)] rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              🔄 {loading ? "동기화 중..." : "목록 새로고침"}
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold animate-pulse">
              ⏳ 길드원 명단을 수집하고 있습니다...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              조건에 부합하는 길드원이 존재하지 않습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMembers.map((acc) => {
                const targetRole = acc.role || "길드원";
                const targetLevel = ROLE_HIERARCHY[targetRole] ?? 1;

                const isLocked = targetLevel >= myLevel;
                const assignableRoles = getAssignableRolesForTarget(targetRole);

                return (
                  <div
                    key={acc.nickname}
                    className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                      isLocked
                        ? "bg-[var(--panel)] border-[var(--panel-border)] opacity-80"
                        : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[var(--text-main)] truncate">{acc.nickname}</span>
                          <span className="px-2 py-0.5 bg-[var(--panel)] text-[var(--accent)] border border-[var(--accent)]/30 text-[10px] rounded-full font-bold shrink-0">
                            {targetRole}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-sub)] font-mono">
                          입장 코드: <span className="text-[var(--text-main)] font-bold">{acc.code || acc.entry_code || "없음"}</span>
                        </p>
                      </div>

                      {isLocked && (
                        <span className="px-2 py-0.5 bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] text-[10px] rounded-lg shrink-0 font-bold">
                          🔒 수정 잠금
                        </span>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[var(--panel-border)] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[var(--text-sub)] font-bold shrink-0">직책 부여:</span>

                        {isLocked || assignableRoles.length === 0 ? (
                          <div className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-sub)] font-bold text-right">
                            변경 권한 없음
                          </div>
                        ) : (
                          <select
                            value={targetRole}
                            disabled={updatingNickname === acc.nickname}
                            onChange={(e) => handleRoleChange(acc, e.target.value)}
                            className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] text-xs text-[var(--accent)] rounded-lg px-2 py-1 outline-none focus:border-[var(--accent)] font-bold cursor-pointer disabled:opacity-50"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {r === "길드마스터" ? "👑 길드마스터 (위임)" : r}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {!isLocked && myLevel >= 3 && (
                        <button
                          onClick={() => handleRejectOrDelete(acc.nickname, true)}
                          disabled={updatingNickname === acc.nickname}
                          className="w-full py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                        >
                          🚨 길드원 추방
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}