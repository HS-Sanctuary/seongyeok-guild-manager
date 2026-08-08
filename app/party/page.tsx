"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { calculateOptimalStartTime, isScheduleConflict, pickRandomLeader } from "../../lib/matchingUtils";

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
              <button key={hour} onClick={() => onChange(`${hour}:${m}`)} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${h === hour ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>{hour}시</button>
            ))}
          </div>
          <div className="w-px bg-zinc-700"></div>
          <div className="flex-1 h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button key={minute} onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${m === minute ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>{minute}분</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [allCharactersMap, setAllCharactersMap] = useState<Record<string, string>>({});

  const [selectedChar, setSelectedChar] = useState(MY_ACCOUNT_CHARACTERS[0]);
  const [selectedContent, setSelectedContent] = useState(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].diffs[0]);
  const [partyType, setPartyType] = useState<"1회 클리어" | "연속 뺑이">("1회 클리어");
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");

  const [matchingMode, setMatchingMode] = useState<"모집우선" | "조합우선">("모집우선");
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [wantedRoles, setWantedRoles] = useState<string[]>([]);

  // 팝업 참여 상태
  const [joinPopupParty, setJoinPopupParty] = useState<any>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [detailModalParty, setDetailModalParty] = useState<any>(null);

  const fetchData = async () => {
    const [charRes, partyRes] = await Promise.all([
      supabase.from('characters').select('*'),
      supabase.from('parties').select('*').order('created_at', { ascending: false })
    ]);
    if (charRes.data) {
      const jobMap: Record<string, string> = {};
      charRes.data.forEach(c => { jobMap[c.nickname] = c.job || "전사"; });
      setAllCharactersMap(jobMap);
      setMyCharacters(charRes.data.filter(char => MY_ACCOUNT_CHARACTERS.includes(char.nickname)));
    }
    if (partyRes.data) setActiveParties(partyRes.data);
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    setUser(JSON.parse(savedUser));
    fetchData();
  }, [router]);

  const toggleRole = (role: string, state: string[], setState: any) => {
    if (state.includes(role)) setState(state.filter(r => r !== role));
    else setState([...state, role]);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const content = CONTENT_DB.find(c => c.id === e.target.value) || CONTENT_DB[0];
    setSelectedContent(content);
    setSelectedDiff(content.diffs[0]);
  };

  const handleReservation = async () => {
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }
    const myJob = allCharactersMap[selectedChar] || "전사"; 

    const newParty = {
      content_name: selectedContent.name,
      difficulty: selectedDiff,
      party_type: partyType,
      time_start: timeStart,
      time_end: timeEnd,
      max_members: selectedContent.size,
      matching_mode: matchingMode,
      wanted_roles: matchingMode === "조합우선" ? wantedRoles : [],
      members: [{ name: selectedChar, job: myJob, roles: myRoles, time_start: timeStart, time_end: timeEnd }], 
      status: "모집중"
    };

    const { error } = await supabase.from('parties').insert([newParty]);
    if (!error) {
      alert(`[${selectedChar}] 파티 예약이 등록되었습니다!`);
      fetchData();
    } else {
      alert("등록 실패");
    }
  };

  const handleDeleteParty = async (id: number) => {
    if (confirm("정말로 이 파티 모집을 취소하시겠습니까?")) {
      await supabase.from('parties').delete().eq('id', id);
      fetchData(); 
    }
  };

  const openJoinPopup = (party: any) => {
    setJoinPopupParty(party);
    setJoinSelectedChar(myCharacters.length > 0 ? myCharacters[0].nickname : "");
    setJoinSelectedRole(party.wanted_roles?.[0] || "딜러");
    setJoinTimeStart(party.time_start);
    setJoinTimeEnd(party.time_end);
  };

  const executeJoinParty = async () => {
    if (!joinSelectedChar || !joinSelectedRole) return alert("캐릭터와 포지션을 선택해주세요!");

    try {
      const [partyRes, allActivePartiesRes] = await Promise.all([
        supabase.from('parties').select('*').eq('id', joinPopupParty.id).single(),
        supabase.from('parties').select('*').neq('status', '종료됨')
      ]);
      const latestParty = partyRes.data;
      if (!latestParty || latestParty.members.length >= latestParty.max_members) return alert("마감되었습니다.");

      if (latestParty.members.some((m: any) => m.name === joinSelectedChar)) {
        return alert(`이미 '${joinSelectedChar}' 캐릭터가 이 파티에 참여 중입니다!`);
      }

      const mySchedules = allActivePartiesRes.data
        ?.filter(p => p.members.some((m: any) => m.name === joinSelectedChar))
        .map(p => {
          const dur = p.content_name.includes("통합") || p.content_name.includes("3종") ? 45 : 15;
          const myMemInfo = p.members.find((m: any) => m.name === joinSelectedChar);
          const st = p.final_start_time || myMemInfo?.time_start || p.time_start;
          return { start: st, duration: dur };
        }) || [];
      const newDur = latestParty.content_name.includes("통합") || latestParty.content_name.includes("3종") ? 45 : 15;
      
      if (isScheduleConflict(joinTimeStart, newDur, mySchedules)) {
         return alert(`⚠️ [충돌 경고]\n'${joinSelectedChar}' 캐릭터는 해당 시간에 이미 다른 파티(${newDur}분 소요) 일정이 존재합니다!\n참여할 수 없습니다.`);
      }

      const myJob = allCharactersMap[joinSelectedChar] || "전사";
      const newMember = { name: joinSelectedChar, job: myJob, roles: [joinSelectedRole], time_start: joinTimeStart, time_end: joinTimeEnd };
      const updatedMembers = [...latestParty.members, newMember];
      let updatedWanted = [...(latestParty.wanted_roles || [])];
      if (updatedWanted.indexOf(joinSelectedRole) > -1) updatedWanted.splice(updatedWanted.indexOf(joinSelectedRole), 1);

      let updatePayload: any = { members: updatedMembers, wanted_roles: updatedWanted };

      if (updatedMembers.length === latestParty.max_members) {
        const timeRanges = updatedMembers.map(m => ({ start: m.time_start, end: m.time_end }));
        const optimalTime = calculateOptimalStartTime(timeRanges);
        
        updatePayload.final_start_time = optimalTime || latestParty.members[0].time_start;
        updatePayload.status = "모집완료";
        updatePayload.leader_name = pickRandomLeader(updatedMembers);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from('parties').update(updatePayload).eq('id', joinPopupParty.id);
      if (error) throw error;

      if (updatePayload.status === "모집완료") alert(`🎉 파티 매칭 완료!\n⏰ 확정 출발 시간: ${updatePayload.final_start_time}\n👑 랜덤 파티장: ${updatePayload.leader_name}`);
      else alert(`[${joinSelectedChar}] 합류 완료!`);
      
      setJoinPopupParty(null);
      fetchData();
    } catch (err) { alert("오류 발생"); }
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-20 pt-8 relative select-none">
      <div className="max-w-[1300px] mx-auto p-4 md:p-8 space-y-6 relative">
        
        {/* 🟢 SYNAXIS 헤더 배너 (요청하신 문구 반영) */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-3 px-6 shadow-xl mb-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788] shadow-[0_0_15px_#e6c788]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#e6c788] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md leading-none">SYNAXIS</h1>
                <span className="text-[#e6c788] text-[13px] font-bold tracking-wide mt-1.5 leading-none">시낙시스 : 스마트 파티 매칭</span>
              </div>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-700/50 px-4 py-2 rounded-lg w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">💡</span>
              <div className="flex flex-col text-[11px] md:text-[12px] font-bold leading-tight w-full">
                <span className="text-zinc-300 w-full">시낙시스는 고대 그리스어로 ‘함께 모이는 것’을 뜻하는 말입니다.</span>
                <span className="text-[#e6c788] mt-0.5">혼자가 아닌 성역의 전우들과 함께 길을 나서는 공간입니다.</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측 폼 */}
          <div className="lg:col-span-4 bg-[#1c1c1e] rounded-2xl border border-zinc-800 p-6 shadow-xl h-fit space-y-5">
            <h2 className="text-lg font-black text-[#e6c788] flex items-center gap-2"><span>📅</span> 파티 생성 및 예약</h2>
            
            <div className="bg-[#121212] border border-zinc-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-zinc-500 mb-2 block">참여할 캐릭터 선택</label>
              <div className="flex flex-wrap gap-2">
                {MY_ACCOUNT_CHARACTERS.map(char => (
                  <button key={char} onClick={() => setSelectedChar(char)} className={`text-xs font-bold px-3 py-1.5 rounded transition ${selectedChar === char ? 'bg-[#e6c788] text-[#121212] shadow-lg' : 'bg-[#1c1c1e] border border-zinc-700 text-zinc-400 hover:text-white'}`}>{char}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 mb-2 block">파티 목적</label>
              <div className="flex bg-[#121212] p-1.5 rounded-lg border border-zinc-800">
                <button onClick={() => setPartyType("1회 클리어")} className={`flex-1 py-2 rounded text-xs font-bold transition ${partyType === "1회 클리어" ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>🎯 1회 클리어</button>
                <button onClick={() => setPartyType("연속 뺑이")} className={`flex-1 py-2 rounded text-xs font-bold transition ${partyType === "연속 뺑이" ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50 shadow' : 'text-zinc-500'}`}>🔄 연속 뺑이</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">목표 컨텐츠</label>
                <select value={selectedContent.id} onChange={handleContentChange} className="w-full bg-[#121212] border border-zinc-800 rounded p-2.5 text-sm text-white focus:border-[#e6c788] outline-none">
                  {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="bg-[#121212] p-3 rounded-lg border border-zinc-800">
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">선택 가능한 난이도</label>
                <div className="flex flex-wrap gap-2">
                  {selectedContent.diffs.map(diff => (
                    <button key={diff} onClick={() => setSelectedDiff(diff)} className={`text-xs font-bold px-3 py-1.5 rounded border transition-all ${selectedDiff === diff ? DIFFICULTY_COLORS[diff] + ' scale-105' : 'bg-[#1c1c1e] text-zinc-500 border-zinc-800'}`}>{diff}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#e6c788] mb-2 block">방장(본인)의 가능 시간 범위</label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                  <span className="text-zinc-500 font-bold">~</span>
                  <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <label className="text-[11px] font-bold text-zinc-500 mb-2 block">매칭 방식 선택</label>
              <div className="flex bg-[#121212] p-1 rounded-lg border border-zinc-800">
                <button onClick={() => setMatchingMode("모집우선")} className={`flex-1 py-2 rounded text-xs font-bold transition ${matchingMode === "모집우선" ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>⚡ 모집우선</button>
                <button onClick={() => setMatchingMode("조합우선")} className={`flex-1 py-2 rounded text-xs font-bold transition ${matchingMode === "조합우선" ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>🛡️ 조합우선</button>
              </div>
            </div>

            {matchingMode === "조합우선" && (
              <div className="bg-[#121212] p-4 rounded-xl border border-indigo-900/50 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-indigo-400 mb-2 block">내 포지션</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, myRoles, setMyRoles)} className={`text-xs font-bold px-3 py-1.5 rounded border ${myRoles.includes(role) ? ROLE_COLORS[role] : 'bg-[#1c1c1e] border-zinc-800 text-zinc-500'}`}>{role}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-rose-400 mb-2 block">구인 포지션 (Wanted)</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, wantedRoles, setWantedRoles)} className={`text-xs font-bold px-3 py-1.5 rounded border ${wantedRoles.includes(role) ? 'bg-rose-900/40 text-rose-300 border-rose-500' : 'bg-[#1c1c1e] border-zinc-800 text-zinc-500'}`}>+ {role}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleReservation} className="w-full bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black py-3 rounded-xl shadow-lg transition">예약 대기열 등록</button>
          </div>

          {/* 우측 파티 목록 리스트 */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-800 p-6 shadow-xl">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2"><span>🔥</span> 실시간 모집 현황</h2>
              
              <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                {activeParties.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 font-bold">현재 모집 중인 파티가 없습니다.</div>
                ) : (
                  activeParties.map(party => {
                    const isMyParty = party.members.some((m: any) => MY_ACCOUNT_CHARACTERS.includes(m.name));
                    const isFull = party.members.length >= party.max_members;
                    const isOver4 = party.max_members > 4;
                    const isCompleted = party.status === "모집완료";

                    return (
                      <div key={party.id} className={`bg-[#151515] border ${party.party_type === '연속 뺑이' ? 'border-rose-900/40' : 'border-zinc-800'} ${isCompleted ? 'bg-indigo-900/10 border-indigo-700/50' : ''} rounded-xl p-4 flex flex-col gap-3 shadow-md transition-all`}>
                        <div className="flex justify-between items-start gap-2 border-b border-zinc-800 pb-2.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {isCompleted ? (
                                <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow">✅ 매칭완료</span>
                              ) : (
                                <span className="text-[9px] font-black bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">대기중</span>
                              )}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[party.difficulty] || "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>{party.difficulty}</span>
                              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{party.max_members}인팟</span>
                            </div>
                            <p className={`text-base font-black ${isCompleted ? 'text-indigo-200' : 'text-white'} leading-tight`}>{party.content_name}</p>
                            
                            <div className="mt-1">
                              {isCompleted ? (
                                <span className="text-[11px] bg-yellow-900/40 px-2 py-0.5 rounded text-yellow-400 font-bold border border-yellow-600/50 animate-pulse">⏰ 확정 출발 {party.final_start_time}</span>
                              ) : (
                                <span className="text-[10px] text-[#e6c788] font-mono">⏰ 희망 {party.time_start} ~ {party.time_end}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-xs font-black text-white bg-[#1c1c1e] border border-zinc-800 px-2.5 py-1 rounded-full">{party.members.length} / {party.max_members} 명</span>
                            {isFull ? (
                              <button disabled className="text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded cursor-not-allowed">모집 마감</button>
                            ) : (
                              <button onClick={() => openJoinPopup(party)} className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded shadow">참여 신청</button>
                            )}
                          </div>
                        </div>

                        {party.matching_mode === "조합우선" && party.wanted_roles && party.wanted_roles.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-[#121212] border border-rose-900/30 px-2 py-1.5 rounded-lg">
                            <span className="text-[9px] font-black text-rose-500 animate-pulse">WANTED</span>
                            {party.wanted_roles.map((role: string) => (
                              <span key={role} className="text-[9px] font-bold bg-rose-900/40 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700/50">{role}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1.5 bg-[#121212] p-2 rounded-lg border border-zinc-800">
                          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar flex-1">
                            {Array.from({ length: isOver4 ? 4 : party.max_members }).map((_, i) => {
                              const m = party.members[i];
                              const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                              return m ? (
                                <div key={i} className={`flex flex-col items-center justify-center border ${isCompleted && party.leader_name === m.name ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-zinc-800 border-zinc-700'} rounded p-1 w-12 h-14 flex-shrink-0 relative`}>
                                  <span className="text-sm leading-none mb-0.5">{JOB_ICONS[actualJob] || "👤"}</span>
                                  <span className="text-[8px] text-white truncate w-full text-center font-bold">{m.name}</span>
                                  {m.roles && m.roles.length > 0 && (
                                    <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[7px] text-white rounded-b truncate px-0.5">{m.roles[0]}</span>
                                  )}
                                </div>
                              ) : (
                                <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-800 rounded p-1 w-12 h-14 flex-shrink-0">
                                  <span className="text-[8px] text-zinc-600">빈자리</span>
                                </div>
                              )
                            })}
                          </div>

                          {isOver4 && (
                            <button onClick={() => setDetailModalParty(party)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-bold px-2.5 py-3 rounded flex flex-col items-center justify-center gap-1 transition flex-shrink-0">
                              <span>+보기</span>
                              <span className="text-[8px] text-zinc-500">({party.members.length}/{party.max_members})</span>
                            </button>
                          )}
                        </div>

                        <div className="text-[10px] text-zinc-500 font-medium flex justify-between items-center pt-1">
                          <span>파티장: <span className="text-zinc-300 font-bold">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
                          {isMyParty && (
                            <button onClick={() => handleDeleteParty(party.id)} className="text-[9px] text-red-400 hover:underline">파티 삭제/취소</button>
                          )}
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

      {/* 참여 팝업 */}
      {joinPopupParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-5 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-black text-white">⚔️ 파티 합류 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 bg-[#1c1c1e]">
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-800 text-center">
                <p className="text-sm font-bold text-[#e6c788] mb-1">{joinPopupParty.content_name}</p>
                <p className="text-xs text-zinc-400">⏰ {joinPopupParty.time_start} ~ {joinPopupParty.time_end}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">1. 캐릭터 선택</label>
                <div className="flex flex-wrap gap-2">
                  {myCharacters.map(char => (
                    <button key={char.id} onClick={() => setJoinSelectedChar(char.nickname)} className={`text-xs font-bold px-3 py-2 rounded-lg transition ${joinSelectedChar === char.nickname ? 'bg-[#e6c788] text-black shadow' : 'bg-[#121212] text-zinc-400 border border-zinc-800'}`}>
                      {JOB_ICONS[char.job] || "👤"} {char.nickname}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">2. 포지션 선택</label>
                {joinPopupParty.wanted_roles && joinPopupParty.wanted_roles.length > 0 && (
                  <div className="mb-3 bg-rose-900/10 border border-rose-900/30 p-3 rounded-lg">
                    <p className="text-[10px] text-rose-400 font-bold mb-2">🔥 파티에서 급구 중인 포지션입니다!</p>
                    <div className="flex gap-2">
                      {joinPopupParty.wanted_roles.map((role: string) => (
                        <button key={role} onClick={() => setJoinSelectedRole(role)} className={`text-xs font-bold px-3 py-1.5 rounded transition ${joinSelectedRole === role ? 'bg-rose-600 text-white' : 'bg-rose-900/40 text-rose-300 border border-rose-700'}`}>{role}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {["탱커", "힐러", "근딜", "원딜"].map(role => (
                    <button key={role} onClick={() => setJoinSelectedRole(role)} className={`text-xs font-bold px-3 py-1.5 rounded transition ${joinSelectedRole === role ? 'bg-indigo-600 text-white' : 'bg-[#121212] text-zinc-400 border border-zinc-800'}`}>{role}</button>
                  ))}
                </div>
              </div>

              <div className="bg-[#121212] border border-zinc-800 p-4 rounded-xl">
                <label className="text-[11px] font-bold text-[#e6c788] mb-1 block">3. 본인의 가능 시간 입력</label>
                <div className="flex items-center gap-2 mt-2">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-zinc-500 font-bold">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>
            <div className="p-5 bg-[#252528] border-t border-zinc-700 flex gap-3">
              <button onClick={() => setJoinPopupParty(null)} className="flex-1 bg-[#121212] border border-zinc-700 text-zinc-400 font-bold py-3 rounded-xl">취소</button>
              <button onClick={executeJoinParty} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg">가능 시간 제출 및 합류!</button>
            </div>
          </div>
        </div>
      )}

      {/* 8인팟 전체보기 모달 */}
      {detailModalParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-4 border-b border-zinc-700 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm">👥 {detailModalParty.content_name} 전체 멤버 ({detailModalParty.members.length}/{detailModalParty.max_members})</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-zinc-500 hover:text-white text-lg">&times;</button>
            </div>
            <div className="p-5 grid grid-cols-4 gap-2 bg-[#121212] max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                return m ? (
                  <div key={i} className={`flex flex-col items-center justify-center border ${detailModalParty.status === '모집완료' && detailModalParty.leader_name === m.name ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-zinc-800 border-zinc-700'} rounded p-2 h-20 relative`}>
                    <span className="text-2xl mb-1">{JOB_ICONS[actualJob] || "👤"}</span>
                    <span className="text-[10px] text-white truncate w-full text-center font-bold">{m.name}</span>
                    {m.roles && m.roles.length > 0 && (
                      <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[8px] text-white rounded-b truncate px-0.5">{m.roles[0]}</span>
                    )}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-800 rounded p-2 h-20">
                    <span className="text-[10px] text-zinc-600">빈자리</span>
                  </div>
                )
              })}
            </div>
            <div className="p-4 bg-[#252528] border-t border-zinc-700 text-right">
              <button onClick={() => setDetailModalParty(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded">닫기</button>
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