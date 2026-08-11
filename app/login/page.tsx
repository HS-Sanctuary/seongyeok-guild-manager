"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AccountPreset {
  id: string;
  nickname: string;
  role: string;
  alias: string;
  borderColor: string;
  theme: string;
  bgImage?: string;
  dimmer?: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname || !code) {
      alert("대표 캐릭터 닉네임과 접속 코드를 모두 입력해주세요!");
      return;
    }
    setLoading(true);

    try {
      // 1. Supabase accounts 테이블에서 인증 검증
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("nickname", trimmedNickname)
        .eq("code", code)
        .single();

      if (error || !data) {
        alert("닉네임 또는 접속 코드가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      // 2. 인증 성공 시 다계정 스위처블 구조(sanctum_accounts) 동기화
      const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userRole = data.role || "길드원";
      const userTheme = "mint";
      const userBorderColor = "#E6C788";

      const newAccount: AccountPreset = {
        id: accountId,
        nickname: data.nickname,
        role: userRole,
        alias: data.nickname,
        borderColor: userBorderColor,
        theme: userTheme,
        bgImage: "",
        dimmer: 40
      };

      let existingAccounts: AccountPreset[] = [];
      try {
        const saved = localStorage.getItem("sanctum_accounts");
        if (saved) existingAccounts = JSON.parse(saved);
      } catch (err) {}

      // 동일 닉네임 중복 방지 후 최신 로그인 계정을 상단에 배치
      const filtered = existingAccounts.filter(a => a.nickname !== data.nickname);
      const updatedAccounts = [newAccount, ...filtered];

      // 3. 로컬 스토리지 일괄 저장 (다계정 배열 + 활성 계정 ID + 단일 호환용 nexus_user)
      localStorage.setItem("sanctum_accounts", JSON.stringify(updatedAccounts));
      localStorage.setItem("sanctum_active_account_id", accountId);
      localStorage.setItem("nexus_user", JSON.stringify({ 
        nickname: data.nickname, 
        role: userRole,
        alias: data.nickname,
        borderColor: userBorderColor,
        theme: userTheme
      }));

      // 4. 전역 계정 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: newAccount }));

      router.push("/");
    } catch (err) {
      console.error(err);
      alert("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#252528] border border-zinc-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          
          {/* 업데이트된 성역 엠블럼 아이콘 영역 */}
          <div className="w-20 h-20 bg-[#121212] border border-[#e6c788]/40 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e6c788]/20 to-transparent"></div>
            <svg className="w-10 h-10 text-[#e6c788] relative z-10 drop-shadow-[0_0_8px_rgba(230,199,136,0.5)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-[#e6c788] tracking-tight">SANCTUM</h1>
          <p className="text-zinc-400 text-sm mt-2">마비노기 모바일 데이안 서버 성역 길드</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">대표 캐릭터 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-zinc-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
              placeholder="대표 캐릭터 닉네임을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">접속 코드</label>
            <input 
              type="password" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-zinc-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
              placeholder="부여받은 코드를 입력하세요"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg mt-6 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? "확인 중..." : "생텀 접속"}
          </button>
        </form>
      </div>
    </main>
  );
}