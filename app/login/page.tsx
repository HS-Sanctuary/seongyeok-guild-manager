"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 💡 나중에 수파베이스 DB와 연결해서 실제 코드를 검증할 부분입니다.
    // 지금은 닉네임만 입력하면 통과되도록 임시 세팅해두었습니다.
    if (nickname.trim() !== "") {
      const role = nickname === "한설" ? "마스터" : "길드원"; // 한설님이 치면 마스터로 접속
      localStorage.setItem("nexus_user", JSON.stringify({ nickname, role }));
      router.push("/"); // 로그인 성공 시 메인 화면으로 이동
    } else {
      alert("닉네임을 입력해주세요!");
    }
  };

  return (
    <main className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#252528] border border-zinc-700/50 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#121212] border border-yellow-600/30 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl">🏰</span>
          </div>
          <h1 className="text-3xl font-black text-[#e6c788] tracking-tight">Sanctuary Nexus</h1>
          <p className="text-zinc-400 text-sm mt-2">데이안 서버 성역 길드 전용망</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">캐릭터 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-zinc-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
              placeholder="본캐릭 닉네임을 입력하세요"
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