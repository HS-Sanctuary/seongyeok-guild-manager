"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. 오리지널 기획용 6개 상시 노출 캐릭터 데이터 상태 관리
  const [characterGrid, setCharacterGrid] = useState([
    { id: 1, name: "한설", job: "전사", icon: "⚔️", daily: false, weekly: false, donate: false },
    { id: 2, name: "화연", job: "마법사", icon: "🪄", daily: false, weekly: false, donate: false },
    { id: 3, name: "탄월...", job: "도적", icon: "🗡️", daily: false, weekly: false, donate: false },
    { id: 4, name: "회연", job: "궁수", icon: "🏹", daily: false, weekly: false, donate: false },
    { id: 5, name: "문도", job: "기사", icon: "🛡️", daily: false, weekly: false, donate: false },
    { id: 6, name: "장제...", job: "전사", icon: "⚔️", daily: false, weekly: false, donate: false },
  ]);

  // 2. 파티 매칭 및 참가 제어 상태 관리
  const [parties, setParties] = useState([
    {
      id: 1,
      title: "[4종] 어비스 매어 4종 고고링 (파티장)",
      status: "3 / 4",
      time: "오후 8:00",
      leader: "앤히크",
      members: [
        { name: "앤히크", role: "전사" },
        { name: "게임은어려움", role: "힐러" },
        { name: "타바르타스", role: "힐러" },
        { name: "앤히크", role: "전사" },
        { name: "게임은어려움", role: "힐러" },
        { name: "필드타자", role: "전사" },
        { name: "타바르타잔", role: "힐러" },
        { name: "이성태지", role: "딜러" },
      ]
    },
    {
      id: 2,
      title: "타바르타스 매어 8/8",
      status: "8 / 8",
      time: "오후 8:20",
      leader: "앤히크",
      members: [
        { name: "앤히크", role: "전사" },
        { name: "게임은어려움", role: "힐러" },
        { name: "타바르타스", role: "힐러" }
      ]
    }
  ]);

  const handleGridCheck = (id: number, field: "daily" | "weekly" | "donate") => {
    setCharacterGrid(prev => prev.map(char => {
      if (char.id === id) {
        return { ...char, [field]: !char[field] };
      }
      return char;
    }));
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#141416] flex items-center justify-center text-zinc-500">성역 시스템 동기화 중...</div>;
  }

  return (
    <main className="min-h-screen bg-[#141416] text-[#e3e3e6] font-sans">
      
      {/* 최상단 검은색 슬림 네비게이션 바 */}
      <div className="w-full bg-[#1b1b1d] border-b border-zinc-800/60 px-4 py-2 flex justify-between items-center text-xs text-zinc-400">
        <div className="flex items-center gap-1 font-bold text-zinc-300">
          <span>🏰</span> 성역 길드
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition">
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">🧑</div>
          <span>한설</span>
          <span className="text-[10px] text-zinc-500">마스터</span>
          <span className="text-[9px]">▼</span>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        
        {/* 웅장한 다크 오렌지 메인 타이틀 배너 */}
        <header className="flex items-center gap-6 bg-[#1a1a1c] border border-zinc-800/40 p-6 rounded-xl mb-6 shadow-lg">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-black rounded-2xl border border-zinc-700 overflow-hidden flex-shrink-0 shadow-inner relative">
            <img src="/logo.jpg" alt="Sanctuary Logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent mix-blend-overlay"></div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#e5c687] via-[#f79433] to-[#e5c687] drop-shadow-md">
              성역 Guild Manager
            </h1>
            <p className="text-zinc-500 text-xs md:text-sm font-medium tracking-wide mt-1.5">
              마비노기 모바일 <span className="text-zinc-600">|</span> 데이안 서버 길드 매니저
            </p>
          </div>
        </header>

        {/* 메인 시스템 Grid 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ================= 왼쪽 컬럼 영역 ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* 오리지널 바둑판 배열 숙제 체커 */}
            <section className="bg-[#1a1a1c] border border-zinc-800/80 rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-800/50 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-orange-500">🔥</span> 오늘 해야 할 숙제
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase bg-[#222225] px-2 py-0.5 rounded border border-zinc-800">[LG:COL-SPAN-2]</span>
              </div>

              {/* 6개 캐릭터 상시 노출 격자 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {characterGrid.map((char) => (
                  <div key={char.id} className="bg-[#222225] border border-zinc-800 rounded-xl p-3.5 hover:border-orange-500/30 transition duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-white text-base tracking-tight">{char.name}</span>
                      <span className="text-zinc-500 text-xs" title={char.job}>{char.icon}</span>
                    </div>
                    {/* 캐릭터 이름 하단 오렌지색 포인트 라인 */}
                    <div className="w-8 h-[2px] bg-gradient-to-r from-orange-500 to-amber-400 rounded mb-4"></div>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none group">
                        <input type="checkbox" checked={char.daily} onChange={() => handleGridCheck(char.id, "daily")} className="w-4 h-4 rounded border-zinc-700 bg-[#141416] accent-orange-500 cursor-pointer" />
                        <span className="group-hover:text-zinc-200 transition">일일 퀘스트</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none group">
                        <input type="checkbox" checked={char.weekly} onChange={() => handleGridCheck(char.id, "weekly")} className="w-4 h-4 rounded border-zinc-700 bg-[#141416] accent-orange-500 cursor-pointer" />
                        <span className="group-hover:text-zinc-200 transition">주간 던전</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none group">
                        <input type="checkbox" checked={char.donate} onChange={() => handleGridCheck(char.id, "donate")} className="w-4 h-4 rounded border-zinc-700 bg-[#141416] accent-orange-500 cursor-pointer" />
                        <span className="group-hover:text-zinc-200 transition">길드 기부</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 왼쪽 하단: 길드원 종합 진행률 보드 */}
            <section className="bg-[#1a1a1c] border border-zinc-800/80 rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-orange-400">👑</span> 길드원 종합 진행률
                </h2>
              </div>
              <p className="text-xs text-zinc-500 font-bold mb-4 uppercase tracking-wider">[이번달 점수 랭킹]</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-5 text-center text-amber-400 font-extrabold italic text-sm">1</span>
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-white font-bold">1위 멜오크</span><span className="text-orange-400 font-mono font-bold">94.5%</span></div>
                    <div className="w-full bg-[#141416] h-1.5 rounded-full"><div className="bg-gradient-to-r from-orange-600 to-amber-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ width: '94.5%' }}></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-5 text-center text-zinc-400 font-bold italic text-sm">2</span>
                  <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-300 font-medium">2위 화연</span><span className="text-zinc-400 font-mono">81.2%</span></div>
                    <div className="w-full bg-[#141416] h-1.5 rounded-full"><div className="bg-zinc-600 h-1.5 rounded-full" style={{ width: '81.2%' }}></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-5 text-center text-zinc-500 font-bold italic text-sm">3</span>
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-300 font-medium">3위 탄월...</span><span className="text-zinc-400 font-mono">76.0%</span></div>
                    <div className="w-full bg-[#141416] h-1.5 rounded-full"><div className="bg-zinc-600 h-1.5 rounded-full" style={{ width: '76%' }}></div></div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ================= 오른쪽 컬럼 영역 ================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* 오리지널 파티 매칭방 연동 UI */}
            <section className="bg-[#1a1a1c] border border-zinc-800/80 rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-zinc-400">⚔️</span> 현재 매칭중인 파티
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase bg-[#222225] px-2 py-0.5 rounded border border-zinc-800">[LG:COL-SPAN-3]</span>
              </div>

              {/* 오리지널 상단 컨트롤러 크루 */}
              <div className="space-y-3 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-zinc-400 font-medium">
                    초대받을 닉네임 : <span className="text-white font-extrabold">앤히크</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className="bg-[#24a148] hover:bg-[#208a3e] text-white text-[11px] px-2.5 py-1 rounded font-bold transition">닉네임변경</button>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] px-2.5 py-1 rounded border border-zinc-700 transition">칭호</button>
                    <button className="bg-orange-600 hover:bg-orange-500 text-white text-[11px] px-2.5 py-1 rounded font-bold transition shadow-md shadow-orange-950/40">파티 생성</button>
                    <button className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[11px] px-2.5 py-1 rounded border border-red-900/30 transition">로그아웃</button>
                  </div>
                </div>

                {/* 직업군 필터 뱃지 인터페이스 */}
                <div className="flex items-center gap-2 bg-[#141416] p-2 rounded-lg border border-zinc-800 text-xs">
                  <span className="text-zinc-500 font-semibold">직업군 :</span>
                  <div className="flex gap-1.5">
                    <span className="cursor-pointer bg-orange-950/40 text-orange-400 border border-orange-900/40 px-1.5 py-0.5 rounded text-[10px]">⚔️</span>
                    <span className="cursor-pointer bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">🛡️</span>
                    <span className="cursor-pointer bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">🪄</span>
                    <span className="cursor-pointer bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">🏹</span>
                  </div>
                </div>
              </div>

              {/* 실시간 확장형 파티 카드 목록 */}
              <div className="space-y-4">
                {parties.map((party) => (
                  <div key={party.id} className="bg-[#222225] border border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-extrabold text-sm text-zinc-200 hover:text-orange-400 transition cursor-pointer flex-1">
                        {party.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-[#141416] text-orange-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold">
                          {party.status}
                        </span>
                        <span className="text-zinc-600 text-xs cursor-pointer">▲</span>
                      </div>
                    </div>

                    {/* 참가원들의 상세 직업군 매칭 그리드 보드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#141416] p-2.5 rounded-lg border border-zinc-800/80 mb-3">
                      {party.members.map((member, i) => (
                        <div key={i} className="bg-[#222225] border border-zinc-800/60 rounded px-2 py-1 flex items-center gap-1.5 text-[11px]">
                          <span className="text-orange-400/80 text-[10px]">🛡️</span>
                          <span className="text-zinc-300 truncate max-w-[70px]">{member.name}</span>
                          <span className="text-[9px] text-zinc-500 font-medium">{member.role}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-gradient-to-b from-[#3a3a3e] to-[#2a2a2e] hover:from-[#4a4a4f] hover:to-[#3a3a3f] text-zinc-300 text-xs py-2 rounded-lg font-bold border border-zinc-700/60 transition shadow-inner">
                        출발
                      </button>
                      <button className="flex-1 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs py-2 rounded-lg font-bold transition shadow-md shadow-red-950/40">
                        파티삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 오른쪽 하단: 다른 그룹의 진행 현황 보드 */}
            <section className="bg-[#1a1a1c] border border-zinc-800/80 rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-[#dfb86c]">📊</span> 길드원 종합 진행률
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-[#222225] px-2 py-0.5 rounded border border-zinc-800">[LG:COL-SPAN-3]</span>
              </div>
              <p className="text-xs text-zinc-500 font-bold mb-4 uppercase tracking-wider">[이번달 점수 랭킹]</p>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b border-zinc-800/50 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-amber-500">1</span>
                    <div className="w-6 h-6 rounded-full bg-zinc-800"></div>
                    <span className="text-white font-bold">1위 멜오크</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-[#141416] h-1.5 rounded-full"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '90.33%' }}></div></div>
                    <span className="font-mono text-zinc-400 font-bold text-[11px]">90.33% | ★ 3속</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-zinc-800/50 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-400">2</span>
                    <div className="w-6 h-6 rounded-full bg-zinc-800"></div>
                    <span className="text-zinc-300 font-semibold">2위 전라움</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-[#141416] h-1.5 rounded-full"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '100%' }}></div></div>
                    <span className="font-mono text-zinc-400 font-bold text-[11px]">100% | ★ 2속</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-500">3</span>
                    <div className="w-6 h-6 rounded-full bg-zinc-800"></div>
                    <span className="text-zinc-400 font-medium">3위 잗앙진</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-[#141416] h-1.5 rounded-full"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '72.87%' }}></div></div>
                    <span className="font-mono text-zinc-500 text-[11px]">72.87% | ★ 1속</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </main>
  );
}