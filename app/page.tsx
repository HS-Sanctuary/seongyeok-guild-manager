"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

const ALL_CLASSES = Object.keys(JOB_ICONS);
const DAILY_ITEMS = ["일일 미션", "일일 검은 구멍", "요일 던전", "일일 아르바이트", "심층 던전"];
const WEEKLY_ITEMS = ["심층 던전 (매우 어려움)", "멤버십 주간 아르바이트", "필드 보스"];

const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [topRankers, setTopRankers] = useState<any[]>([]);
  const [stats, setStats] = useState({ daily: 0, weekly: 0, uniqueAccounts: 0 });
  const [allRounderLevel, setAllRounderLevel] = useState(0);

  const [partyMatches] = useState([
    { id: 1, title: "[4종] 어비스 매칭", desc: "초보자도 환영! 함께 공략해요.", leader: "파랑", members: 2, max: 4, role: "딜러/힐러" },
    { id: 2, title: "주말 카브락 레이드", desc: "클리어 목적 빡숙팟 구합니다.", leader: "춘법", members: 6, max: 8, role: "도적/기사" }
  ]);
  
  const [journal] = useState([
    { id: 1, text: "이번달 도우미 칭호를 획득했습니다.", date: "어제" },
    { id: 2, text: "한설님이 파티 매칭에 참여했습니다.", date: "어제" }
  ]);

  const fetchDashboardData = async () => {
    const { data: allChars } = await supabase.from('characters').select('*');
    if (!allChars) return;

    const uniqueAccountCount = 1; 

    let totalDaily = 0; let totalWeekly = 0;
    allChars.forEach(char => {
      totalDaily += ((char.daily_checks?.length || 0) / DAILY_ITEMS.length) * 100;
      totalWeekly += ((char.weekly_checks?.normal?.length || 0) / WEEKLY_ITEMS.length) * 100;
    });
    
    setStats({
      uniqueAccounts: uniqueAccountCount,
      daily: allChars.length ? Math.round(totalDaily / allChars.length) : 0,
      weekly: allChars.length ? Math.round(totalWeekly / allChars.length) : 0
    });

    const myChars = allChars.filter(char => MY_ACCOUNT_CHARACTERS.includes(char.nickname));
    myChars.sort((a, b) => a.nickname === user?.nickname ? -1 : b.nickname === user?.nickname ? 1 : 0);
    setMyCharacters(myChars);

    let maxLevelSum = 0;
    ALL_CLASSES.forEach(cls => {
      let maxLvlForClass = 1;
      myChars.forEach(char => {
        if (char.levels && char.levels[cls]) {
          maxLvlForClass = Math.max(maxLvlForClass, Number(char.levels[cls]));
        }
      });
      maxLevelSum += maxLvlForClass;
    });
    setAllRounderLevel(maxLevelSum);

    const sortedRankers = [...allChars].sort((a, b) => {
      const cpA = Number(String(a.combat_power || "0").replace(/,/g, ''));
      const cpB = Number(String(b.combat_power || "0").replace(/,/g, ''));
      return cpB - cpA;
    });
    setTopRankers(sortedRankers.slice(0, 3));
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-10">
      
      {/* GNB 미니 헤더 */}
      <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide"><span>🏰 Sanctuary Nexus</span></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#121212] border border-zinc-600 flex items-center justify-center text-sm shadow-inner">
            {JOB_ICONS[user.job || "기사"] || "👦🏻"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-white text-sm">{user.nickname}</span>
            <span className="text-[10px] text-zinc-400">{user.role || "마스터"}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        
        {/* 대시보드 타이틀 */}
        <header className="flex items-center gap-6 mb-2">
          <div className="w-28 h-28 md:w-36 md:h-36 bg-[#121212] border border-yellow-600/30 rounded-lg flex items-center justify-center shadow-2xl relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent"></div>
            <div className="z-10 text-white font-black border-2 border-white px-2 py-1 tracking-widest text-[10px] md:text-xs shadow-lg backdrop-blur-sm">Nexus</div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-[#e6c788] drop-shadow-md">Sanctuary Nexus</h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-2 tracking-wide font-medium">데이안 성역 길드 전용 <span className="text-zinc-600 mx-1">|</span> 마비노기 모바일 커맨드 센터</p>
          </div>
        </header>

        {/* 📊 1. 통계 요약 위젯 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg flex flex-col justify-center">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">등록된 길드원 (계정 단위)</p>
            <p className="mt-1 text-2xl md:text-3xl font-black text-white">{stats.uniqueAccounts} <span className="text-sm font-normal text-zinc-500">명</span></p>
          </div>
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">평균 일일 달성률</p>
            <p className="mt-1 text-2xl md:text-3xl font-black text-amber-400">{stats.daily}%</p>
          </div>
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">평균 주간 달성률</p>
            <p className="mt-1 text-2xl md:text-3xl font-black text-blue-400">{stats.weekly}%</p>
          </div>
          <div className="rounded-xl border border-yellow-600/30 bg-[#252528] p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-6xl opacity-5">⚡</div>
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">올라운더 달성률</p>
            <p className="mt-1 text-2xl md:text-3xl font-black text-[#e6c788]">{allRounderLevel} <span className="text-sm font-normal text-zinc-500">/ 1205</span></p>
          </div>
        </section>

        {/* 📋 2. 캐릭터 숙제 체크보드 (확장형 2단 그리드 적용) */}
        <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-700/50 pb-3">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">📋 캐릭터 숙제 체크보드</h2>
              <p className="text-[11px] text-zinc-400 mt-1">계정 내 모든 캐릭터의 핵심 스탯과 주간 숙제를 한눈에 관리하세요.</p>
            </div>
            <button onClick={() => router.push('/character')} className="text-xs bg-[#e6c788] text-[#121212] font-black px-3 py-1.5 rounded hover:bg-yellow-500 transition shadow">캐릭터 관리</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {myCharacters.map((char) => {
              const dRate = Math.round(((char.daily_checks?.length || 0) / DAILY_ITEMS.length) * 100);
              const wRate = Math.round(((char.weekly_checks?.normal?.length || 0) / WEEKLY_ITEMS.length) * 100);
              
              const isHeosang = char.raid_checks?.includes("어비스 - 허상의 정박지");
              const isDonggul = char.raid_checks?.includes("어비스 - 광기의 동굴");
              const isMulgil = char.raid_checks?.includes("어비스 - 흩어진 물길");
              const isWkndAbyss = char.raid_checks?.includes("주말에는 어비스");
              const abyssCount = [isHeosang, isDonggul, isMulgil, isWkndAbyss].filter(Boolean).length;

              const isKab = char.raid_checks?.includes("레이드 - 카브락");
              const isArel = char.raid_checks?.includes("레이드 - 에이렐");
              const isWhite = char.raid_checks?.includes("레이드 - 화이트 서큐버스");
              const isWkndRaid = char.raid_checks?.includes("주말에는 레이드");
              const raidCount = [isKab, isArel, isWhite, isWkndRaid].filter(Boolean).length;

              return (
                <div key={char.id} onClick={() => router.push('/character')} className="bg-[#1c1c1e] border border-zinc-700/50 rounded-xl p-4 cursor-pointer hover:border-[#e6c788]/60 transition shadow-md flex flex-col gap-3 group">
                  
                  {/* 헤더 */}
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <span className="text-base bg-[#121212] p-1.5 rounded-lg border border-zinc-700 shadow-inner group-hover:border-[#e6c788]/50 transition">{JOB_ICONS[char.job] || "👤"}</span>
                    <span className="font-black text-white text-[15px] truncate">{char.nickname}</span>
                  </div>

                  {/* 일일/주간 프로그레스 */}
                  <div className="space-y-2 text-[10px] font-bold">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1"><span>일일 숙제</span><span className="text-amber-400 font-mono">{dRate}%</span></div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden"><div className="bg-amber-500 h-full transition-all" style={{ width: `${dRate}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1"><span>주간 숙제</span><span className="text-blue-400 font-mono">{wRate}%</span></div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{ width: `${wRate}%` }}></div></div>
                    </div>
                  </div>

                  {/* 🟢 요청하신 2단 분할 뱃지 위젯 (확장성 완벽 대응) */}
                  <div className="flex flex-col gap-1.5 bg-[#121212] p-2 rounded-lg border border-zinc-800">
                    
                    {/* 어비스 체크박스 라인 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-500">어비스</span>
                      <div className="flex gap-1.5 text-[9px] font-black">
                        <span className={isHeosang ? "text-emerald-400" : "text-zinc-600"}>허상</span>
                        <span className={isDonggul ? "text-emerald-400" : "text-zinc-600"}>동굴</span>
                        <span className={isMulgil ? "text-emerald-400" : "text-zinc-600"}>물길</span>
                        <span className={isWkndAbyss ? "text-emerald-400" : "text-zinc-600"}>주말</span>
                      </div>
                    </div>
                    <div className="w-full text-center py-0.5 rounded text-[9px] font-black bg-zinc-900 border border-zinc-800">
                      {abyssCount === 4 ? <span className="text-emerald-400">어비스 4종 완료</span> : <span className="text-zinc-500">미완료 ({abyssCount}/4)</span>}
                    </div>

                    <div className="border-t border-zinc-800/80 my-0.5"></div>

                    {/* 레이드 체크박스 라인 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-500">레이드</span>
                      <div className="flex gap-1.5 text-[9px] font-black">
                        <span className={isKab ? "text-indigo-400" : "text-zinc-600"}>카브</span>
                        <span className={isArel ? "text-indigo-400" : "text-zinc-600"}>에렐</span>
                        <span className={isWhite ? "text-indigo-400" : "text-zinc-600"}>화섴</span>
                        <span className={isWkndRaid ? "text-indigo-400" : "text-zinc-600"}>주말</span>
                      </div>
                    </div>
                    <div className="w-full text-center py-0.5 rounded text-[9px] font-black bg-zinc-900 border border-zinc-800">
                      {raidCount === 4 ? <span className="text-indigo-400">레이드 4종 완료</span> : <span className="text-zinc-500">미완료 ({raidCount}/4)</span>}
                    </div>
                  </div>

                  {/* 풀네임 4대 스탯 */}
                  <div className="flex flex-col gap-1 text-[11px] mt-auto pt-1">
                    <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">전투력</span><span className="font-mono text-[#e6c788] font-bold">{Number(char.combat_power||0).toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">마도저항</span><span className="font-mono text-purple-300 font-bold">{Number(char.magic_resistance||0).toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">생활력</span><span className="font-mono text-emerald-300 font-bold">{Number(char.life_energy||0).toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">매력</span><span className="font-mono text-pink-300 font-bold">{Number(char.charm||0).toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ⚔️ 실시간 파티 매칭 현황 (가로 전체 확장) */}
        <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-5 shadow-lg w-full flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700/50">
            <div>
              <h2 className="text-white font-bold text-sm">⚔️ 실시간 파티 매칭 현황</h2>
              <p className="text-[11px] text-zinc-400 mt-1">접속 중인 길드원들과 빠르게 파티를 꾸려보세요!</p>
            </div>
            <button onClick={() => router.push('/party')} className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-3 py-1.5 rounded hover:text-white transition border border-zinc-700">매칭 게시판</button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {partyMatches.map((match) => (
              <div key={match.id} className="rounded-xl border border-zinc-700/80 bg-[#1c1c1e] p-4 flex flex-col gap-2 hover:border-[#e6c788]/40 transition">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-black text-white">{match.title}</p>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-2 py-0.5 rounded-full">{match.members}/{match.max}명</span>
                </div>
                <p className="text-[11px] text-zinc-400">{match.desc}</p>
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-medium">파티장 <span className="text-zinc-300 font-bold">{match.leader}</span></span>
                  <span className="text-[10px] text-amber-500 font-bold bg-amber-900/20 px-2 py-1 rounded">필요: {match.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4단 분할: 랭킹 & 성역 넥서스 저널 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* 🏆 성역 명예의 전당 */}
          <section className="lg:col-span-2 bg-[#252528] border border-zinc-700/50 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700/50 pb-3">
              <h2 className="text-white font-bold text-sm">🏆 성역 명예의 전당</h2>
              <button onClick={() => router.push('/ranking')} className="text-[10px] text-zinc-400 font-bold hover:text-white transition">전체 랭킹</button>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 text-center">[이번 주 종합 전투력 순위]</p>
            <div className="space-y-3">
              {topRankers.map((ranker, idx) => (
                <div key={ranker.id} className="flex items-center gap-3 bg-[#1c1c1e] p-3 rounded-xl border border-zinc-700/50">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-900/40 text-yellow-500 border border-yellow-700/50' : idx === 1 ? 'bg-zinc-800 text-zinc-300 border border-zinc-600' : 'bg-amber-900/20 text-amber-600 border border-amber-800/50'}`}>
                    {idx + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#121212] flex items-center justify-center text-sm border border-zinc-700">{JOB_ICONS[ranker.job] || "👤"}</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-bold text-sm text-zinc-200">{ranker.nickname}</span>
                    <span className="font-mono font-bold text-sm text-[#e6c788]">{Number(String(ranker.combat_power||"0").replace(/,/g, '')).toLocaleString()} <span className="text-[9px] text-zinc-500">CP</span></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 📒 성역 넥서스 저널 */}
          <section className="lg:col-span-3 bg-[#252528] border border-zinc-700/50 rounded-xl p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700/50 pb-3">
              <h2 className="text-white font-bold text-sm">📒 성역 넥서스 저널</h2>
              <span className="text-[10px] bg-indigo-900/30 text-indigo-400 border border-indigo-700/50 px-2 py-1 rounded font-bold">활동 포인트 1,250 획득</span>
            </div>
            
            <div className="flex gap-4 flex-col sm:flex-row flex-1">
              <div className="flex-1 space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 mb-2">최근 내 활동 내역</p>
                {journal.map(entry => (
                  <div key={entry.id} className="bg-[#1c1c1e] p-2.5 rounded-lg border border-zinc-700/50 flex justify-between items-center">
                    <span className="text-xs text-zinc-300">{entry.text}</span>
                    <span className="text-[10px] text-zinc-500">{entry.date}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-xl p-4 flex flex-col">
                <p className="text-[11px] font-bold text-zinc-400 mb-3">🏅 도전 중인 칭호</p>
                
                <div className="flex flex-col gap-3">
                  <div className="bg-[#252528] p-3 rounded-lg border border-dashed border-yellow-600/50 group cursor-help relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-zinc-400 group-hover:text-yellow-500 transition">❓ 파티 메이커</span>
                      <span className="text-[10px] text-zinc-500">6 / 10 회</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-yellow-600 h-full" style={{ width: '60%' }}></div></div>
                  </div>

                  <div className="bg-[#252528] p-3 rounded-lg border border-dashed border-purple-600/50 group cursor-help relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-zinc-400 group-hover:text-purple-500 transition">❓ 그랜드 마스터</span>
                      <span className="text-[10px] text-zinc-500">{allRounderLevel} / 1365 LV</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-purple-600 h-full" style={{ width: `${Math.min((allRounderLevel/1365)*100, 100)}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}