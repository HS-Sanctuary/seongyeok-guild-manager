"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("nickname", trimmedNickname)
        .eq("code", code)
        .single();

      if (error || !data) {
        alert("닉네임 또는 접속 코드가 올바르지 않습니다.");
      } else {
        localStorage.setItem("nexus_user", JSON.stringify({ nickname: data.nickname, role: data.role }));
        router.push("/");
      }
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
          <div className="w-20 h-20 bg-[#121212] border border-yellow-600/30 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl">🏰</span>
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
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg mt-6 transition disabled:opacity-50"
          >
            {loading ? "확인 중..." : "생텀 접속"}
          </button>
        </form>
      </div>
    </main>
  );
}