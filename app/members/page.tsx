"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const JOB_ICONS: Record<string, string> = { 
  전사: "⚔️", 마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 힐러: "💖", 
  사제: "🕊️", 궁수: "🏹", 기사: "🛡️", 대검전사: "🗡️", 도적: "🥷", 
  격투가: "🥊", 음유시인: "🎸", 댄서: "💃", 암흑술사: "🌑", 석궁사수: "🏹"
};

// 테스트용 길드원 목업 데이터 (인게임/넥서스 접속 분리)
const MOCK_MEMBERS = [
  { account_id: 1, role: "마스터", main_char: "한설", job: "기사", cp: 125000, is_ingame: true, is_nexus: true, last_login: 0, contribution: 99999, alt_count: 5, uncompleted: [] },
  { account_id: 2, role: "부마스터", main_char: "파랑", job: "전사", cp: 118000, is_ingame: true, is_nexus: false, last_login: 0, contribution: 85000, alt_count: 3, uncompleted: ["어비스 3종", "레이드-카브락"] },
  { account_id: 3, role: "부마스터", main_char: "춘법", job: "마법사", cp: 115000, is_ingame: false, is_nexus: true, last_login: 2, contribution: 82000, alt_count: 2, uncompleted: ["레이드-에이렐"] },
  { account_id: 4, role: "부마스터", main_char: "꽃닝", job: "힐러", cp: 110000, is_ingame: true, is_nexus: true, last_login: 0, contribution: 79000, alt_count: 4, uncompleted: ["어비스 3종", "레이드-화이트서큐버스"] },
  { account_id: 5, role: "길드원", main_char: "하채", job: "궁수", cp: 95000, is_ingame: false, is_nexus: false, last_login: 1, contribution: 45000, alt_count: 1, uncompleted: [] },
  { account_id: 6, role: "길드원", main_char: "십쇼", job: "도적", cp: 92000, is_ingame: false, is_nexus: false, last_login: 1, contribution: 42000, alt_count: 0, uncompleted: ["어비스 3종"] },
  { account_id: 7, role: "길드원", main_char: "별콩", job: "음유시인", cp: 88000, is_ingame: false, is_nexus: false, last_login: 8, contribution: 15000, alt_count: 2, uncompleted: ["어비스 3종", "레이드-카브락"] },
];

export default function MembersPage() {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [filter, setFilter] = useState("전체"); // 탭 필터
  const [taskRadar, setTaskRadar] = useState("전체"); // 특정 숙제 미완료 필터

  useEffect(() => {
    // 임시: 현재 로그인한 유저 정보를 로컬스토리지에서 가져옴
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // 간부진(마스터/부마스터) 여부 체크
  const isAdmin = user?.nickname === "한설" || user?.role === "마스터" || user?.role === "부마스터";

  // 정렬 순서
  const roleOrder: Record<string, number> = { "마스터": 1, "부마스터": 2, "길드원": 3 };
  
  const filteredAndSortedMembers = [...members]
    .filter(m => {
      // 1. 탭 필터 적용
      if (filter === "접속중") return m.is_ingame || m.is_nexus;
      if (filter === "장기미접속" && isAdmin) return m.last_login >= 7;
      
      // 2. 숙제 레이더 필터 적용
      if (taskRadar !== "전체") {
        return m.uncompleted.includes(taskRadar);
      }
      return true;
    })
    .sort((a, b) => {
      if (roleOrder[a.role] !== roleOrder[b.role]) return roleOrder[a.role] - roleOrder[b.role];
      return b.contribution - a.contribution;
    });

  const inactiveCount = members.filter(m => m.last_login >= 7).length;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6 select-none">
      <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🟦 헤더 및 간부 전용 알림 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-700/50 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              🛡️ 성역 길드원 목록
            </h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">길드원들의 접속 상태와 숙제 현황을 확인하고 파티를 꾸려보세요.</p>
          </div>
          {isAdmin && inactiveCount > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-bold animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <span>🚨</span> 7일 이상 장기 미접속자가 {inactiveCount}명 있습니다!
            </div>
          )}
        </div>

        {/* 🟦 스마트 파티 구인 필터 (숙제 레이더) */}
        <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            {["전체", "접속중"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-5 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-[#e6c788] text-[#121212]' : 'bg-[#1c1c1e] text-zinc-400 hover:text-white border border-zinc-700'}`}
              >
                {f}
              </button>
            ))}
            {/* 간부 전용 탭 */}
            {isAdmin && (
              <button 
                onClick={() => setFilter("장기미접속")} 
                className={`px-5 py-2 rounded-lg text-sm font-bold transition ${filter === "장기미접속" ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-red-900/10 text-red-500/70 hover:text-red-400 border border-red-900/30'}`}
              >
                장기 미접속
              </button>
            )}
          </div>

          {/* 숙제 레이더 드롭다운 */}
          <div className="flex items-center gap-3 w-full md:w-auto bg-[#1c1c1e] px-4 py-2 rounded-lg border border-indigo-500/30">
            <span className="text-sm font-black text-indigo-400 whitespace-nowrap">🔍 숙제 레이더</span>
            <select 
              value={taskRadar} 
              onChange={(e) => { setTaskRadar(e.target.value); setFilter("전체"); }}
              className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer w-full md:w-48"
            >
              <option value="전체" className="bg-[#1c1c1e]">안 한 사람 찾기 (선택 안함)</option>
              <option value="어비스 3종" className="bg-[#1c1c1e]">어비스 3종</option>
              <option value="레이드-카브락" className="bg-[#1c1c1e]">레이드 - 카브락</option>
              <option value="레이드-에이렐" className="bg-[#1c1c1e]">레이드 - 에이렐</option>
              <option value="레이드-화이트서큐버스" className="bg-[#1c1c1e]">레이드 - 화이트서큐버스</option>
            </select>
          </div>
        </div>

        {/* 🟦 길드원 리스트 */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
          <div className="bg-[#1a1a1c] px-6 py-4 border-b border-zinc-800 grid grid-cols-12 gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider items-center">
            <div className="col-span-3 text-center">직위 / 접속 상태</div>
            <div className="col-span-4 text-left pl-2">대표 캐릭터 (계정)</div>
            <div className="col-span-3 text-right">전투력 / 공헌도</div>
            <div className="col-span-2 text-center">미완료 숙제</div>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {filteredAndSortedMembers.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 font-bold">조건에 맞는 길드원이 없습니다.</div>
            ) : (
              filteredAndSortedMembers.map((member) => {
                const isExpanded = expandedId === member.account_id;
                
                return (
                  <div key={member.account_id} className="flex flex-col">
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : member.account_id)}
                      className={`px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer transition ${isExpanded ? 'bg-[#2a2a2e]' : 'hover:bg-[#2a2a2e]'}`}
                    >
                      {/* 1. 접속 상태 및 직위 */}
                      <div className="col-span-3 flex flex-col items-center justify-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          member.role === '마스터' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50' : 
                          member.role === '부마스터' ? 'bg-purple-900/30 text-purple-400 border-purple-700/50' : 
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {member.role === '마스터' ? '👑 마스터' : member.role === '부마스터' ? '🛡️ 부마스터' : '길드원'}
                        </span>
                        
                        {/* 접속 배지 (인게임/넥서스 분리) */}
                        <div className="flex gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold ${member.is_ingame ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-zinc-800/50 text-zinc-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${member.is_ingame ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`}></div>
                            인게임
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold ${member.is_nexus ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' : 'bg-zinc-800/50 text-zinc-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${member.is_nexus ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'bg-zinc-600'}`}></div>
                            넥서스
                          </span>
                        </div>
                        {(!member.is_ingame && !member.is_nexus) && (
                          <span className="text-[10px] text-zinc-500 font-medium">{member.last_login}일 전</span>
                        )}
                      </div>

                      {/* 2. 대표 캐릭터 정보 */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#121212] border border-zinc-700 flex items-center justify-center text-lg">
                          {JOB_ICONS[member.job] || "👤"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-[15px] text-zinc-200">{member.main_char}</span>
                          <span className="text-[10px] text-zinc-500 font-medium hover:text-[#e6c788] transition">부캐 {member.alt_count}개 보유 ▾</span>
                        </div>
                      </div>

                      {/* 3. 전투력 & 공헌도 */}
                      <div className="col-span-3 flex flex-col items-end justify-center">
                        <span className="font-mono font-bold text-[15px] text-[#e6c788]">{member.cp.toLocaleString()} <span className="text-[9px] text-zinc-500">CP</span></span>
                        <span className="font-mono text-[11px] text-emerald-400/80">{member.contribution.toLocaleString()} <span className="text-[9px] text-emerald-700/50">Pt</span></span>
                      </div>

                      {/* 4. 미완료 숙제 경고 */}
                      <div className="col-span-2 flex justify-center">
                        {member.uncompleted.length === 0 ? (
                          <span className="text-xs font-black text-emerald-500/50">완료</span>
                        ) : (
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-[10px] font-black bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                              미완료 {member.uncompleted.length}개
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 부캐릭터 아코디언 */}
                    {isExpanded && (
                      <div className="bg-[#1a1a1c] border-t border-zinc-800/50 p-4 px-6 md:px-20 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-[#121212] rounded-xl border border-zinc-800 p-4 flex flex-col gap-2">
                          {member.uncompleted.length > 0 && (
                            <div className="mb-2 p-2 bg-indigo-900/10 border border-indigo-900/50 rounded-lg text-xs text-indigo-300">
                              <span className="font-bold text-indigo-400">🚨 현재 미완료된 숙제:</span> {member.uncompleted.join(", ")}
                            </div>
                          )}
                          <div className="text-center text-zinc-500 text-xs font-bold py-4 border border-dashed border-zinc-700 rounded-lg">
                            '{member.main_char}' 계정의 전체 캐릭터 데이터 연동 영역
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </main>
  );
}