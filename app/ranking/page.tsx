"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️", 마법사: "🪄", 화염술사: "🔥", 
  빙결술사: "❄️", 전격술사: "⚡", 궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸", 힐러: "💖", 사제: "🕊️", 수도사: "🙏", 
  암흑술사: "🌑", 도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

const RANKING_TABS = [
  { id: "combat", label: "⚔️ 전투력", color: "text-red-400" },
  { id: "magic", label: "🔮 마도저항", color: "text-purple-400" },
  { id: "life", label: "🌿 생활력", color: "text-emerald-400" },
  { id: "charm", label: "✨ 매력", color: "text-pink-400" },
  { id: "level", label: "🌟 누적 레벨", color: "text-yellow-400" },
  { id: "contribution", label: "🏅 길드 공헌도", color: "text-green-400" }
];

export default function RankingPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("combat");

  useEffect(() => {
    const fetchRankingData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('characters').select('*');
      
      if (!error && data) {
        const processedData = data.map(char => {
          let totalLevel = 0;
          if (char.levels) {
            totalLevel = Object.values(char.levels).reduce((sum: any, lvl: any) => sum + Number(lvl), 0) as number;
          }
          const parseNum = (val: any) => Number(String(val || "0").replace(/,/g, '')) || 0;
          return { 
            ...char, 
            totalLevel, 
            combat: parseNum(char.combat_power),
            magic: parseNum(char.magic_resistance),
            life: parseNum(char.life_energy),
            charm: parseNum(char.charm),
            contribution: parseNum(char.contribution) || Math.floor(Math.random() * 50000) + 10000 
          };
        });
        setCharacters(processedData);
      }
      setIsLoading(false);
    };
    fetchRankingData();
  }, []);

  const sortedCharacters = [...characters].sort((a, b) => b[activeTab] - a[activeTab]);
  const top3 = sortedCharacters.slice(0, 3);
  const formatNumber = (num: any) => (num ?? 0).toLocaleString();
  const getUnit = (tabId: string) => tabId === "level" ? "LV" : tabId === "contribution" ? "Pt" : "CP";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-zinc-500 font-bold bg-[#1c1c1e]">데이터 로딩 중...</div>;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6">
      <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-10">
        
        {/* 헤더 */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black text-white">🏆 성역 명예의 전당</h1>
        </div>

        {/* 탭 */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 bg-[#252528] p-2 rounded-2xl border border-zinc-800 shadow-xl">
            {RANKING_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? `bg-[#1c1c1e] ${tab.color} border border-zinc-700 shadow-md` : "text-zinc-500 hover:text-zinc-300"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TOP 3 시상대 */}
        <div className="pt-12 pb-6 flex justify-center items-end gap-3 sm:gap-6 min-h-[300px]">
          {[top3[1], top3[0], top3[2]].map((char, idx) => {
            if (!char) return <div key={idx} className="w-28 h-32"></div>;
            const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
            return (
              <div key={char.id} className={`flex flex-col items-center ${rank === 1 ? "w-32 z-10" : "w-28"}`}>
                <div className={`w-16 h-16 rounded-full bg-[#121212] border-2 flex items-center justify-center text-2xl mb-3 ${rank === 1 ? "border-yellow-500" : "border-zinc-600"}`}>
                  {JOB_ICONS[char.job] || "👤"}
                </div>
                <span className={`font-bold text-sm ${rank === 1 ? "text-[#e6c788]" : "text-zinc-400"}`}>{char.nickname}</span>
                <div className={`w-full ${rank === 1 ? "h-32 bg-yellow-900/30" : "h-24 bg-zinc-800"} rounded-t-lg flex items-center justify-center text-2xl`}>
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🟢 전체 순위 리스트 */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden mt-8">
          <div className="bg-[#1a1a1c] px-6 py-3 border-b border-zinc-800 grid grid-cols-12 gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">순위</div>
            <div className="col-span-7">길드원</div>
            <div className="col-span-4 text-right">수치</div>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {sortedCharacters.map((char, index) => (
              <div key={char.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-[#2a2a2e] transition">
                <div className="col-span-1 text-center font-black text-zinc-500">{index + 1}</div>
                <div className="col-span-7 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-sm">{JOB_ICONS[char.job] || "👤"}</div>
                  <span className="font-bold text-zinc-200">{char.nickname}</span>
                </div>
                <div className="col-span-4 text-right font-mono font-bold text-yellow-500">
                  {formatNumber(char[activeTab])} <span className="text-[10px] text-zinc-500">{getUnit(activeTab)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}