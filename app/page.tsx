"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { calculateOptimalStartTime, isScheduleConflict, pickRandomLeader } from "../lib/matchingUtils";

interface DeepHole {
  id: string;
  zone: string; 
  channel: string; 
  reporter_name: string;
  reported_at: string;
}

interface AbyssReport {
  id: string;
  reporter_name: string;
  channel: string; 
  hole_time: string; 
  status: 'pending' | 'approved' | 'rejected';
}

const HUNTING_ZONES = [
  { uid: 'hz_001', name: '창백한 산', isActive: true, theme: 'emerald' },
  { uid: 'hz_002', name: '센마이 평원', isActive: true, theme: 'red' },
  { uid: 'hz_003', name: '미개방 지역 1', isActive: false, theme: 'blue' },
  { uid: 'hz_004', name: '미개방 지역 2', isActive: false, theme: 'purple' },
];

function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':');
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      <div onClick={() => setIsOpen(!isOpen)} className={`relative z-50 bg-[#121212] border ${isOpen ? 'border-[#e6c788]' : 'border-zinc-700'} hover:border-zinc-500 rounded p-2 text-[0.8rem] font-bold text-white cursor-pointer text-center transition flex justify-center items-center gap-1`}>
        <span>{h}:{m}</span>
        <span className={`text-[0.6rem] text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-[#e6c788]' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[140px] bg-[#1c1c1e] border border-zinc-600 rounded-lg shadow-2xl z-50 p-2 flex gap-2">
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button key={hour} onClick={() => onChange(`${hour}:${m}`)} className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${h === hour ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{hour}시</button>
            ))}
          </div>
          <div className="w-px bg-zinc-700"></div>
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button key={minute} onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${m === minute ? 'bg-yellow-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{minute}분</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const JOB_ICONS: Record<string, string> = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

const ALL_CLASSES = Object.keys(JOB_ICONS);

const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-400 bg-purple-400/10 border-purple-500/50",
  "어려움": "text-yellow-400 bg-yellow-400/10 border-yellow-500/50",
  "매우 어려움": "text-red-500 bg-red-500/10 border-red-500/50",
  "지옥 1": "text-rose-400 bg-rose-900/40 border-rose-600/50"
};

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [allCharactersMap, setAllCharactersMap] = useState<Record<string, string>>({});
  const [topRankers, setTopRankers] = useState<any[]>([]);
  
  const [uniqueAccountsCount, setUniqueAccountsCount] = useState(1);
  const [totalCharactersCount, setTotalCharactersCount] = useState(0);
  const [allRounderLevel, setAllRounderLevel] = useState(0);

  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [abyssList, setAbyssList] = useState<any[]>([]);
  const [raidList, setRaidList] = useState<any[]>([]);
  const [activeParties, setActiveParties] = useState<any[]>([]);
  
  const [barrierEvent, setBarrierEvent] = useState({ status: 'waiting', sec: 0 });
  const [fieldBossEvent, setFieldBossEvent] = useState({ status: 'waiting', sec: 0 });
  
  const [deepTimer, setDeepTimer] = useState("00:00");
  const [abyssDisplay, setAbyssDisplay] = useState({ status: 'waiting', text: "데이터 로딩 중...", time: "계산 중", isDefault: false });

  const [isDeepModalOpen, setIsDeepModalOpen] = useState(false);
  const [isAbyssModalOpen, setIsAbyssModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [deepHoles, setDeepHoles] = useState<DeepHole[]>([]);
  const [deepZoneUID, setDeepZoneUID] = useState<string>('hz_001');
  const [deepCount, setDeepCount] = useState('0');

  const [abyssReports, setAbyssReports] = useState<AbyssReport[]>([]);
  const [abyssMins, setAbyssMins] = useState(''); 

  const [joinPopupParty, setJoinPopupParty] = useState<any>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [detailModalParty, setDetailModalParty] = useState<any>(null);

  const [journal] = useState([
    { id: 1, text: "이번달 도우미 칭호를 획득했습니다.", date: "어제" },
    { id: 2, text: "길드원이 파티 매칭에 참여했습니다.", date: "어제" }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const m = now.getMinutes();
      const s = now.getSeconds();

      let bStatus = 'waiting';
      let bSec = 0;
      if (m < 2) {
        bStatus = 'imminent';
        bSec = (1 * 60 + 59) - (m * 60 + s); 
      } else if (m >= 2 && m < 4) {
        bStatus = 'active';
        bSec = (3 * 60 + 59) - (m * 60 + s); 
      } else {
        bStatus = 'waiting';
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        bSec = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
      }
      setBarrierEvent({ status: bStatus, sec: bSec });

      const bossTimes = [12, 18, 20, 22];
      let fStatus = 'waiting';
      let fSec = 0;
      let nextBossTime = null;
      let currentBossTime = null;
      
      for (let hour of bossTimes) {
        const bossStart = new Date(now);
        bossStart.setHours(hour, 0, 0, 0);
        const bossImminent = new Date(bossStart.getTime() - 2 * 60000);
        const bossEnd = new Date(bossStart.getTime() + 30 * 60000);
        
        if (now >= bossImminent && now < bossStart) {
          fStatus = 'imminent';
          fSec = Math.floor((bossStart.getTime() - now.getTime()) / 1000);
          currentBossTime = bossStart;
          break;
        } else if (now >= bossStart && now < bossEnd) {
          fStatus = 'active';
          fSec = Math.floor((bossEnd.getTime() - now.getTime()) / 1000);
          currentBossTime = bossStart;
          break;
        } else if (now < bossImminent && !nextBossTime) {
          nextBossTime = bossStart;
        }
      }
      
      if (!currentBossTime) {
        fStatus = 'waiting';
        if (!nextBossTime) {
          nextBossTime = new Date(now);
          nextBossTime.setDate(now.getDate() + 1);
          nextBossTime.setHours(bossTimes[0], 0, 0, 0);
        }
        fSec = Math.floor((nextBossTime.getTime() - now.getTime()) / 1000);
      }
      setFieldBossEvent({ status: fStatus, sec: fSec });

      const nextDeepReset = new Date(now);
      if (now.getMinutes() < 30) nextDeepReset.setMinutes(30, 0, 0);
      else nextDeepReset.setHours(now.getHours() + 1, 0, 0, 0);
      
      const deepDiff = nextDeepReset.getTime() - now.getTime();
      const dM = Math.floor(deepDiff / 1000 / 60).toString().padStart(2, '0');
      const dS = Math.floor((deepDiff / 1000) % 60).toString().padStart(2, '0');
      setDeepTimer(`${dM}:${dS}`);

      updateAbyssDisplay(now.getTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [abyssReports]);

  const formatSecondsToMMSS = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updateAbyssDisplay = (nowMs: number) => {
    const HOLE_DURATION = 15 * 60 * 1000; 
    const IMMINENT_DURATION = 2 * 60 * 1000;

    const validReports = abyssReports
      .filter(r => r.status === 'approved')
      .filter(r => (new Date(r.hole_time).getTime() + HOLE_DURATION) > nowMs)
      .sort((a, b) => new Date(b.hole_time).getTime() - new Date(a.hole_time).getTime());
    
    if (validReports.length > 0) {
      const latest = validReports[0];
      const targetTime = new Date(latest.hole_time).getTime();
      const diffMs = targetTime - nowMs;

      if (diffMs > 0 && diffMs <= IMMINENT_DURATION) {
        setAbyssDisplay({ status: 'imminent', text: '출현 임박!', time: `제보자: ${latest.reporter_name}`, isDefault: false });
      } else if (diffMs <= 0 && diffMs > -HOLE_DURATION) {
        setAbyssDisplay({ status: 'active', text: '현재 출현중!!', time: `제보자: ${latest.reporter_name}`, isDefault: false });
      } else {
        const diffSec = Math.floor(diffMs / 1000);
        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);
        setAbyssDisplay({ status: 'waiting', text: `${h > 0 ? h + '시간 ' : ''}${m}분 뒤 진행`, time: `제보자: ${latest.reporter_name}`, isDefault: false });
      }
    } else {
      const baseCycle = (36 * 3600) + (15 * 60); 
      const epoch = new Date('2024-01-01T00:00:00Z').getTime() / 1000;
      const currentSec = nowMs / 1000;
      const elapsed = currentSec - epoch;
      const nextSpawnSec = baseCycle - (elapsed % baseCycle);
      
      const h = Math.floor(nextSpawnSec / 3600);
      const m = Math.floor((nextSpawnSec % 3600) / 60);

      setAbyssDisplay({ 
        status: 'waiting',
        text: `${h}시간 ${m}분 뒤 출현`, 
        time: "점검 등으로 인해 변경 사항이 생기면 제보해 주세요.", 
        isDefault: true 
      });
    }
  };

  const fetchDashboardData = async (currentUser: any) => {
    const [charRes, taskRes, contRes, partyRes, deepRes, abyssRes] = await Promise.all([
      supabase.from('characters').select('*'),
      supabase.from('nexus_tasks').select('*').eq('is_active', true),
      supabase.from('nexus_contents').select('*').eq('is_active', true),
      supabase.from('parties').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('deep_holes').select('*').order('reported_at', { ascending: false }).limit(20),
      supabase.from('abyss_reports').select('*').order('hole_time', { ascending: false }).limit(10)
    ]);
    
    if (deepRes.data) setDeepHoles(deepRes.data);
    if (abyssRes.data) setAbyssReports(abyssRes.data);

    if (charRes.data) {
      const allChars = charRes.data;
      
      setTotalCharactersCount(allChars.length);
      const uniqueOwners = new Set(allChars.map((c: any) => c.owner).filter(Boolean));
      setUniqueAccountsCount(Math.max(1, uniqueOwners.size));

      const jobMap: Record<string, string> = {};
      allChars.forEach(c => { jobMap[c.nickname] = c.job || "전사"; });
      setAllCharactersMap(jobMap);
      
      const sortedTasks = taskRes.data?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
      const sortedContents = contRes.data?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];

      setDailyTasks(sortedTasks.filter(t => t.type === 'daily'));
      setWeeklyTasks(sortedTasks.filter(t => t.type === 'weekly'));
      setAbyssList(sortedContents.filter(c => c.type === 'abyss'));
      setRaidList(sortedContents.filter(c => c.type === 'raid'));

      const myChars = allChars.filter(char => char.owner === currentUser?.nickname);
      myChars.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
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
    }
    if (partyRes.data) setActiveParties(partyRes.data);
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { 
      router.push("/login"); 
    } else { 
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchDashboardData(parsedUser);
    }
  }, [router]);

  const submitDeepHole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.nickname) return alert('로그인 정보가 없습니다.');
    await supabase.from('deep_holes').insert([{ zone: deepZoneUID, channel: deepCount, reporter_name: user.nickname }]);
    setDeepCount('0'); setIsDeepModalOpen(false); fetchDashboardData(user);
  };

  const submitAbyssHole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.nickname || !abyssMins) return alert('남은 분을 입력해주세요!');
    const targetTime = new Date(Date.now() + Number(abyssMins) * 60000).toISOString();
    await supabase.from('abyss_reports').insert([{ reporter_name: user.nickname, channel: abyssMins, hole_time: targetTime, status: 'pending' }]);
    setAbyssMins(''); setIsAbyssModalOpen(false); fetchDashboardData(user);
  };

  const updateAbyssStatus = async (id: string, newStatus: string) => {
    await supabase.from('abyss_reports').update({ status: newStatus }).eq('id', id);
    fetchDashboardData(user);
  };

  const getActiveDeepHoles = (uid: string) => {
    const now = new Date();
    const lastReset = new Date(now);
    if (now.getMinutes() < 30) lastReset.setMinutes(0, 0, 0);
    else lastReset.setMinutes(30, 0, 0);

    const zoneName = HUNTING_ZONES.find(z => z.uid === uid)?.name;
    return deepHoles.filter(h => (h.zone === uid || h.zone === zoneName) && new Date(h.reported_at) > lastReset);
  };

  const handleDeleteParty = async (id: number) => {
    if (confirm("정말로 이 파티 모집을 취소하시겠습니까?")) {
      await supabase.from('parties').delete().eq('id', id);
      fetchDashboardData(user); 
    }
  };

  const openJoinPopup = (party: any) => {
    setJoinPopupParty(party);
    setJoinSelectedChar(myCharacters.length > 0 ? myCharacters[0].nickname : "");
    if (party.wanted_roles && party.wanted_roles.length > 0) setJoinSelectedRole(party.wanted_roles[0]);
    else setJoinSelectedRole("딜러");
    setJoinTimeStart(party.time_start);
    setJoinTimeEnd(party.time_end);
  };

  const executeJoinParty = async () => {
    if (!joinSelectedChar) return alert("참여할 캐릭터를 선택해주세요!");
    if (!joinSelectedRole) return alert("수행할 포지션을 선택해주세요!");

    try {
      const [partyRes, allActivePartiesRes] = await Promise.all([
        supabase.from('parties').select('*').eq('id', joinPopupParty.id).single(),
        supabase.from('parties').select('*').neq('status', '종료됨')
      ]);
      
      const latestParty = partyRes.data;
      if (!latestParty) return alert("파티를 찾을 수 없습니다.");
      if (latestParty.members.length >= latestParty.max_members) return alert("마감되었습니다!");
      if (latestParty.members.some((m: any) => m.name === joinSelectedChar)) return alert("이미 참여 중입니다!");

      const mySchedules = allActivePartiesRes.data?.filter(p => p.members.some((m: any) => m.name === joinSelectedChar)).map(p => {
          const dur = p.content_name.includes("통합") || p.content_name.includes("3종") ? 45 : 15;
          const myMemInfo = p.members.find((m: any) => m.name === joinSelectedChar);
          const st = p.final_start_time || myMemInfo?.time_start || p.time_start;
          return { start: st, duration: dur };
      }) || [];
      
      const newDur = latestParty.content_name.includes("통합") || latestParty.content_name.includes("3종") ? 45 : 15;
      if (isScheduleConflict(joinTimeStart, newDur, mySchedules)) return alert(`⚠️ [충돌 경고]\n일정이 겹칩니다!`);

      const myJob = allCharactersMap[joinSelectedChar] || "전사";
      const newMember = { name: joinSelectedChar, job: myJob, roles: [joinSelectedRole], time_start: joinTimeStart, time_end: joinTimeEnd };
      const updatedMembers = [...latestParty.members, newMember];

      let updatedWanted = [...(latestParty.wanted_roles || [])];
      const roleIndex = updatedWanted.indexOf(joinSelectedRole);
      if (roleIndex > -1) updatedWanted.splice(roleIndex, 1);

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

      const { error: updateErr } = await supabase.from('parties').update(updatePayload).eq('id', joinPopupParty.id);
      if (updateErr) throw updateErr;

      alert(updatePayload.status === "모집완료" ? "🎉 파티 매칭 완료!" : "파티 대기열 등록 완료");
      setJoinPopupParty(null);
      fetchDashboardData(user);
    } catch (err) { alert("오류 발생"); }
  };

  const formatName = (fullName: string) => fullName.replace('어비스 - ', '').replace('레이드 - ', '').substring(0, 2);

  let totalAccountCurrent = 0, totalAccountMax = 0;
  myCharacters.forEach(char => {
    const dChecks = Array.isArray(char.daily_checks) ? char.daily_checks.map(Number) : [];
    const wChecks = Array.isArray(char.weekly_checks?.normal) ? char.weekly_checks.normal.map(Number) : [];
    const rChecks = Array.isArray(char.raid_checks) ? char.raid_checks.map(Number) : [];
    totalAccountCurrent += (dailyTasks.filter(t => dChecks.includes(t.id)).length + weeklyTasks.filter(t => wChecks.includes(t.id)).length + abyssList.filter(a => rChecks.includes(a.id)).length + raidList.filter(r => rChecks.includes(r.id)).length);
    totalAccountMax += (dailyTasks.length + weeklyTasks.length + abyssList.length + raidList.length);
  });
  const accountProgressRate = totalAccountMax > 0 ? Math.round((totalAccountCurrent / totalAccountMax) * 100) : 0;

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      
      <div className="p-4 md:p-8 max-w-[1500px] mx-auto space-y-4 md:space-y-6">
        
        {/* 상단 6대 알리미 위젯 (모바일 2x3 그리드 및 컴팩트 높이 최적화) */}
        <section className="space-y-2">
          <div className="flex justify-end items-center px-1">
            <span className="text-[0.6rem] md:text-[0.65rem] text-zinc-500 font-medium flex items-center gap-1.5 bg-[#1c1c1e] px-2.5 py-1 rounded-full border border-zinc-800 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              심층 및 어비스 구멍 출현시간 제보 시 모두에게 공유됩니다!!
            </span>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-6 gap-2 md:gap-3">
            
            {/* 1. 🌟 Sanctuary ASTRA 통합 박스 (링크 /lounge/astra 고정 및 콤팩트 디자인) */}
            <div 
              onClick={() => router.push('/lounge')}
              className="rounded-xl border border-yellow-600/30 bg-[#1c1c1e] p-3 flex flex-col justify-between relative overflow-hidden shadow-lg order-1 cursor-pointer hover:border-yellow-500 transition group h-[115px]"
            >
              <div className="absolute -right-4 -bottom-4 text-5xl opacity-5 group-hover:scale-110 transition-transform">✨</div>
              
              <div>
                <span className="text-[0.55rem] uppercase tracking-[0.15em] text-[#e6c788] font-black block truncate">Sanctuary ASTRA</span>
                <p className="text-[0.6rem] text-zinc-400 font-bold mt-0.5 truncate">성역에 새겨진 모든 별들</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                <div className="flex flex-col">
                  <span className="text-[0.55rem] uppercase font-bold text-amber-400 tracking-wider">SOL</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg md:text-xl font-black text-white cursor-help" title="등록된 계정 수">{uniqueAccountsCount}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[0.55rem] uppercase font-bold text-blue-400 tracking-wider">LUNA</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg md:text-xl font-black text-white cursor-help" title="등록된 캐릭터 수">{totalCharactersCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ⚡ 올라운더 달성률 */}
            <div className="rounded-xl border border-yellow-600/30 bg-[#1c1c1e] p-3 flex flex-col justify-center relative overflow-hidden shadow-lg order-2 h-[115px]">
              <div className="absolute -right-4 -bottom-4 text-5xl opacity-5">⚡</div>
              <p className="text-[0.55rem] uppercase tracking-[0.1em] text-zinc-500 font-bold truncate">올라운더 달성률</p>
              <div className="my-auto py-0.5 flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-black text-[#e6c788] leading-none">{allRounderLevel}</span>
                <span className="text-[0.65rem] font-bold text-zinc-500">LV</span>
              </div>
              <p className="text-[0.55rem] text-zinc-500 truncate">최대 1365 LV</p>
            </div>

            {/* 3. 필드보스 알림 */}
            <div className={`rounded-xl p-3 flex flex-col justify-between relative transition-all duration-500 order-3 h-[115px] ${fieldBossEvent.status === 'imminent' ? 'bg-orange-900/40 border-2 border-orange-500 animate-pulse shadow-[0_0_25px_rgba(249,115,22,0.4)]' : fieldBossEvent.status === 'active' ? 'bg-orange-950/60 border border-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-[#1c1c1e] border border-zinc-700/50 shadow-lg'}`}>
              <p className={`text-[0.55rem] font-bold whitespace-nowrap ${fieldBossEvent.status === 'waiting' ? 'text-orange-500/80' : 'text-orange-300'}`}>필드보스 알림</p>
              <div className="my-auto py-0.5 flex flex-col">
                <span className={`text-lg md:text-xl font-black leading-tight whitespace-nowrap ${fieldBossEvent.status === 'waiting' ? 'text-orange-100' : 'text-white'}`}>
                  {fieldBossEvent.status === 'imminent' ? '출현 임박!' : fieldBossEvent.status === 'active' ? '출현중!' : formatSecondsToMMSS(fieldBossEvent.sec)}
                </span>
                {fieldBossEvent.status === 'waiting' && <span className="text-[0.55rem] text-zinc-500 font-bold mt-0.5 whitespace-nowrap">다음 출현까지</span>}
              </div>
              <p className="text-[0.55rem] text-zinc-500 truncate">{fieldBossEvent.status === 'active' ? '지도에서 위치 확인' : '12, 18, 20, 22시'}</p>
            </div>

            {/* 4. 소환의 결계 알림 */}
            <div className={`rounded-xl p-3 flex flex-col justify-between relative transition-all duration-500 order-4 h-[115px] ${barrierEvent.status === 'imminent' ? 'bg-amber-900/40 border-2 border-amber-500 animate-pulse shadow-[0_0_25px_rgba(245,158,11,0.4)]' : barrierEvent.status === 'active' ? 'bg-rose-950/60 border border-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-[#1c1c1e] border border-zinc-700/50 shadow-lg'}`}>
              <p className={`text-[0.55rem] font-bold whitespace-nowrap ${barrierEvent.status === 'waiting' ? 'text-amber-500/80' : 'text-amber-300'}`}>소환의 결계 알림</p>
              <div className="my-auto py-0.5 flex flex-col">
                <span className={`text-lg md:text-xl font-black leading-tight whitespace-nowrap ${barrierEvent.status === 'waiting' ? 'text-amber-100' : 'text-white'}`}>
                  {barrierEvent.status === 'imminent' ? '곧 출현!' : barrierEvent.status === 'active' ? '출현중!' : formatSecondsToMMSS(barrierEvent.sec)}
                </span>
                {barrierEvent.status === 'waiting' && <span className="text-[0.55rem] text-zinc-500 font-bold mt-0.5 whitespace-nowrap">다음 출현까지</span>}
              </div>
              <p className="text-[0.55rem] text-zinc-500 truncate">{barrierEvent.status === 'active' ? '몬스터 등장 중' : '매 정각 실시간 타이머'}</p>
            </div>

            {/* 5. 어비스 구멍 알림 */}
            <div className={`rounded-xl p-3 flex flex-col justify-between relative transition-all duration-500 order-5 h-[115px] ${abyssDisplay.status === 'imminent' ? 'bg-purple-900/60 border-2 border-purple-400 animate-pulse shadow-[0_0_25px_rgba(168,85,247,0.5)]' : abyssDisplay.status === 'active' ? 'bg-fuchsia-950/60 border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-[#1a1625] border border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.05)]'}`}>
              <div className="flex justify-between items-start mb-0.5">
                <p className={`text-[0.55rem] font-bold whitespace-nowrap ${abyssDisplay.status === 'waiting' ? 'text-purple-400' : 'text-purple-300'}`}>어비스 구멍 알림</p>
                <button onClick={() => setIsAbyssModalOpen(true)} className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[0.55rem] px-1.5 py-0.5 rounded border border-purple-700/50 transition font-bold shadow whitespace-nowrap">
                  제보하기
                </button>
              </div>
              <div className="flex flex-col my-auto">
                <span className={`text-sm md:text-base font-black ${abyssDisplay.isDefault ? 'text-zinc-400' : 'text-purple-100'} tracking-tight truncate`}>{abyssDisplay.text}</span>
                <span className="text-[0.55rem] text-purple-300/60 font-bold mt-0.5 truncate">{abyssDisplay.time}</span>
              </div>
            </div>

            {/* 6. 심층 구멍 알림 (우측 배치 정렬) */}
            <div className="bg-[#201515] border border-red-900/50 rounded-xl p-3 flex flex-col justify-between relative shadow-[0_0_15px_rgba(239,68,68,0.05)] order-6 h-[115px]">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[0.55rem] font-bold text-red-400 whitespace-nowrap">심층 구멍 알림</p>
                <div className="flex items-center gap-1">
                  <span className="text-[0.5rem] text-red-300/60 font-mono whitespace-nowrap">{deepTimer} 초기화</span>
                  <button onClick={() => setIsDeepModalOpen(true)} className="bg-red-900/40 hover:bg-red-800 text-red-300 text-[0.55rem] px-1.5 py-0.5 rounded border border-red-700/50 transition font-bold shadow whitespace-nowrap">
                    제보
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 my-auto">
                {HUNTING_ZONES.filter(z => z.isActive).map(zone => {
                  const activeHole = getActiveDeepHoles(zone.uid)[0];
                  const colorClass = zone.theme === 'emerald' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/40 text-red-400';
                  return (
                    <div key={zone.uid} className="flex flex-col justify-center items-center bg-[#121212] border border-zinc-800 p-1 rounded-lg text-center gap-0.5">
                      <span className="text-[0.55rem] text-zinc-300 font-bold leading-tight truncate w-full">{zone.name}</span>
                      <span className={`text-[0.55rem] w-full py-0.5 rounded font-bold whitespace-nowrap ${activeHole && activeHole.channel !== '0' ? colorClass : 'bg-zinc-800 text-zinc-400'}`}>
                        {activeHole ? `${activeHole.channel}개` : '대기'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* 캐릭터 숙제 체크보드 */}
        <section className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 md:p-5 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-5 border-b border-zinc-800 pb-3 md:pb-4 gap-3 md:gap-4">
            <div className="flex-none">
              <h2 className="text-white font-bold text-sm md:text-base flex items-center gap-2">📋 캐릭터 숙제 체크보드</h2>
              <p className="text-[0.65rem] md:text-[0.7rem] text-zinc-400 mt-1">계정 내 모든 캐릭터의 핵심 스탯과 주간 숙제를 한눈에 관리하세요.</p>
            </div>

            <div className="flex-1 w-full px-0 md:px-8 max-w-2xl">
               <div className="flex justify-between items-center text-[0.65rem] md:text-[0.7rem] font-bold mb-1.5">
                  <span className="text-zinc-400">계정 통합 달성률</span>
                  <span className="text-[#e6c788] text-[0.75rem] font-black">{accountProgressRate}%</span>
               </div>
               <div className="w-full bg-[#121212] border border-zinc-700/50 h-2 md:h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-yellow-600 to-[#e6c788] h-full transition-all duration-700" style={{ width: `${accountProgressRate}%` }}></div>
               </div>
            </div>
            <button onClick={() => router.push('/character')} className="w-full md:w-auto text-[0.75rem] bg-[#e6c788] text-[#121212] font-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition shadow">캐릭터 관리</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
            {myCharacters.length === 0 ? (
              <div className="col-span-full text-center py-8 text-zinc-500 text-xs">등록된 캐릭터가 없습니다. '캐릭터 관리'에서 캐릭터를 등록해주세요!</div>
            ) : (
              myCharacters.map((char) => {
                const dChecks = Array.isArray(char.daily_checks) ? char.daily_checks.map(Number) : [];
                const wChecks = Array.isArray(char.weekly_checks?.normal) ? char.weekly_checks.normal.map(Number) : [];
                const rChecks = Array.isArray(char.raid_checks) ? char.raid_checks.map(Number) : [];
                const dRate = Math.round((dailyTasks.filter(t => dChecks.includes(t.id)).length / (dailyTasks.length || 1)) * 100);
                const wRate = Math.round((weeklyTasks.filter(t => wChecks.includes(t.id)).length / (weeklyTasks.length || 1)) * 100);
                const abyssCount = abyssList.filter(a => rChecks.includes(a.id)).length;
                const raidCount = raidList.filter(r => rChecks.includes(r.id)).length;

                return (
                  <div key={char.id} onClick={() => router.push(`/character?char=${encodeURIComponent(char.nickname)}`)} className="bg-[#252528] border border-zinc-700/50 rounded-xl p-2.5 md:p-4 cursor-pointer hover:border-[#e6c788]/60 transition shadow-md flex flex-col gap-2 md:gap-3 group">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-1.5 md:gap-2 truncate">
                        <span className="text-sm md:text-base bg-[#121212] p-1.5 rounded-lg border border-zinc-700 group-hover:border-[#e6c788]/50 transition">{JOB_ICONS[char.job] || "👤"}</span>
                        <span className="font-black text-white text-[0.8rem] md:text-[0.9rem] truncate">{char.nickname}</span>
                      </div>
                      {char.is_main && (
                        <span className="text-[0.6rem] bg-[#e6c788] text-black font-black px-1.5 py-0.5 rounded shrink-0 hidden sm:block">대표</span>
                      )}
                    </div>
                    <div className="space-y-1.5 md:space-y-2 text-[0.65rem] font-bold">
                      <div>
                        <div className="flex justify-between text-zinc-400 mb-1"><span>일일 숙제</span><span className="text-amber-400 font-mono">{Math.min(dRate, 100)}%</span></div>
                        <div className="w-full bg-zinc-800 h-1 md:h-1.5 rounded-full overflow-hidden"><div className="bg-amber-500 h-full transition-all" style={{ width: `${Math.min(dRate, 100)}%` }}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-400 mb-1"><span>주간 숙제</span><span className="text-blue-400 font-mono">{Math.min(wRate, 100)}%</span></div>
                        <div className="w-full bg-zinc-800 h-1 md:h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(wRate, 100)}%` }}></div></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 md:gap-2 bg-[#121212] p-2 md:p-2.5 rounded-lg border border-zinc-800 mt-1">
                      <div className="flex flex-col gap-1 md:gap-1.5">
                        <span className="text-[0.6rem] font-bold text-zinc-500">어비스 ({abyssCount}/{abyssList.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {abyssList.length > 0 ? abyssList.map(a => {
                            const isChecked = rChecks.includes(a.id);
                            const dName = a.short_name || formatName(a.name);
                            return (
                              <span key={a.id} className={`text-[0.6rem] px-1 md:px-1.5 py-0.5 rounded border font-bold transition-colors ${isChecked ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'}`}>
                                {dName}
                              </span>
                            )
                          }) : <span className="text-zinc-600 font-normal text-[0.6rem]">없음</span>}
                        </div>
                      </div>
                      <div className="border-t border-zinc-800/80"></div>
                      <div className="flex flex-col gap-1 md:gap-1.5">
                        <span className="text-[0.6rem] font-bold text-zinc-500">레이드 ({raidCount}/{raidList.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {raidList.length > 0 ? raidList.map(r => {
                            const isChecked = rChecks.includes(r.id);
                            const dName = r.short_name || formatName(r.name);
                            return (
                              <span key={r.id} className={`text-[0.6rem] px-1 md:px-1.5 py-0.5 rounded border font-bold transition-colors ${isChecked ? 'bg-indigo-900/40 text-indigo-400 border-indigo-700/50' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'}`}>
                                {dName}
                              </span>
                            )
                          }) : <span className="text-zinc-600 font-normal text-[0.6rem]">없음</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 실시간 오토 파티 매칭 */}
        <section className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 md:p-5 shadow-lg w-full flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-white font-bold text-sm md:text-base">⚔️ 실시간 오토 파티 매칭</h2>
              <p className="text-[0.65rem] md:text-[0.7rem] text-zinc-400 mt-1">인원이 꽉 차면 시스템이 15분 단위 최적 출발 시간과 파티장을 자동 확정합니다.</p>
            </div>
            <button onClick={() => router.push('/party')} className="text-[0.65rem] bg-[#e6c788] text-[#121212] font-black px-3 py-1.5 rounded hover:bg-yellow-500 transition shadow">전체 게시판</button>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-4 flex-1">
            {activeParties.length === 0 ? (
              <div className="col-span-full flex justify-center items-center py-10 text-zinc-500 font-bold text-[0.75rem]">현재 모집 중인 파티가 없습니다.</div>
            ) : (
              activeParties.map((party) => {
                const isMyParty = party.members.some((m: any) => m.name === user?.nickname || myCharacters.some(c => c.nickname === m.name));
                const isFull = party.members.length >= party.max_members;
                const isOver4 = party.max_members > 4;
                const isCompleted = party.status === "모집완료";

                return (
                  <div key={party.id} className={`rounded-xl border ${party.party_type === '연속 뺑이' ? 'border-rose-900/40' : 'border-zinc-700/80'} ${isCompleted ? 'bg-indigo-900/10 border-indigo-700/50' : 'bg-[#252528]'} p-4 flex flex-col gap-3 shadow-md transition-all`}>
                    <div className="flex justify-between items-start gap-2 border-b border-zinc-700/50 pb-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {isCompleted ? <span className="text-[0.6rem] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow">✅ 매칭완료</span> : <span className="text-[0.6rem] font-black bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-500">대기중</span>}
                          <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[party.difficulty] || "text-zinc-400 bg-zinc-800 border-zinc-600"}`}>{party.difficulty}</span>
                          <span className="text-[0.6rem] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{party.max_members}인팟</span>
                        </div>
                        <p className={`text-[0.9rem] md:text-base font-black ${isCompleted ? 'text-indigo-100' : 'text-white'} leading-tight`}>{party.content_name}</p>
                        <div className="mt-1">
                          {isCompleted ? <span className="text-[0.65rem] bg-yellow-900/40 px-2 py-0.5 rounded text-yellow-400 font-bold border border-yellow-600/50 animate-pulse">⏰ 확정 출발 {party.final_start_time}</span> : <span className="text-[0.65rem] text-[#e6c788] font-mono">⏰ 희망 {party.time_start} ~ {party.time_end}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[0.7rem] font-black text-white bg-[#121212] border border-zinc-700 px-2.5 py-1 rounded-full">{party.members.length} / {party.max_members} 명</span>
                        {isFull ? <button disabled className="text-[0.6rem] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded cursor-not-allowed">모집 마감</button> : <button onClick={() => openJoinPopup(party)} className="text-[0.6rem] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded shadow transition">참여 신청</button>}
                      </div>
                    </div>

                    {party.matching_mode === "조합우선" && party.wanted_roles && party.wanted_roles.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-[#121212] border border-rose-900/30 px-2 py-1.5 rounded-lg">
                        <span className="text-[0.6rem] font-black text-rose-500 animate-pulse">WANTED</span>
                        {party.wanted_roles.map((role: string) => <span key={role} className="text-[0.6rem] font-bold bg-rose-900/40 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700/50">{role}</span>)}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1.5 bg-[#121212] p-2 rounded-lg border border-zinc-800">
                      <div className="flex gap-1.5 overflow-x-auto custom-scrollbar flex-1">
                        {Array.from({ length: isOver4 ? 4 : party.max_members }).map((_, i) => {
                          const m = party.members[i];
                          const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                          return m ? (
                            <div key={i} className={`flex flex-col items-center justify-center border ${isCompleted && party.leader_name === m.name ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-zinc-800 border-zinc-600'} rounded p-1 w-10 h-12 md:w-12 md:h-14 flex-shrink-0 relative`}>
                              <span className="text-[0.7rem] md:text-sm leading-none mb-0.5">{JOB_ICONS[actualJob] || "👤"}</span>
                              <span className="text-[0.5rem] md:text-[0.55rem] text-white truncate w-full text-center font-bold">{m.name}</span>
                              {m.roles && m.roles.length > 0 && <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.45rem] md:text-[0.5rem] text-white rounded-b truncate px-0.5">{m.roles[0]}</span>}
                            </div>
                          ) : (
                            <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-700 rounded p-1 w-10 h-12 md:w-12 md:h-14 flex-shrink-0"><span className="text-[0.5rem] md:text-[0.55rem] text-zinc-600">빈자리</span></div>
                          )
                        })}
                      </div>
                      
                      {isOver4 && (
                        <button onClick={() => setDetailModalParty(party)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 text-[0.6rem] font-bold px-2 py-2 md:px-2.5 md:py-3 rounded flex flex-col items-center justify-center gap-1 transition flex-shrink-0">
                          <span>+보기</span><span className="text-[0.5rem] md:text-[0.55rem] text-zinc-500">({party.members.length}/{party.max_members})</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="text-[0.65rem] text-zinc-500 font-medium flex justify-between items-center pt-1">
                      <span>파티장: <span className="text-zinc-300 font-bold">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
                      {isMyParty && <button onClick={() => handleDeleteParty(party.id)} className="text-[0.6rem] text-red-400 hover:underline">내 파티 취소하기</button>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 랭킹 & 저널 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className="lg:col-span-2 bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 md:p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h2 className="text-white font-bold text-sm md:text-base">🏆 성역 명예의 전당</h2>
              <button onClick={() => router.push('/ranking')} className="text-[0.65rem] text-zinc-400 font-bold hover:text-white transition">전체 랭킹</button>
            </div>
            <p className="text-[0.7rem] text-zinc-500 mb-4 text-center">[이번 주 종합 전투력 순위]</p>
            <div className="space-y-3">
              {topRankers.map((ranker, idx) => (
                <div key={ranker.id} className="flex items-center gap-3 bg-[#252528] p-3 rounded-xl border border-zinc-700/50">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[0.75rem] font-black ${idx === 0 ? 'bg-yellow-900/40 text-yellow-500 border border-yellow-700/50' : idx === 1 ? 'bg-zinc-800 text-zinc-300 border border-zinc-600' : 'bg-amber-900/20 text-amber-600 border border-amber-800/50'}`}>{idx + 1}</div>
                  <div className="w-9 h-9 rounded-full bg-[#121212] flex items-center justify-center text-[0.8rem] border border-zinc-700">{JOB_ICONS[ranker.job] || "👤"}</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-bold text-[0.8rem] md:text-[0.85rem] text-zinc-200">{ranker.nickname}</span>
                    <span className="font-mono font-bold text-[0.8rem] md:text-[0.85rem] text-[#e6c788]">{Number(String(ranker.combat_power||"0").replace(/,/g, '')).toLocaleString()} <span className="text-[0.6rem] text-zinc-500">CP</span></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3 bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 md:p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h2 className="text-white font-bold text-sm md:text-base">📒 SANCTUM 저널</h2>
              <span className="text-[0.65rem] bg-indigo-900/30 text-indigo-400 border border-indigo-700/50 px-2 py-1 rounded font-bold">활동 포인트 1,250 획득</span>
            </div>
            <div className="flex gap-4 flex-col sm:flex-row flex-1">
              <div className="flex-1 space-y-2">
                <p className="text-[0.7rem] font-bold text-zinc-400 mb-2">최근 내 활동 내역</p>
                {journal.map(entry => (
                  <div key={entry.id} className="bg-[#252528] p-2.5 rounded-lg border border-zinc-700/50 flex justify-between items-center">
                    <span className="text-[0.75rem] text-zinc-300">{entry.text}</span><span className="text-[0.65rem] text-zinc-500">{entry.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-[#252528] border border-zinc-700 rounded-xl p-4 flex flex-col">
                <p className="text-[0.7rem] font-bold text-zinc-400 mb-3">🏅 도전 중인 칭호</p>
                <div className="flex flex-col gap-3">
                  <div className="bg-[#1c1c1e] p-3 rounded-lg border border-dashed border-yellow-600/50 group cursor-help relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[0.75rem] font-black text-zinc-400 group-hover:text-yellow-500 transition">❓ 파티 메이커</span><span className="text-[0.65rem] text-zinc-500">6 / 10 회</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-yellow-600 h-full" style={{ width: '60%' }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 모달 영역들 */}
      {isAbyssModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-purple-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-5 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-black text-purple-300">🕳️ 어비스 구멍 제보</h2>
              <button onClick={() => setIsAbyssModalOpen(false)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4 bg-[#1c1c1e]">
              <div className="flex justify-between items-center">
                <span className="text-[0.7rem] font-bold text-zinc-400">신규 제보 입력</span>
                
                {((user?.nickname && ["한설", "수도사는수도사", "신파랑", "제스"].includes(user.nickname)) || 
                  ["길드마스터", "마스터", "부마스터"].includes(user?.role)) && (
                  <label className="flex items-center space-x-2 cursor-pointer bg-[#121212] border border-zinc-700 px-2 py-1 rounded">
                    <input type="checkbox" checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} className="w-3 h-3 accent-purple-500" />
                    <span className="text-[0.65rem] font-bold text-zinc-500">관리자(CBT)</span>
                  </label>
                )}
                
              </div>
              <form onSubmit={submitAbyssHole} className="flex gap-2">
                <input type="text" value={user?.nickname || "로딩중..."} disabled className="w-24 text-[0.75rem] p-2.5 rounded bg-[#121212] border border-zinc-700 text-zinc-500 cursor-not-allowed" />
                <div className="flex-1 relative">
                  <input type="number" placeholder="등장까지 몇분 남았나요?" value={abyssMins} onChange={(e) => setAbyssMins(e.target.value)} className="w-full text-[0.75rem] p-2.5 rounded bg-[#121212] border border-zinc-700 focus:outline-none focus:border-purple-500 text-white pr-8" />
                  <span className="absolute right-3 top-2.5 text-[0.75rem] text-zinc-500 font-bold">분</span>
                </div>
                <button type="submit" className="bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 text-[0.75rem] px-4 rounded font-bold transition border border-purple-700/50">제보</button>
              </form>
              {isAdminMode && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-[0.65rem] font-bold text-zinc-500 mb-2">관리자 승인 대기 목록</h3>
                  <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {abyssReports.filter(r => r.status === 'pending').map((report) => (
                      <div key={report.id} className="bg-[#121212] p-3 rounded-lg border border-zinc-700/50 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[0.75rem] text-purple-200 font-bold">{report.channel}분 후</span>
                          <span className="text-[0.65rem] text-zinc-500">제보: {report.reporter_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateAbyssStatus(report.id, 'approved')} className="bg-emerald-900/40 text-emerald-400 text-[0.65rem] px-2 py-1 rounded font-bold border border-emerald-700/50">승인</button>
                          <button onClick={() => updateAbyssStatus(report.id, 'rejected')} className="bg-red-900/40 text-red-400 text-[0.65rem] px-2 py-1 rounded font-bold border border-red-700/50">반려</button>
                        </div>
                      </div>
                    ))}
                    {abyssReports.filter(r => r.status === 'pending').length === 0 && <p className="text-[0.65rem] text-zinc-600 text-center py-2">대기 중인 제보가 없습니다.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDeepModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-5 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-black text-red-400">🌌 심층 구멍 현황 제보</h2>
              <button onClick={() => setIsDeepModalOpen(false)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={submitDeepHole} className="p-5 space-y-5 bg-[#1c1c1e]">
              <div>
                <label className="text-[0.7rem] font-bold text-zinc-400 mb-2 block">제보자 닉네임</label>
                <input type="text" value={user?.nickname || "로딩중..."} disabled className="w-full text-[0.8rem] p-3 rounded bg-[#121212] border border-zinc-700 text-zinc-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-zinc-400 mb-2 block">사냥터 선택</label>
                <div className="flex gap-2">
                  {HUNTING_ZONES.filter(z => z.isActive).map((zone) => (
                    <button type="button" key={zone.uid} onClick={() => setDeepZoneUID(zone.uid)} className={`flex-1 text-[0.75rem] font-bold py-2.5 rounded-lg transition ${deepZoneUID === zone.uid ? 'bg-zinc-700 text-white shadow' : 'bg-[#121212] text-zinc-500 border border-zinc-700'}`}>
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-zinc-400 mb-2 block">현재 구멍 갯수</label>
                <div className="flex gap-2">
                  {['0', '1', '2', '3'].map((num) => (
                    <button type="button" key={num} onClick={() => setDeepCount(num)} className={`flex-1 text-[0.85rem] font-black py-2.5 rounded-lg transition ${deepCount === num ? 'bg-red-900/40 text-red-400 border border-red-700/50' : 'bg-[#121212] text-zinc-500 border border-zinc-700'}`}>
                      {num}개
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-red-800 hover:bg-red-700 text-white text-[0.8rem] py-3 rounded-xl font-black transition shadow-lg">제보 반영하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {joinPopupParty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-5 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-black text-white">⚔️ 파티 합류 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 bg-[#1c1c1e]">
              <div>
                <label className="text-[0.7rem] font-bold text-zinc-500 mb-2 block">1. 캐릭터 선택</label>
                <div className="flex flex-wrap gap-2">
                  {myCharacters.map(char => (
                    <button key={char.id} onClick={() => setJoinSelectedChar(char.nickname)} className={`text-[0.75rem] font-bold px-3 py-2 rounded-lg transition ${joinSelectedChar === char.nickname ? 'bg-[#e6c788] text-black shadow' : 'bg-[#121212] text-zinc-400 border border-zinc-700'}`}>
                      {JOB_ICONS[char.job] || "👤"} {char.nickname}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-zinc-500 mb-2 block">2. 포지션 선택</label>
                {joinPopupParty.wanted_roles && joinPopupParty.wanted_roles.length > 0 && (
                  <div className="mb-3 bg-rose-900/10 border border-rose-900/30 p-3 rounded-lg">
                    <p className="text-[0.65rem] text-rose-400 font-bold mb-2">🔥 파티에서 급구 중인 포지션입니다!</p>
                    <div className="flex gap-2">
                      {joinPopupParty.wanted_roles.map((role: string) => <button key={role} onClick={() => setJoinSelectedRole(role)} className={`text-[0.75rem] font-bold px-3 py-1.5 rounded transition ${joinSelectedRole === role ? 'bg-rose-600 text-white' : 'bg-rose-900/40 text-rose-300 border border-rose-700'}`}>{role}</button>)}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {["탱커", "힐러", "근딜", "원딜"].map(role => (
                    <button key={role} onClick={() => setJoinSelectedRole(role)} className={`text-[0.75rem] font-bold px-3 py-1.5 rounded transition ${joinSelectedRole === role ? 'bg-indigo-600 text-white' : 'bg-[#121212] text-zinc-400 border border-zinc-700'}`}>{role}</button>
                  ))}
                </div>
              </div>
              <div className="bg-[#121212] border border-zinc-700/50 p-4 rounded-xl">
                <label className="text-[0.7rem] font-bold text-[#e6c788] mb-1 block">3. 본인의 가능 시간 입력</label>
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

      {detailModalParty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-[#252528] p-4 border-b border-zinc-700 flex justify-between items-center">
              <h3 className="text-white font-bold text-[0.8rem]">👥 {detailModalParty.content_name} 전체 멤버 ({detailModalParty.members.length}/{detailModalParty.max_members})</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-zinc-500 hover:text-white text-lg">&times;</button>
            </div>
            <div className="p-5 grid grid-cols-4 gap-2 bg-[#121212] max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                return m ? (
                  <div key={i} className={`flex flex-col items-center justify-center border ${detailModalParty.status === '모집완료' && detailModalParty.leader_name === m.name ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-zinc-800 border-zinc-600'} rounded p-2 h-20 relative`}>
                    <span className="text-2xl mb-1">{JOB_ICONS[actualJob] || "👤"}</span>
                    <span className="text-[0.65rem] text-white truncate w-full text-center font-bold">{m.name}</span>
                    {m.roles && m.roles.length > 0 && <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.5rem] text-white rounded-b truncate px-0.5">{m.roles[0]}</span>}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center bg-[#1c1c1e] border border-dashed border-zinc-700 rounded p-2 h-20"><span className="text-[0.65rem] text-zinc-600">빈자리</span></div>
                )
              })}
            </div>
            <div className="p-4 bg-[#252528] border-t border-zinc-700 text-right">
              <button onClick={() => setDetailModalParty(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[0.75rem] font-bold px-4 py-2 rounded">닫기</button>
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