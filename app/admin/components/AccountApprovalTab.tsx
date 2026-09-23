"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface AccountItem {
  id: string;
  nickname: string;
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
  const [operatorCode, setOperatorCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifiedRole, setVerifiedRole] = useState<string | null>(null);
  const myRole = verifiedRole || "";
  const myLevel = ROLE_HIERARCHY[myRole] ?? -1;

  const [activeSubTab, setActiveSubTab] = useState<"requests" | "members">("requests");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("전체");
  const [updatingNickname, setUpdatingNickname] = useState<string | null>(null);

  const operatorHeaders = useCallback((contentType = false): HeadersInit => ({
    "x-sanctum-operator": encodeURIComponent(currentUser?.nickname || ""),
    "x-sanctum-code": encodeURIComponent(operatorCode),
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  }), [currentUser?.nickname, operatorCode]);

  const fetchAccounts = useCallback(async () => {
    if (!operatorCode || !currentUser?.nickname) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/accounts", { cache: "no-store", headers: operatorHeaders() });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(result.message || "계정 목록을 불러올 권한이 없거나 연결에 실패했습니다.");
        setAccounts([]);
        setVerifiedRole(null);
        if (response.status === 403) setOperatorCode("");
      } else {
        setAccounts(result.accounts || []);
        setVerifiedRole(result.actor?.role || null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "알 수 없는 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.nickname, operatorCode, operatorHeaders]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleApproveJoin = async (targetNickname: string) => {
    if (myLevel < 2) return alert("가입 승인 권한이 없습니다.");
    if (!confirm(`[${targetNickname}] 님의 생텀 가입 신청을 승인하고 '길드원' 권한을 부여하시겠습니까?`)) return;

    setUpdatingNickname(targetNickname);
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: operatorHeaders(true),
        body: JSON.stringify({ action: "approve", nickname: targetNickname }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) alert(`가입 승인 실패: ${result.message || "알 수 없는 오류"}`);
      else {
        setAccounts((prev) =>
          prev.map((acc) => (acc.nickname === targetNickname ? { ...acc, role: "길드원", status: "승인" } : acc))
        );
        window.dispatchEvent(new Event("sanctum_approval_changed"));
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
      const response = await fetch(`/api/admin/accounts?nickname=${encodeURIComponent(targetNickname)}`, { method: "DELETE", headers: operatorHeaders() });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) alert(`${actionName} 실패: ${result.message || "알 수 없는 오류"}`);
      else {
        setAccounts((prev) => prev.filter((acc) => acc.nickname !== targetNickname));
        window.dispatchEvent(new Event("sanctum_approval_changed"));
      }
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
        const response = await fetch("/api/admin/accounts", {
          method: "PATCH",
          headers: operatorHeaders(true),
          body: JSON.stringify({ action: "change_role", nickname: targetNickname, role: newRole }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "권한 위임에 실패했습니다.");

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
      const response = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: operatorHeaders(true),
        body: JSON.stringify({ action: "change_role", nickname: targetNickname, role: newRole }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) alert(`직책 변경 실패: ${result.message || "알 수 없는 오류"}`);
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
      {!verifiedRole && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!codeInput.trim()) return;
            setErrorMessage(null);
            setOperatorCode(codeInput.trim());
            setCodeInput("");
          }}
          className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--panel)] p-4 sm:p-6 shadow-lg space-y-4"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xl">🔐</span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">먼저 본인 확인을 해주세요</h3>
              <p className="text-sm text-[var(--text-sub)]">가입 신청과 길드원 목록은 확인이 끝난 뒤 표시됩니다.</p>
            </div>
          </div>
          <label htmlFor="sanctum-operator-code" className="block text-sm font-bold text-[var(--text-main)]">
            {currentUser?.nickname || "현재 로그인한 계정"}님의 접속 코드
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="sanctum-operator-code"
              type="password"
              autoComplete="off"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="로그인할 때 사용한 본인 코드 입력"
              className="min-w-0 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--inner-box)] px-4 py-3 text-base text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
            />
            <button type="submit" disabled={loading || !codeInput.trim()} className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-black text-[var(--accent-fg)] disabled:opacity-50">{loading ? "확인 중..." : "본인 확인하고 목록 열기"}</button>
          </div>
          <p className="text-xs text-[var(--text-sub)]">신청자 코드가 아닌 본인의 로그인 코드입니다. 이 화면을 벗어나면 입력값은 지워집니다.</p>
        </form>
      )}
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
          <div className="font-bold">🚨 가입 승인 내역을 불러오지 못했습니다</div>
          <p className="text-sm break-words">{errorMessage}</p>
          {operatorCode && <button type="button" onClick={fetchAccounts} disabled={loading} className="mt-2 rounded-lg border border-rose-500/40 px-3 py-2 font-bold disabled:opacity-50">다시 연결</button>}
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
          ) : !verifiedRole ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              본인 확인 후 가입 신청 내역이 표시됩니다.
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              현재 승인 대기 중인 생텀 가입 신청이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {joinRequests.map((acc) => {
                return (
                  <div
                    key={acc.nickname}
                    className="p-4 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl transition-all space-y-3 flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 font-black text-sm text-[var(--text-main)] break-words [overflow-wrap:anywhere]">{acc.nickname}</span>
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] rounded-full font-bold shrink-0">
                          승인 대기
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-sub)]">신청자의 접속 코드는 관리자 화면에 표시되지 않습니다.</p>
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
          ) : !verifiedRole ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              본인 확인 후 길드원 목록이 표시됩니다.
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-sub)] text-xs font-bold bg-[var(--inner-box)]/50 rounded-xl border border-dashed border-[var(--panel-border)]">
              조건에 부합하는 길드원이 존재하지 않습니다.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)]">
              <div className="hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(7rem,0.8fr)] gap-4 border-b border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-xs font-bold text-[var(--text-sub)]">
                <span>닉네임</span><span>현재 직책</span><span>직책 변경</span><span className="text-right">계정 관리</span>
              </div>
              {filteredMembers.map((acc) => {
                const targetRole = acc.role || "길드원";
                const targetLevel = ROLE_HIERARCHY[targetRole] ?? 1;

                const isLocked = targetLevel >= myLevel;
                const assignableRoles = getAssignableRolesForTarget(targetRole);

                return (
                  <div
                    key={acc.nickname}
                    className={`grid min-w-0 grid-cols-1 gap-3 border-b border-[var(--panel-border)] p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(7rem,0.8fr)] lg:items-center lg:gap-4 ${
                      isLocked
                        ? "bg-[var(--panel)]/50"
                        : "hover:bg-[var(--panel-hover)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[var(--text-sub)] lg:hidden">닉네임</span>
                      <span className="block min-w-0 text-sm font-black text-[var(--text-main)] break-words [overflow-wrap:anywhere]">{acc.nickname}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[var(--text-sub)] lg:hidden">현재 직책</span>
                      <span className="inline-block max-w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs font-bold text-[var(--accent)] break-words [overflow-wrap:anywhere]">{targetRole}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[var(--text-sub)] lg:hidden">직책 변경</span>
                      {isLocked || assignableRoles.length === 0 ? (
                        <span className="block text-xs text-[var(--text-sub)]">{isLocked ? "동급·상위 직책 변경 불가" : "변경 권한 없음"}</span>
                      ) : (
                        <select
                          aria-label={`${acc.nickname} 직책 변경`}
                          value={targetRole}
                          disabled={updatingNickname === acc.nickname}
                          onChange={(e) => handleRoleChange(acc, e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-2 text-xs font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
                        >
                          {assignableRoles.map((r) => (
                            <option key={r} value={r}>{r === "길드마스터" ? "👑 길드마스터 (위임)" : r}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="min-w-0 sm:col-span-2 lg:col-span-1 lg:text-right">
                      {!isLocked && myLevel >= 3 ? (
                        <button
                          onClick={() => handleRejectOrDelete(acc.nickname, true)}
                          disabled={updatingNickname === acc.nickname}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 disabled:opacity-40"
                        >
                          길드원 추방
                        </button>
                      ) : <span className="text-xs text-[var(--text-sub)]">🔒 수정 잠금</span>}
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
