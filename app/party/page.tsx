"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// =====================================================================
// 🎯 커스텀 타임 피커 컴포넌트
// =====================================================================
function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':');
  
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      <div onClick={() => setIsOpen(!isOpen)} className={`relative z-50 bg-[#121212] border ${isOpen ? 'border-[#e6c788]' : 'border-zinc-700'} hover:border-zinc-500 rounded p-2.5 text-sm font-bold text-white cursor-pointer text-center transition flex justify-center items-center gap-1`}>
        <span>{h}:{m}</span>
        <span className={`text-[10px] text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-[#e6c788]' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[160px] bg-[#1c1c1e] border border-zinc-600 rounded-lg shadow-2xl z-50 p-2 flex gap-2">
          <div className="flex-1 h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button key={hour} onClick={() => onChange(`${hour}:${m}`)} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${h === hour ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{hour}시</button>
            ))}
          </div>
          <div className="w-px bg-zinc-700"></div>
          <div className="flex-1 h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button key={minute} onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${m === minute ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{minute}분</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 🎯 기초 데이터베이스 세팅 (난이도 & 던전 완벽 분리)
// =====================================================================
const ROLE_GROUPS: Record<string, string[]> = {
  "탱커": ["빙결술사", "전사", "기사"],
  "힐러": ["힐러", "사제", "수도사", "음유시인"],
  "근딜": ["검술사", "대검전사", "댄서", "도적", "격투가", "듀얼블레이드"],
  "원딜": ["마법사", "화염술사", "전격술사", "궁수", "장궁병", "석궁사수", "악사", "암흑술사"]
};

const ROLE_COLORS: Record<string, string> = {
  "탱커": "text-blue-400 bg-blue-900/20 border-blue-800/50",
  "힐러": "text-emerald-400 bg-emerald-900/20 border-emerald-800/50",
  "근딜": "text-red-400 bg-red-900/20 border-red-800/50",
  "원딜": "text-orange-400 bg-orange-900/20 border-orange-800/50"
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-400 bg-purple-400/10 border-purple-500/50",
  "어려움": "text-yellow-400 bg-yellow-400/10 border-yellow-500/50",
  "매우 어려움": "text-red-500 bg-red-500/10 border-red-500/50",
  "지옥 1": "text-rose-400 bg-rose-900/40 border-rose-600/50"
};

// 🟢 던전별 맞춤 난이도 세팅
const CONTENT_DB = [
  { id: "abyss_all", name: "어비스 3종 (통합)", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_1", name: "어비스 - 허상의 정박지", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_2", name: "어비스 - 광기의 동굴", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_3", name: "어비스 - 흩어진 물길", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "raid_cav", name: "레이드 - 카브락", type: "레이드", size: 8, diffs: ["입문"] },
  { id: "raid_white", name: "레이드 - 화이트 서큐버스", type: "레이드", size: 8, diffs: ["어려움", "매우 어려움"] },
  { id: "raid_eirel", name: "레이드 - 에이렐", type: "레이드", size: 8, diffs: ["어려움"] }
];

const JOB_ICONS: Record<string, string> = { 전사: "⚔️", 마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 힐러: "💖", 사제: "🕊️", 궁수: "🏹", 기사: "🛡️", 대검전사: "🗡️", 도적: "🥷", 댄서: "💃", 검술사: "🤺", 격투가: "🥊", 듀얼블레이드: "⚔️", 음유시인: "🎵", 수도사: "🙏", 전격술사: "⚡", 장궁병: "🎯", 석궁사수: "🏹", 악사: "🎸", 암흑술사: "🌑" };
const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

export default function PartyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeParties, setActiveParties] = useState<any[]>([]);

  // 폼 상태
  const [selectedChar, setSelectedChar] = useState(MY_ACCOUNT_CHARACTERS[0]);
  const [selectedContent, setSelectedContent] = useState(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].diffs[0]);
  
  // 🟢 파티 목적 분리 상태 (1회 클리어 vs 뺑이)
  const [partyType, setPartyType] = useState<"1회 클리어" | "연속 뺑이">("1회 클리어");
  
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  
  const [discordAlertCreate, setDiscordAlertCreate] = useState(true);
  const [discordAlertDepart, setDiscordAlertDepart] = useState(true);

  const [matchingMode, setMatchingMode] = useState<"모집우선" | "조합우선">("모집우선");
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [wantedRoles, setWantedRoles] = useState<string[]>([]);

  const [alertStatus, setAlertStatus] = useState<"hidden" | "popup" | "balloon">("hidden");

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchParties = async () => {
    const { data, error } = await supabase.from('parties').select('*').order('created_at', { ascending: false });
    if (!error && data) setActiveParties(data);
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    setUser(JSON.parse(savedUser));
    fetchParties();
  }, [router]);

  const toggleRole = (role: string, state: string[], setState: any) => {
    if (state.includes(role)) setState(state.filter(r => r !== role));
    else setState([...state, role]);
  };

  // 던전 변경 시 해당 던전의 첫 번째 난이도로 자동 리셋
  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const content = CONTENT_DB.find(c => c.id === e.target.value) || CONTENT_DB[0];
    setSelectedContent(content);
    setSelectedDiff(content.diffs[0]);
  };

  const handleReservation = async () => {
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }
    const myJob = "기사"; 

    const newParty = {
      content_name: selectedContent.name,
      difficulty: selectedDiff,
      party_type: partyType, // 🟢 뺑이 파티 데이터 추가
      time_start: timeStart,
      time_end: timeEnd,
      max_members: selectedContent.size,
      matching_mode: matchingMode,
      wanted_roles: matchingMode === "조합우선" ? wantedRoles : [],
      members: [{ name: selectedChar, job: myJob, roles: myRoles }], 
      status: "모집중"
    };

    const { error } = await supabase.from('parties').insert([newParty]);
    if (!error) {
      alert(`[${selectedChar}] 파티 예약이 등록되었습니다!`);
      fetchParties();
    } else {
      alert("파티 등록 실패. parties 테이블에 'party_type' 컬럼이 있는지 확인해주세요.");
    }
  };

  const handleDeleteParty = async (id: number) => {
    if (confirm("정말로 이 파티 모집을 취소하시겠습니까?")) {
      const { error } = await supabase.from('parties').delete().eq('id', id);
      if (!error) {
        alert("파티 예약이 정상적으로 취소되었습니다.");
        fetchParties(); 
      }
    }
  };

  const handleSyncNexonAPI = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      const { error } = await supabase.from('activity_logs').insert([{
        character_name: selectedChar,
        content_name: selectedContent.name,
        difficulty: selectedDiff,
        action: "클리어 (API 자동 동기화 완료)"
      }]);
      setIsSyncing(false);
      if (!error) {
        alert(`[API 동기화 완료] 📡\n\n'${selectedChar}' 캐릭터의 주간 숙제(${selectedContent.name}) 클리어 내역이 성역 넥서스에 완벽하게 동기화되었습니다! ✅\n(로그 DB 저장 완료)`);
      } else {
        alert("동기화 중 오류가 발생했습니다.");
      }
    }, 1500);
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 relative select-none">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              ⚔️ 스마트 파티 매칭
              <button onClick={() => setAlertStatus("popup")} className="text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded text-white shadow-lg transition">(테스트) 매칭 팝업</button>
            </h1>
            <p className="text-sm text-zinc-400 mt-2">강제 매칭 없이, 원하는 조합과 멤버로 파티를 꾸려보세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 🟦 좌측: 예약 폼 */}
          <div className="lg:col-span-4 bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl h-fit space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#e6c788] flex items-center gap-2">📅 파티 생성 및 예약</h2>
            </div>
            
            <div className="bg-[#1c1c1e] border border-zinc-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-bold text-zinc-500">참여할 캐릭터 선택</label>
                <button 
                  onClick={handleSyncNexonAPI} 
                  disabled={isSyncing}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded border transition flex items-center gap-1 ${isSyncing ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50'}`}
                >
                  {isSyncing ? <span className="animate-spin">⏳</span> : <span>🔄</span>}
                  {isSyncing ? 'API 통신 중...' : '내 숙제 즉시 갱신'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {MY_ACCOUNT_CHARACTERS.map(char => (
                  <button key={char} onClick={() => setSelectedChar(char)} className={`text-xs font-bold px-3 py-1.5 rounded transition ${selectedChar === char ? 'bg-[#e6c788] text-[#121212] shadow-lg' : 'bg-[#121212] border border-zinc-700 text-zinc-400 hover:text-white'}`}>{char}</button>
                ))}
              </div>
            </div>

            {/* 🟢 파티 목적 분리 (단판 vs 뺑이) */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-zinc-500 mb-2 block">파티 목적</label>
              <div className="flex bg-[#121212] p-1.5 rounded-lg border border-zinc-700">
                <button onClick={() => setPartyType("1회 클리어")} className={`flex-1 py-2 rounded text-xs font-bold transition ${partyType === "1회 클리어" ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  🎯 1회 클리어
                </button>
                <button onClick={() => setPartyType("연속 뺑이")} className={`flex-1 py-2 rounded text-xs font-bold transition ${partyType === "연속 뺑이" ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  🔄 연속 뺑이 (시간제)
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 mb-2 block">목표 컨텐츠 ({selectedContent.size}인)</label>
                  <select value={selectedContent.id} onChange={handleContentChange} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-[#e6c788] outline-none">
                    {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {/* 🟢 던전에 따라 난이도가 동적으로 변경됨 */}
                <div className="col-span-2 bg-[#121212] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-zinc-500 mb-2 block">선택 가능한 난이도</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.diffs.map(diff => (
                      <button 
                        key={diff} 
                        onClick={() => setSelectedDiff(diff)}
                        className={`text-xs font-bold px-3 py-1.5 rounded border transition-all ${selectedDiff === diff ? DIFFICULTY_COLORS[diff] + ' shadow-[0_0_10px_rgba(255,255,255,0.1)] scale-105' : 'bg-[#1c1c1e] text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">
                  {partyType === "연속 뺑이" ? "뺑이 진행 시간 (24시간제)" : "예상 소요 시간 (24시간제)"}
                </label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                  <span className="text-zinc-500 font-bold">~</span>
                  <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <label className="text-[11px] font-bold text-zinc-500 mb-2 block">매칭 방식 선택</label>
              <div className="flex bg-[#121212] p-1 rounded-lg border border-zinc-700">
                <button onClick={() => setMatchingMode("모집우선")} className={`flex-1 py-2 rounded text-xs font-bold transition ${matchingMode === "모집우선" ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  ⚡ 모집 우선 (빠른 출발)
                </button>
                <button onClick={() => setMatchingMode("조합우선")} className={`flex-1 py-2 rounded text-xs font-bold transition ${matchingMode === "조합우선" ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  🛡️ 조합 우선 (정석 팟)
                </button>
              </div>
            </div>

            {matchingMode === "조합우선" && (
              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-indigo-900/50 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <label className="text-[11px] font-bold text-indigo-400 mb-2 block">🙋‍♂️ 내가 수행 가능한 포지션 (중복 선택 가능)</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, myRoles, setMyRoles)} className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${myRoles.includes(role) ? ROLE_COLORS[role] + ' shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-[#121212] border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-rose-400 mb-2 block">📢 파티에 꼭 필요한 포지션 구인 (Wanted)</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, wantedRoles, setWantedRoles)} className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${wantedRoles.includes(role) ? 'bg-rose-900/40 text-rose-300 border-rose-500' : 'bg-[#121212] border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                        + {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#1c1c1e] border border-indigo-500/30 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#5865F2] text-sm bg-[#5865F2]/20 p-1.5 rounded-full">🎮</span>
                <span className="text-xs font-bold text-white">디스코드 봇 알림 설정</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">📢 파티 생성 즉시 알림 (모집 채널)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={discordAlertCreate} onChange={() => setDiscordAlertCreate(!discordAlertCreate)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5865F2]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">⏰ 출발 15분 전 리마인드 DM</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={discordAlertDepart} onChange={() => setDiscordAlertDepart(!discordAlertDepart)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5865F2]"></div>
                </label>
              </div>
            </div>

            <button onClick={handleReservation} className="w-full bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black py-3 rounded-xl shadow-[0_0_15px_rgba(230,199,136,0.3)] transition transform hover:scale-[1.02]">
              예약 대기열 등록
            </button>
          </div>

          {/* 🟦 우측: 실시간 모집 현황 */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">
            <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl flex-1">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                🔥 실시간 모집 현황 <span className="text-[10px] font-normal text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/50">즉시 참여 가능</span>
              </h2>
              
              <div className="space-y-4 overflow-y-auto max-h-[700px] custom-scrollbar pr-2">
                {activeParties.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 font-bold flex flex-col items-center gap-3">
                    <span className="text-4xl opacity-50">🏕️</span>
                    현재 모집 중인 파티가 없습니다.
                  </div>
                ) : (
                  activeParties.map(party => {
                    const isMyParty = party.members[0] && MY_ACCOUNT_CHARACTERS.includes(party.members[0].name);

                    return (
                      <div key={party.id} className={`bg-[#1c1c1e] border ${party.party_type === '연속 뺑이' ? 'border-rose-900/40 hover:border-rose-500/50' : 'border-zinc-700 hover:border-emerald-500/50'} rounded-xl p-4 transition group flex flex-col gap-3 relative overflow-hidden`}>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {/* 🟢 뺑이 파티 뱃지 노출 */}
                              {party.party_type === "연속 뺑이" ? (
                                <span className="text-[9px] font-black bg-rose-900/80 text-white px-2 py-0.5 rounded border border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.3)] animate-pulse">🔄 뺑이팟</span>
                              ) : (
                                <span className="text-[9px] font-black bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded border border-zinc-500">🎯 1회팟</span>
                              )}
                              
                              <span className="text-white font-black text-lg">{party.content_name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 border rounded ${DIFFICULTY_COLORS[party.difficulty] || "text-zinc-400 bg-zinc-800 border-zinc-600"}`}>{party.difficulty}</span>
                              
                              {party.matching_mode === "조합우선" ? (
                                <span className="text-[10px] font-bold bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">🛡️ 조합우선</span>
                              ) : (
                                <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">⚡ 모집우선</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 font-medium">⏰ 진행 시간: <span className="text-[#e6c788]">{party.time_start} ~ {party.time_end}</span></p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-black text-white bg-zinc-800 px-3 py-1 rounded-full">{party.members.length} / {party.max_members} 명</span>
                            {isMyParty ? (
                              <button onClick={() => handleDeleteParty(party.id)} className="text-xs font-bold bg-red-900/50 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/50 hover:border-red-500 px-4 py-1.5 rounded shadow transition opacity-80 group-hover:opacity-100">
                                예약 취소
                              </button>
                            ) : (
                              <button onClick={() => setAlertStatus("popup")} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded shadow transition opacity-80 group-hover:opacity-100">
                                참여 신청
                              </button>
                            )}
                          </div>
                        </div>

                        {party.matching_mode === "조합우선" && party.wanted_roles && party.wanted_roles.length > 0 && (
                          <div className="flex items-center gap-2 bg-rose-900/10 border border-rose-900/30 p-2 rounded-lg mt-1">
                            <span className="text-[10px] font-black text-rose-500 mr-1 animate-pulse">WANTED</span>
                            {party.wanted_roles.map((role: string) => (
                              <span key={role} className="text-[10px] font-bold bg-rose-900/40 text-rose-300 px-2 py-0.5 rounded border border-rose-700/50">{role} 급구</span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 bg-[#121212] p-2 rounded-lg border border-zinc-800 overflow-x-auto custom-scrollbar mt-1">
                          {Array.from({ length: party.max_members }).map((_, i) => {
                            const m = party.members[i];
                            return m ? (
                              <div key={i} className="flex flex-col items-center justify-center bg-zinc-800 border border-zinc-600 rounded p-1.5 w-14 h-16 flex-shrink-0 relative group/slot">
                                <span className="text-lg leading-none mb-1">{JOB_ICONS[m.job] || "👤"}</span>
                                <span className="text-[9px] text-white truncate w-full text-center font-bold">{m.name}</span>
                                {m.roles && m.roles.length > 0 && (
                                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 w-3 h-3 rounded-full border border-[#121212] flex items-center justify-center">
                                    <span className="text-[7px] text-white">+</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-700 rounded p-1.5 w-14 h-16 flex-shrink-0">
                                <span className="text-xs text-zinc-600">빈자리</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {alertStatus === "popup" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_50px_rgba(5,150,105,0.2)] w-full max-w-sm overflow-hidden flex flex-col relative transform scale-100 transition-transform">
            <div className="bg-emerald-900/30 p-6 text-center border-b border-emerald-900/50 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
              <span className="text-4xl block mb-3">🔔</span>
              <h2 className="text-xl font-black text-white">매칭 대기열이 성사되었습니다!</h2>
              <p className="text-xs text-zinc-400 mt-2">파티에 합류하시겠습니까?</p>
            </div>
            
            <div className="p-5 bg-[#252528] space-y-3">
              <div className="bg-[#121212] p-3 rounded-lg border border-zinc-700 flex justify-between items-center">
                <span className="text-sm font-bold text-white">어비스 3종 (매우 어려움)</span>
                <span className="text-xs text-[#e6c788]">18:00 ~ 20:00</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAlertStatus("hidden")} className="flex-1 bg-[#121212] border border-zinc-700 hover:border-zinc-500 text-zinc-400 font-bold py-3 rounded-xl transition">
                  거절 (미참여)
                </button>
                <button onClick={() => { alert("수락 완료! 파티에 합류했습니다."); setAlertStatus("hidden"); }} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg transition transform hover:scale-105">
                  수락 (참여)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}