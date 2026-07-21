"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️", 마법사: "🪄", 화염술사: "🔥", 
  빙결술사: "❄️", 전격술사: "⚡", 궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸", 힐러: "💖", 사제: "🕊️", 수도사: "🙏", 
  암흑술사: "🌑", 도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

// 1-Depth: 랭킹 범위 (Scope)
const RANKING_SCOPES = [
  { id: "all", label: "🌐 전 서버 종합" },
  { id: "dayan", label: "⚔️ 데이안 서버" },
  { id: "guild", label: "🛡️ 성역 길드" }
];

// 2-Depth: 랭킹 카테고리 (Category) - 마스터님 요청 반영
const RANKING_CATEGORIES = [
  { id: "total", label: "👑 종합 점수", color: "text-amber-400", bgHover: "hover:border-amber-500/50" },
  { id: "combat", label: "⚔️ 전투력", color: "text-red-400", bgHover: "hover:border-red-500/50" },
  { id: "life", label: "🌿 생활력", color: "text-emerald-400", bgHover: "hover:border-emerald-500/50" },
  { id: "charm", label: "✨ 매력", color: "text-pink-400", bgHover: "hover:border-pink-500/50" },
  { id: "abyss", label: "🌀 어비스 (클리어타임)", color: "text-indigo-400", bgHover: "hover:border-indigo-500/50" }
];

export default function RankingPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScope, setActiveScope] = useState("guild");
  const [activeCategory, setActiveCategory] = useState("combat");

  useEffect(() => {
    fetchRankingData();
  }, [activeScope]); // 범위(Scope)가 바뀔 때마다 데이터를 새로 불러옵니다.

  const fetchRankingData = async () => {
    setIsLoading(true);
    
    // 🟢 1. 성역 길드 랭킹 (Supabase 실제 DB 활용)
    if (activeScope === "guild") {
      const { data, error } = await supabase.from('characters').select('*');
      if (!error && data) {
        const processedData = data.map(char => {
          const parseNum = (val: any) => Number(String(val || "0").replace(/,/g, '')) || 0;
          const combat = parseNum(char.combat_power);
          const life = parseNum(char.life_energy);
          const charm = parseNum(char.charm);
          // 임시 종합 점수 공식
          const total = combat + (life * 10) + (charm * 10); 
          
          return { 
            ...char, 
            total, combat, life, charm,
            abyss: Math.floor(Math.random() * 300) + 120, // 임시 어비스 클리어타임 (초)
            isMyGuild: true,
            guildName: "성역"
          };
        });
        setCharacters(processedData);
      }
    } 
    // 🟢 2. 전 서버 / 데이안 서버 랭킹 (API 가상 연동 - Mock Data)
    else {
      // 진짜 넥슨 API가 연결되기 전까지 보여줄 가짜(Mock) 랭커들 생성
      setTimeout(() => {
        const mockData = Array.from({ length: 50 }).map((_, i) => {
          const isOurGuild = Math.random() > 0.85; // 15% 확률로 성역 길드원이 상위권에 포진!
          const jobs = Object.keys(JOB_ICONS);
          return {
            id: `mock-${i}`,
            nickname: isOurGuild ? ["한설", "영겁", "순월", "먀치"][Math.floor(Math.random()*4)] : `랭커유저${i+1}`,
            job: jobs[Math.floor(Math.random() * jobs.length)],
            guildName: isOurGuild ? "성역" : ["신화", "전설", "불패", "아레스", ""][Math.floor(Math.random()*5)],
            isMyGuild: isOurGuild,
            total: Math.floor(Math.random() * 500000) + 500000,
            combat: Math.floor(Math.random() * 80000) + 40000,
            life: Math.floor(Math.random() * 5000) + 1000,
            charm: Math.floor(Math.random() * 5000) + 1000,
            abyss: Math.floor(Math.random() * 200) + 90 // 1분 30초 ~ 4분대
          };
        });
        setCharacters(mockData);
        setIsLoading(false);
      }, 800); // API 통신 딜레이 0.8초 흉내
      return; 
    }
    
    setIsLoading(false);
  };

  // 랭킹 정렬 로직 (어비스는 시간이 짧을수록 1등, 나머지는 높을수록 1등)
  const sortedCharacters = [...characters].sort((a, b) => {
    if (activeCategory === "abyss") return a[activeCategory] - b[activeCategory];
    return b[activeCategory] - a[activeCategory];
  });

  const top3 = sortedCharacters.slice(0, 3);
  
  const formatValue = (num: any, category: string) => {
    if (category === "abyss") {
      const mins = Math.floor(num / 60);
      const secs = num % 60;
      return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
    }
    return (num ?? 0).toLocaleString();
  };

  const getUnit = (category: string) => {
    if (category === "total") return "Pt";
    if (category === "combat") return "CP";
    if (category === "abyss") return "Clear";
    return "";
  };

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6 select-none">
      <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* 헤더 & 1-Depth 스코프 선택 */}
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">🏆 넥서스 명예의 전당</h1>
            <p className="text-sm text-zinc-400">넥슨 API와 연동된 실시간 랭킹보드입니다.</p>
          </div>

          <div className="flex bg-[#121212] p-1.5 rounded-2xl border border-zinc-800 shadow-xl">
            {RANKING_SCOPES.map(scope => (
              <button 
                key={scope.id} 
                onClick={() => setActiveScope(scope.id)}
                className={`px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeScope === scope.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Depth 카테고리 탭 */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 bg-[#252528] p-2 rounded-2xl border border-zinc-800 shadow-lg">
            {RANKING_CATEGORIES.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveCategory(tab.id)} 
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${activeCategory === tab.id ? `bg-[#1c1c1e] ${tab.color} border-zinc-600 shadow-inner` : `border-transparent text-zinc-500 hover:text-zinc-300 bg-transparent ${tab.bgHover}`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 로딩 표시 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-4xl animate-spin">⏳</span>
            <span className="text-zinc-500 font-bold">API 서버에서 랭킹 데이터를 집계 중입니다...</span>
          </div>
        ) : (
          <>
            {/* 🏅 TOP 3 시상대 */}
            <div className="pt-10 pb-6 flex justify-center items-end gap-3 sm:gap-6 min-h-[280px]">
              {[top3[1], top3[0], top3[2]].map((char, idx) => {
                if (!char) return <div key={idx} className="w-28 h-32"></div>;
                const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                return (
                  <div key={char.id} className={`flex flex-col items-center relative group ${rank === 1 ? "w-32 z-10" : "w-28"}`}>
                    
                    {/* 성역 길드원 뱃지 */}
                    {char.isMyGuild && activeScope !== "guild" && (
                      <div className="absolute -top-8 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                        성역 소속!
                      </div>
                    )}

                    <div className={`w-16 h-16 rounded-2xl bg-[#121212] border-2 flex items-center justify-center text-2xl mb-3 shadow-xl transition-transform group-hover:-translate-y-2 ${rank === 1 ? "border-[#e6c788] shadow-[0_0_15px_rgba(230,199,136,0.3)]" : rank === 2 ? "border-zinc-400" : "border-amber-700"}`}>
                      {JOB_ICONS[char.job] || "👤"}
                    </div>
                    <span className={`font-black text-sm mb-1 ${rank === 1 ? "text-[#e6c788]" : "text-zinc-300"}`}>{char.nickname}</span>
                    <span className="text-[10px] font-bold text-zinc-500 mb-2">{formatValue(char[activeCategory], activeCategory)} {getUnit(activeCategory)}</span>
                    
                    <div className={`w-full ${rank === 1 ? "h-36 bg-gradient-to-t from-[#e6c788]/20 to-transparent border-t-2 border-[#e6c788]" : rank === 2 ? "h-28 bg-gradient-to-t from-zinc-400/10 to-transparent border-t-2 border-zinc-500" : "h-24 bg-gradient-to-t from-amber-700/10 to-transparent border-t-2 border-amber-700/50"} rounded-t-xl flex items-start pt-4 justify-center text-3xl`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 📊 전체 순위 리스트 */}
            <div className="bg-[#252528] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden mt-4">
              <div className="bg-[#1a1a1c] px-6 py-4 border-b border-zinc-800 grid grid-cols-12 gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">순위</div>
                <div className="col-span-7 pl-2">캐릭터 정보</div>
                <div className="col-span-4 text-right pr-2">기록</div>
              </div>
              
              <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {sortedCharacters.map((char, index) => (
                  <div key={char.id} className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition ${char.isMyGuild ? 'bg-indigo-900/10 hover:bg-indigo-900/20' : 'hover:bg-[#2a2a2e]'}`}>
                    
                    {/* 순위 */}
                    <div className="col-span-1 text-center">
                      <span className={`text-sm font-black ${index === 0 ? 'text-[#e6c788]' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* 캐릭터 정보 */}
                    <div className="col-span-7 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#121212] border border-zinc-700 flex items-center justify-center text-lg shadow-inner">
                        {JOB_ICONS[char.job] || "👤"}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${char.isMyGuild ? 'text-indigo-300' : 'text-zinc-200'}`}>{char.nickname}</span>
                          {/* 성역 길드원 표시 뱃지 */}
                          {char.isMyGuild && activeScope !== "guild" && (
                            <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow">성역</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">{char.job}</span>
                          {char.guildName && !char.isMyGuild && <span className="text-[10px] text-zinc-600 font-medium">길드: {char.guildName}</span>}
                        </div>
                      </div>
                    </div>

                    {/* 수치 (기록) */}
                    <div className="col-span-4 text-right flex flex-col items-end justify-center">
                      <span className="font-mono font-bold text-lg text-white">
                        {formatValue(char[activeCategory], activeCategory)}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">{getUnit(activeCategory)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1c; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}