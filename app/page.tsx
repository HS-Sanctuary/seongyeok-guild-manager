"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// 1. 전체 21개 직업 리스트 및 아이콘 매핑
const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사", "마법사", "화염술사", "빙결술사", "전격술사", 
  "궁수", "장궁병", "석궁사수", "음유시인", "댄서", "악사", "힐러", "사제", "수도사", 
  "암흑술사", "도적", "격투가", "듀얼블레이드"
];

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

interface Character {
  id: number;
  name: string;
  job: string;
  daily: boolean;
  weekly: boolean;
  donate: boolean;
}

// =====================================================================
// 🎯 [신규 모듈] 캐릭터 상세 정보 & 일일/주간 체크보드 & 올라운더 계산기 모달
// =====================================================================
function CharacterModal({ char, onClose, userRole }: { char: Character; onClose: () => void; userRole: string }) {
  // 21개 클래스의 레벨 상태 관리
  const [levels, setLevels] = useState<{ [key: string]: number }>(
    ALL_CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: 1 }), {})
  );

  // 아코디언 패널 접기/펴기 상태 (기본값: 접힘)
  const [isAllRounderOpen, setIsAllRounderOpen] = useState(false);

  // 총합 레벨 실시간 계산
  const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);

  // 특정 클래스 MAX(65) 세팅 함수
  const setMaxLevel = (cls: string) => {
    setLevels(prev => ({ ...prev, [cls]: 65 }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1c1c1e] border border-yellow-600/50 rounded-xl w-full max-w-6xl my-8 flex flex-col shadow-2xl relative max-h-[90vh]">
        
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-5 text-zinc-400 hover:text-white font-black text-xl z-20">✕</button>

        <div className="overflow-y-auto custom-scrollbar">
          
          {/* 🟦 상단: 캐릭터 스펙 및 프로필 수정 폼 */}
          <div className="bg-[#252528] p-6 border-b border-zinc-800 rounded-t-xl">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              
              <div className="w-28 h-28 bg-[#121212] rounded-lg border border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 flex-shrink-0 group relative overflow-hidden shadow-inner">
                <span className="text-4xl group-hover:hidden">👤</span>
                <div className="hidden group-hover:flex bg-black/70 w-full h-full absolute flex-col items-center justify-center">
                  <span className="text-[10px] text-white font-bold">이미지 변경</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">닉네임</label>
                  <input defaultValue={char.name} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">주 클래스</label>
                  <select defaultValue={char.job} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none custom-select">
                    {ALL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">전투력</label>
                  <input type="number" placeholder="예: 35000" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">생활력</label>
                  <input type="number" placeholder="입력" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">매력</label>
                  <input type="number" placeholder="입력" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">자기소개 / 인삿말</label>
                  <input placeholder="길드원들에게 한마디!" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none" />
                </div>
              </div>
              
              <div className="flex flex-col justify-end h-full mt-4 md:mt-0 w-full md:w-auto">
                 <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg text-sm w-full shadow-lg whitespace-nowrap">프로필 저장</button>
              </div>
            </div>
          </div>

          {/* 🟦 중단: 일일/주간 컨텐츠 체크 스플릿 영역 (위로 배치) */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#1c1c1e]">
            
            {/* 좌측: 일일 컨텐츠 */}
            <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
                <h3 className="font-bold text-amber-500 text-lg flex items-center gap-2">☀️ 일일 컨텐츠</h3>
                {userRole === "마스터" && <button className="text-[10px] bg-zinc-800 px-2.5 py-1 rounded text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-700 transition">⚙️ 관리자 편집</button>}
              </div>
              <div className="space-y-1.5 flex-1 pr-2">
                {["일일 미션", "일일 검은 구멍", "요일 던전", "일일 아르바이트", "심층 던전"].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-amber-600/50 transition">
                    <input type="checkbox" className="w-5 h-5 accent-amber-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 우측: 주간 컨텐츠 */}
            <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
                <h3 className="font-bold text-blue-400 text-lg flex items-center gap-2">🌙 주간 컨텐츠</h3>
                {userRole === "마스터" && <button className="text-[10px] bg-zinc-800 px-2.5 py-1 rounded text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-700 transition">⚙️ 관리자 편집</button>}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">검은 구멍 (주 7회)</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7].map(i => <input key={`bh-${i}`} type="checkbox" className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">불길한 소환의 결계 (주 7회)</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7].map(i => <input key={`om-${i}`} type="checkbox" className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">뱅가드 브리치 (주 3회)</span>
                  <div className="flex gap-1.5 pr-20">
                    {[1,2,3].map(i => <input key={`vg-${i}`} type="checkbox" className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />)}
                  </div>
                </div>

                {["심층 던전 (매우 어려움)", "주말에는 어비스", "주말에는 레이드", "멤버십 주간 아르바이트", "필드 보스", "어비스 3종 (허상/광기/물길)", "레이드 - 에이렐", "레이드 - 화이트 서큐버스", "레이드 - 타바르타스", "레이드 - 카브락"].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-blue-500/50 transition">
                    <input type="checkbox" className="w-5 h-5 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 🟦 하단: 올라운더 클래스 레벨 관리 그리드 (아코디언 토글 적용) */}
          <div className="bg-[#252528] p-6 border-t border-zinc-800 rounded-b-xl">
            
            {/* 토글 헤더 영역 */}
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-zinc-800/40 p-3 -mx-3 rounded-xl transition-colors duration-200"
              onClick={() => setIsAllRounderOpen(!isAllRounderOpen)}
            >
              <div>
                <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">
                  ⚡ 올라운더 클래스 레벨 관리 
                  <span className="text-sm text-zinc-500">{isAllRounderOpen ? "▲" : "▼"}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">캐릭터의 모든 클래스 레벨을 관리하세요. MAX(65) 달성 시 마스터 칭호가 부여됩니다.</p>
              </div>
              <div className="bg-[#121212] border border-zinc-700 px-4 py-2 rounded-lg flex flex-col items-end shadow-inner">
                <span className="text-[10px] text-zinc-500 font-bold">합산된 총 레벨</span>
                <span className="text-xl font-black text-white">{totalLevel} <span className="text-xs text-zinc-500 font-normal">LV</span></span>
              </div>
            </div>

            {/* 토글 바디 영역 (열렸을 때만 렌더링) */}
            {isAllRounderOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-6 pt-6 border-t border-zinc-700/50">
                {ALL_CLASSES.map(cls => {
                  const isMax = levels[cls] === 65;
                  return (
                    <div key={cls} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${isMax ? 'border-purple-500/50 bg-purple-900/10' : 'border-zinc-700/50 bg-[#121212] hover:border-yellow-500/50'}`}>
                      
                      {!isMax ? (
                        <button onClick={() => setMaxLevel(cls)} className="absolute top-2 right-2 text-[9px] font-bold bg-zinc-800 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-600 transition">MAX</button>
                      ) : (
                        <span className="absolute top-2 right-2 text-[10px] font-black text-purple-400 tracking-tighter">마스터</span>
                      )}

                      <div className={`w-12 h-12 rounded-full border-[2.5px] flex items-center justify-center mb-2 transition-colors ${isMax ? 'border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-zinc-700 text-zinc-500'}`}>
                        <span className="text-xl drop-shadow-md">{JOB_ICONS[cls] || "🛡️"}</span>
                      </div>

                      <span className={`text-xs font-bold mb-1 ${isMax ? 'text-purple-300' : 'text-zinc-300'}`}>{cls}</span>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 font-bold">Lv.</span>
                        <input 
                          type="number" min={1} max={65} 
                          value={levels[cls]} 
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 65) val = 65;
                            setLevels(prev => ({...prev, [cls]: val}));
                          }} 
                          className="w-8 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-transparent focus:border-yellow-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 🏰 메인 대시보드 (Home)
// =====================================================================
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [characterGrid, setCharacterGrid] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const fetchCharacters = async () => {
    try {
      const { data } = await supabase.from("characters").select("*").order("id", { ascending: true });
      if (data && data.length > 0) {
        setCharacterGrid(data);
      } else {
        setCharacterGrid([
          { id: 1, name: "한설", job: "전사", daily: false, weekly: false, donate: false },
          { id: 2, name: "제스", job: "마법사", daily: false, weekly: false, donate: false },
          { id: 3, name: "신파랑", job: "궁수", daily: false, weekly: false, donate: false },
          { id: 4, name: "화연", job: "힐러", daily: false, weekly: false, donate: false },
          { id: 5, name: "오십쇼", job: "도적", daily: false, weekly: false, donate: false },
          { id: 6, name: "별콩", job: "기사", daily: false, weekly: false, donate: false },
        ]);
      }
    } catch (e) {
      console.error("DB 오류");
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) router.push("/login");
    else { setUser(JSON.parse(savedUser)); fetchCharacters(); }
  }, [router]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-10">
      <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide"><span>🏰 Sanctuary Nexus</span></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-lg overflow-hidden border border-zinc-500">👦🏻</div>
          <div className="flex flex-col leading-tight"><span className="font-bold text-white text-sm">{user.nickname || "한설"}</span><span className="text-[10px] text-zinc-400">{user.role || "마스터"}</span></div>
          <button onClick={() => { localStorage.removeItem("nexus_user"); router.push("/login"); }} className="ml-2 border border-red-900/50 text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/20 transition">로그아웃</button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <header className="flex items-center gap-6 mb-8">
          <div className="w-36 h-36 bg-[#121212] border border-yellow-600/30 rounded-lg flex items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent"></div>
            <div className="z-10 text-white font-black border-2 border-white px-2 py-1 tracking-widest text-xs">Nexus</div>
          </div>
          <div>
            <h1 className="text-5xl font-serif font-black tracking-tight text-[#e6c788] drop-shadow-md">Sanctuary Nexus</h1>
            <p className="text-zinc-400 text-sm mt-2 tracking-wide">마비노기 모바일 <span className="text-zinc-600 mx-1">|</span> 데이안 서버 길드 매니저</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center mb-4"><h2 className="text-white font-bold text-sm">🔥 체크 보드 (최대 6캐릭)</h2><span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">MAIN_BOARD</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {characterGrid.slice(0, 6).map((char) => (
                  <div key={char.id} onClick={() => setSelectedChar(char)} className="bg-[#1c1c1e] border border-zinc-700/50 rounded-lg p-3 cursor-pointer hover:border-yellow-600/60 hover:bg-[#202023] transition shadow-md">
                    <div className="flex justify-between items-center border-b border-zinc-700/50 pb-2 mb-2.5">
                      <span className="font-bold text-white text-sm truncate">{char.name}</span><span className="text-xs text-zinc-400">{JOB_ICONS[char.job] || "🛡️"}</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      {[{name:"일일 컨텐츠", val:80, color:"bg-amber-500"}, {name:"주간 컨텐츠", val:45, color:"bg-blue-500"}, {name:"물물 교환", val:30, color:"bg-emerald-500"}, {name:"일일/주간 구매", val:60, color:"bg-purple-500"}].map(item => (
                        <div key={item.name}>
                          <div className="flex justify-between text-zinc-400 mb-0.5"><span>{item.name}</span><span className="text-zinc-300 font-mono">{item.val}%</span></div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className={`${item.color} h-full`} style={{ width: `${item.val}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#252528] border border-yellow-600/20 rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center mb-2"><h2 className="text-[#e6c788] font-bold text-sm flex items-center gap-1.5">⚡ 올라운더 통합 진행률</h2><span className="text-[10px] text-zinc-500 font-mono">ALL-ROUNDER</span></div>
              <div className="w-full bg-[#1c1c1e] h-3 rounded-full overflow-hidden border border-zinc-700/50"><div className="bg-gradient-to-r from-yellow-600 to-amber-500 h-full" style={{ width: "70.5%" }}></div></div>
              <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-2"><span>길드원 중복제외 합산 목표</span><span className="text-white font-mono font-bold">850 / 1205 LV</span></div>
            </section>

            <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
              <h2 className="text-[#e6c788] font-bold text-sm mb-1">👑 길드원 종합 진행률</h2><p className="text-xs text-zinc-400 mb-4">[이번달 점수 랭킹]</p>
              <div className="space-y-3">
                {[1, 2, 3].map((rank) => (
                  <div key={rank} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#1c1c1e] border border-zinc-700 rounded flex items-center justify-center text-xs font-bold text-[#e6c788]">{rank}</div><div className="w-8 h-8 rounded-full bg-zinc-600"></div>
                    <div className="flex-1"><div className="flex justify-between text-xs text-white mb-1"><span>{rank}위 유저</span></div><div className="w-full bg-[#1c1c1e] h-1.5 rounded-full overflow-hidden"><div className="bg-[#e6c788] h-full" style={{ width: `${100 - (rank * 15)}%` }}></div></div></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
             <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center mb-4"><h2 className="text-white font-bold text-sm">⚔️ 현재 매칭중인 파티</h2></div>
              <div className="flex items-center gap-2 mb-4 text-[11px] text-zinc-300"><span>초대받을 닉네임: <strong>앤히크</strong></span></div>
              <div className="bg-[#1c1c1e] border border-zinc-700 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-white">[4종] 어비스 매어 4종 고고링 (파티장)</h3></div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1">⚔️ 앤히크 전사</div><div className="flex items-center gap-1">💖 게임은어려움 힐러</div><div className="flex items-center gap-1">💖 타바르타스 힐러</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {selectedChar && <CharacterModal char={selectedChar} onClose={() => setSelectedChar(null)} userRole={user.role} />}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-select {
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat, repeat;
          background-position: right .7em top 50%, 0 0;
          background-size: .65em auto, 100%;
        }
      `}} />
    </main>
  );
}