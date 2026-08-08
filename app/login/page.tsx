"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 🟢 요청하신 계정 및 접속 코드 매핑
const ACCOUNTS: Record<string, string> = {
  "한설": "sy0923",
  "화연": "sy0515",
  "수도사는수도사": "sy0823",
  "제스": "sy0720",
  "신파랑": "sy0729",
  "곰탕": "sy0000"
};

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      alert("대표 캐릭터 닉네임을 입력해주세요!");
      return;
    }

    // 접속 코드 검증
    if (ACCOUNTS[trimmedNickname] === code) {
      const role = trimmedNickname === "한설" ? "마스터" : "길드원"; 
      localStorage.setItem("nexus_user", JSON.stringify({ nickname: trimmedNickname, role }));
      router.push("/"); // 메인 화면으로 이동
    } else {
      alert("닉네임 또는 접속 코드가 올바르지 않습니다.");
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
          {/* 🟢 문구 수정 완료 */}
          <p className="text-zinc-400 text-sm mt-2">마비노기 모바일 데이안 서버 성역 길드</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            {/* 🟢 레이블 수정 완료 */}
            <label className="block text-xs font-bold text-zinc-400 mb-1">대표 캐릭터 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-zinc-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
              {/* 🟢 플레이스홀더 수정 완료 */}
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
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg mt-6 transition"
          >
            넥서스 접속
          </button>
        </form>
      </div>
    </main>
  );
}