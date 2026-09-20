"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AccountItem {
  id?: string;
  nickname: string;
  code?: string;
  entry_code?: string;
  role: string;
  created_at?: string;
}

interface AccountApprovalTabProps {
  currentUser?: any;
}

const ROLES = ["가입대기", "길드원", "부마스터 대행", "부마스터", "길드마스터"];

export default function AccountApprovalTab({ currentUser }: AccountApprovalTabProps) {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("전체");
  const [updatingNickname, setUpdatingNickname] = useState<string | null>(null);

  // 계정 목록 조회 (상세 에러 파싱 포함)
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("📋 Supabase accounts fetch error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        setErrorMessage(
          error.message || error.details || "Supabase 데이터베이스 연결 권한을 확인해주세요."
        );
        setAccounts([]);
      } else {
        setAccounts(data || []);
      }
    } catch (err: any) {
      console.error("📋 Catch error during fetchAccounts:", err);
      setErrorMessage(err?.message || "알 수 없는 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 권한 변경 처리
  const handleRoleChange = async (targetNickname: string, newRole: string) => {
    setUpdatingNickname(targetNickname);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ role: newRole })
        .eq("nickname", targetNickname);

      if (error) {
        alert(`권한 변경 실패: ${error.message}`);
      } else {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.nickname === targetNickname ? { ...acc, role: newRole } : acc
          )
        );
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setUpdatingNickname(null);
    }
  };

  // 계정 삭제 / 거절 처리
  const handleDeleteAccount = async (targetNickname: string) => {
    if (!confirm(`정말 [${targetNickname}] 계정 신청을 삭제/거절하시겠습니까?`)) {
      return;
    }

    setUpdatingNickname(targetNickname);
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("nickname", targetNickname);

      if (error) {
        alert(`삭제 실패: ${error.message}`);
      } else {
        setAccounts((prev) => prev.filter((acc) => acc.nickname !== targetNickname));
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setUpdatingNickname(null);
    }
  };

  // 필터링 계산
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.nickname
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "전체" ? true : acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* 상단 툴바 (검색 & 필터 & 새로고침) */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="닉네임으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs md:text-sm text-zinc-200 focus:outline-none focus:border-[#e6c788]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs md:text-sm text-zinc-300 focus:outline-none focus:border-[#e6c788]"
          >
            <option value="전체">모든 권한</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchAccounts}
          disabled={loading}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          🔄 {loading ? "동기화 중..." : "목록 새로고침"}
        </button>
      </div>

      {/* 에러 안내 배너 */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs md:text-sm space-y-2">
          <div className="font-bold flex items-center gap-2">
            <span>🚨</span> 데이터베이스 요청 에러 발생
          </div>
          <p className="text-rose-400/90 font-mono text-[11px] break-all">
            {errorMessage}
          </p>
          <div className="text-[11px] text-rose-300/70 pt-1 border-t border-rose-900/50">
            * Supabase SQL Editor에서 RLS 정책(`CREATE POLICY ...`)을 실행했는지 확인해 주세요.
          </div>
        </div>
      )}

      {/* 계정 목록 (카드 형태 방어적 반응형 UI) */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">
          ⏳ 계정 데이터를 수집하는 중입니다...
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
          조건에 부합하는 계정이 존재하지 않습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAccounts.map((acc) => {
            const isWaiting = acc.role === "가입대기" || !acc.role;
            const codeDisplay = acc.code || acc.entry_code || "코드 없음";

            return (
              <div
                key={acc.nickname}
                className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                  isWaiting
                    ? "bg-amber-950/20 border-amber-800/50 shadow-lg shadow-amber-950/10"
                    : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* 카드 상단 헤더 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base text-zinc-100 truncate">
                        {acc.nickname}
                      </span>
                      {isWaiting && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] rounded-full font-semibold shrink-0">
                          승인 대기
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">
                      입장 코드: <span className="text-zinc-300">{codeDisplay}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAccount(acc.nickname)}
                    disabled={updatingNickname === acc.nickname}
                    className="text-zinc-600 hover:text-rose-400 p-1 text-xs transition-colors cursor-pointer"
                    title="계정 삭제/거절"
                  >
                    ❌
                  </button>
                </div>

                {/* 카드 하단 권한 조작 바 */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400 font-medium shrink-0">
                    권한 설정:
                  </span>
                  <select
                    value={acc.role || "가입대기"}
                    disabled={updatingNickname === acc.nickname}
                    onChange={(e) => handleRoleChange(acc.nickname, e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 text-xs text-[#e6c788] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#e6c788] font-bold cursor-pointer disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}