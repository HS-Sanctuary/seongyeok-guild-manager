"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// =====================================================================
// 🎯 커스텀 타임 피커 컴포넌트 (모바일 UX 최적화)
// =====================================================================
function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':');
  
  // 24시간 단위 (00~23) & 15분 단위 (00, 15, 30, 45)
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {/* 바깥 영역 클릭 시 닫히도록 하는 투명 배경 */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-50 bg-[#121212] border ${isOpen ? 'border-[#e6c788]' : 'border-zinc-700'} hover:border-zinc-500 rounded p-2.5 text-sm font-bold text-white cursor-pointer text-center transition flex justify-center items-center gap-1`}
      >
        <span>{h}:{m}</span>
        <span className={`text-[10px] text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-[#e6c788]' : ''}`}>▼</span>
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[160px] bg-[#1c1c1e] border border-zinc-600 rounded-lg shadow-2xl z-50 p-2 flex gap-2">
          {/* 시간 스크롤 */}
          <div className="flex-1 h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button key={hour} onClick={() => onChange(`${hour}:${m}`)} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${h === hour ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                {hour}시
              </button>
            ))}
          </div>
          <div className="w-px bg-zinc-700"></div>
          {/* 분 스크롤 */}
          <div className="flex-1 h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button key={minute} onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} className={`w-full text-center py-1.5 rounded text-xs font-bold transition ${m === minute ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                {minute}분
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 🎯 데이터베이스 (임시 데이터)
// =====================================================================
const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-400 bg-purple-400/10 border-purple-500/50",
  "어려움": "text-yellow-400 bg-yellow-400/10 border-yellow-500/50",
  "매우어려움": "text-red-500 bg-red-500/10 border-red-500/50",
  "지옥1": "text-rose-700 bg-rose-900/20 border-rose-800/50",
  "지옥2": "text-rose-700 bg-rose-900/20 border-rose-800/50",
  "지옥3": "text-rose-700 bg-rose-900/20 border-rose-800/50",
  "지옥4": "text-rose-700 bg-rose-900/20 border-rose-800/50",
  "지옥5": "text-rose-700 bg-rose-900/20 border-rose-800/50",
  "지옥6": "text-rose-700 bg-rose-900/20 border-rose-800/50",
};

const CONTENT_DB = [
  { id: "abyss3", name: "어비스 3종", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우어려움", "지옥1", "지옥2", "지옥3", "지옥4", "지옥5", "지옥6"], subs: [] },
  { id: "abyss1", name: "어비스 1종", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우어려움", "지옥1", "지옥2", "지옥3", "지옥4", "지옥5", "지옥6"], subs: ["허상의 정박지", "광기의 동굴", "흩어진 물길"] },
  { id: "raid_cab", name: "레이드 - 카브락", type: "레이드", size: 8, diffs: ["입문", "어려움", "매우어려움"], subs: [] },
  { id: "raid_suc", name: "레이드 - 화이트 서큐버스", type: "레이드", size: 4, diffs: ["어려움", "매우어려움"], subs: [] },
  { id: "raid_eir", name: "레이드 - 에이렐", type: "레이드", size: 4, diffs: ["어려움"], subs: [] },
];

const JOB_ICONS: { [key: string]: string } = { 전사: "⚔️", 마법사: "🪄", 힐러: "💖", 궁수: "🏹", 기사: "🛡️", 도적: "🥷" };
const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

const GUILD_MEMBERS = [
  { name: "파랑", job: "전사", cp: 85000, done: false },
  { name: "춘법", job: "마법사", cp: 82000, done: false },
  { name: "꽃닝", job: "힐러", cp: 79000, done: true },
  { name: "하채", job: "궁수", cp: 81000, done: false },
  { name: "십쇼", job: "기사", cp: 86000, done: true },
  { name: "별콩", job: "도적", cp: 80500, done: false }
];

const MOCK_REALTIME_QUEUE = [
  { id: 1, content: "어비스 3종", difficulty: "매우어려움", time: "18:30 ~ 19:00", members: [{ name: "파랑", job: "전사" }, { name: "하채", job: "궁수" }], max: 4 },
  { id: 2, content: "레이드 - 카브락", difficulty: "어려움", time: "20:00 ~ 21:00", members: [{ name: "춘법", job: "마법사" }, { name: "별콩", job: "도적" }, { name: "꽃닝", job: "힐러" }, { name: "십쇼", job: "기사" }], max: 8 }
];

export default function PartyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // 예약 폼 상태
  const [selectedChar, setSelectedChar] = useState(MY_ACCOUNT_CHARACTERS[0]);
  const [selectedContent, setSelectedContent] = useState(CONTENT_DB[0]);
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].diffs[0]);
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  const [discordAlert, setDiscordAlert] = useState(true); // 디스코드 알림 스위치 상태

  const [alertStatus, setAlertStatus] = useState<"hidden" | "popup" | "balloon">("hidden");
  const [showGuildModal, setShowGuildModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    setUser(JSON.parse(savedUser));
  }, [router]);

  const handleContentChange = (contentId: string) => {
    const content = CONTENT_DB.find(c => c.id === contentId) || CONTENT_DB[0];
    setSelectedContent(content);
    setSelectedDiff(content.diffs[0]);
    setSelectedSub(content.subs.length > 0 ? content.subs[0] : "");
  };

  const handleReservation = () => {
    alert(`[${selectedChar}] 캐릭터로 ${timeStart}~${timeEnd} 파티 예약을 등록했습니다.\n${discordAlert ? '(디스코드 알림이 활성화되었습니다.)' : ''}`);
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 relative">
      
      {/* 🟢 GNB */}
      <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-3 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-7 h-7 bg-[#121212] border border-yellow-600/50 rounded flex items-center justify-center shadow-inner group-hover:border-yellow-400 transition">
              <span className="text-white font-black text-[10px] tracking-tighter">NX</span>
            </div>
            <span className="text-[#e6c788] font-serif font-black text-xl tracking-tight group-hover:text-yellow-400 transition">Sanctuary Nexus</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-400">
            <a href="/notice" className="hover:text-white transition cursor-pointer">공지사항</a>
            <a href="/character" className="hover:text-white transition cursor-pointer">캐릭터 관리</a>
            <a href="/party" className="text-white border-b-2 border-[#e6c788] pb-1 cursor-pointer">파티 매칭</a>
            <a href="/ranking" className="hover:text-white transition cursor-pointer">성역 랭킹</a>
            <a href="/support" className="hover:text-white transition cursor-pointer">문의/건의</a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-bold">{user.nickname}</span>
          <button onClick={() => { localStorage.removeItem("nexus_user"); router.push("/login"); }} className="text-zinc-500 hover:text-red-400 transition">로그아웃</button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🟦 헤더 */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              ⚔️ 스마트 파티 매칭
              <button onClick={() => setAlertStatus("popup")} className="text-[10px] bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white shadow-lg transition">(테스트) 매칭 완료</button>
            </h1>
            <p className="text-sm text-zinc-400 mt-2">일정을 예약해두거나, 실시간으로 빈자리가 있는 파티에 즉시 합류하세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 🟦 1. 파티 예약 폼 (좌측 4칸) */}
          <div className="lg:col-span-4 bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl h-fit">
            <h2 className="text-lg font-bold text-[#e6c788] mb-4 flex items-center gap-2">📅 내 일정 예약하기</h2>
            
            <div className="space-y-6">
              
              {/* 캐릭터 선택 */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">참여할 캐릭터 선택</label>
                <div className="flex flex-wrap gap-2">
                  {MY_ACCOUNT_CHARACTERS.map(char => (
                    <button 
                      key={char} 
                      onClick={() => setSelectedChar(char)}
                      className={`text-xs font-bold px-3 py-1.5 rounded transition ${selectedChar === char ? 'bg-yellow-600 text-white shadow-lg' : 'bg-[#121212] border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🟢 NEW: 커스텀 시간 설정 (24시간/15분) */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">접속 가능 시간 (24시간제)</label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                  <span className="text-zinc-500 font-bold">~</span>
                  <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
                </div>
              </div>

              {/* 컨텐츠 선택 & 길드원 조회 버튼 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[11px] font-bold text-zinc-500 block">목표 컨텐츠 ({selectedContent.size}인)</label>
                  <button onClick={() => setShowGuildModal(true)} className="text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-600/40 px-2 py-0.5 rounded flex items-center gap-1 transition">
                    🔍 미클리어 길드원 보기
                  </button>
                </div>
                <select value={selectedContent.id} onChange={e => handleContentChange(e.target.value)} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-[#e6c788] outline-none mb-2">
                  {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {selectedContent.subs.length > 0 && (
                  <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="w-full bg-[#1c1c1e] border border-zinc-700 rounded p-2.5 text-sm text-zinc-300 focus:border-[#e6c788] outline-none mb-2">
                    {selectedContent.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                )}
              </div>

              {/* 난이도 선택 */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 mb-2 block">난이도 설정</label>
                <div className="flex flex-wrap gap-2">
                  {selectedContent.diffs.map(diff => (
                    <button 
                      key={diff} 
                      onClick={() => setSelectedDiff(diff)}
                      className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${selectedDiff === diff ? DIFFICULTY_COLORS[diff] : 'bg-[#121212] border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🟢 NEW: 디스코드 알림 연동 토글 */}
              <div className="bg-[#1c1c1e] border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#5865F2]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#5865F2] text-sm">🎮</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">디스코드 알림 연동</p>
                    <p className="text-[10px] text-zinc-400">출발 15분 전 DM 발송</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={discordAlert} onChange={() => setDiscordAlert(!discordAlert)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865F2]"></div>
                </label>
              </div>

              <button onClick={handleReservation} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg mt-2 transition">
                예약 대기열 등록
              </button>
            </div>
          </div>

          {/* 🟦 2. 매칭 현황판 (우측 8칸) */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">
            
            {/* 상단: 나의 예약 대기열 */}
            <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">⏳ 나의 예약 대기열</h2>
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-yellow-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{selectedChar}</span>
                    <span className="text-white font-bold">{selectedContent.name} {selectedSub && `(${selectedSub})`}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 border rounded ${DIFFICULTY_COLORS[selectedDiff]}`}>{selectedDiff}</span>
                  </div>
                  <p className="text-xs text-zinc-400">희망 시간: {timeStart} ~ {timeEnd} (현재 멤버 탐색 중... 🔍)</p>
                </div>
                <button className="text-xs text-red-400 border border-red-900/50 bg-red-900/10 px-3 py-1.5 rounded hover:bg-red-900/30 transition">예약 취소</button>
              </div>
            </div>

            {/* 하단: 실시간 매칭 현황 대기열 (하이브리드 큐) */}
            <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl flex-1">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                🔥 실시간 모집 현황 <span className="text-[10px] font-normal text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/50">즉시 참여 가능</span>
              </h2>
              
              <div className="space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {MOCK_REALTIME_QUEUE.map(party => (
                  <div key={party.id} className="bg-[#1c1c1e] border border-zinc-700 hover:border-emerald-500/50 rounded-xl p-4 transition group flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-white font-black text-lg">{party.content}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 border rounded ${DIFFICULTY_COLORS[party.difficulty]}`}>{party.difficulty}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium flex items-center gap-1">⏰ 희망 시간대: <span className="text-[#e6c788]">{party.time}</span></p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-black text-white bg-zinc-800 px-3 py-1 rounded-full">{party.members.length} / {party.max} 명</span>
                        <button className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded shadow transition opacity-80 group-hover:opacity-100">
                          즉시 참여
                        </button>
                      </div>
                    </div>

                    {/* 슬롯 시각화 */}
                    <div className="flex gap-2 bg-[#121212] p-2 rounded-lg border border-zinc-800 overflow-x-auto custom-scrollbar">
                      {Array.from({ length: party.max }).map((_, i) => {
                        const m = party.members[i];
                        return m ? (
                          <div key={i} className="flex flex-col items-center justify-center bg-zinc-800 border border-zinc-600 rounded p-1.5 w-14 h-14 flex-shrink-0">
                            <span className="text-lg leading-none mb-1">{JOB_ICONS[m.job]}</span>
                            <span className="text-[9px] text-white truncate w-full text-center">{m.name}</span>
                          </div>
                        ) : (
                          <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-700 rounded p-1.5 w-14 h-14 flex-shrink-0">
                            <span className="text-xs text-zinc-600">빈자리</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================================
          🔥 모달 레이어들
          ===================================================================== */}
      {/* 1. 길드원 조회 모달 */}
      {showGuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border-2 border-indigo-500/50 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.2)] w-full max-w-sm overflow-hidden flex flex-col relative">
            <div className="flex justify-between items-center bg-indigo-900/30 p-4 border-b border-indigo-900/50">
              <h3 className="font-bold text-white flex items-center gap-2">🔍 {selectedContent.name} 미클리어 현황</h3>
              <button onClick={() => setShowGuildModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[300px] custom-scrollbar space-y-2">
              <p className="text-[11px] text-zinc-400 mb-3">이번 주 아직 해당 컨텐츠를 완료하지 않은 길드원입니다. 파티에 초대해보세요!</p>
              {GUILD_MEMBERS.map((member, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${member.done ? 'bg-zinc-900/50 border-zinc-800 opacity-50' : 'bg-[#252528] border-zinc-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{JOB_ICONS[member.job]}</span>
                    <div>
                      <span className={`text-sm font-bold block ${member.done ? 'text-zinc-500' : 'text-white'}`}>{member.name}</span>
                      <span className="text-[10px] text-zinc-400">전투력: {member.cp.toLocaleString()}</span>
                    </div>
                  </div>
                  {member.done ? (
                    <span className="text-[10px] font-bold text-emerald-600 border border-emerald-900 bg-emerald-900/20 px-2 py-1 rounded">완료됨</span>
                  ) : (
                    <button className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition">
                      초대 알림
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. 애드벌룬 알림 */}
      {alertStatus === "balloon" && (
        <div onClick={() => setAlertStatus("popup")} className="fixed bottom-8 right-8 z-50 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(5,150,105,0.5)] cursor-pointer transition-transform hover:scale-110 flex items-center gap-3">
          <span className="text-xl animate-bounce">🎉</span>
          <div className="flex flex-col pr-2">
            <span className="text-[10px] font-black tracking-widest opacity-80">MATCH FOUND</span>
            <span className="text-xs font-bold">파티 매칭 성공! 확인하기</span>
          </div>
        </div>
      )}

      {/* 3. 대형 매칭 팝업 */}
      {alertStatus === "popup" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_50px_rgba(5,150,105,0.2)] w-full max-w-lg overflow-hidden flex flex-col relative">
            <button onClick={() => setAlertStatus("balloon")} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"><span className="text-2xl">➖</span></button>
            <div className="bg-emerald-900/30 p-6 text-center border-b border-emerald-900/50">
              <span className="text-4xl block mb-2 animate-bounce">🎉</span>
              <h2 className="text-2xl font-black text-white">파티 매칭이 되었습니다!</h2>
            </div>
            <div className="p-4 bg-[#252528] flex gap-3">
              <button onClick={() => setAlertStatus("hidden")} className="flex-1 bg-[#121212] border border-zinc-700 text-zinc-400 font-bold py-3 rounded-xl transition">거절</button>
              <button onClick={() => { alert("수락 완료!"); setAlertStatus("hidden"); }} className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition">수락</button>
            </div>
          </div>
        </div>
      )}

      {/* 커스텀 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}