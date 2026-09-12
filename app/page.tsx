"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { 
  calculateOptimalStartTime, 
  isScheduleConflict, 
  pickRandomLeader, 
  isTaskChecked 
} from "../lib/matchingUtils";
import ClassIcon from "../components/common/ClassIcon";
import MarkIcon from "../components/common/MarkIcon";

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
  { uid: 'hz_001', name: '창백한 산', isActive: true },
  { uid: 'hz_002', name: '센마이 평원', isActive: true },
  { uid: 'hz_003', name: '미개방 지역 1', isActive: false },
  { uid: 'hz_004', name: '미개방 지역 2', isActive: false },
];

function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':');
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative z-50 border rounded p-2 text-[0.8rem] font-bold cursor-pointer text-center transition flex justify-center items-center gap-1 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
      >
        <span>{h}:{m}</span>
        <span className="text-[0.6rem] text-[var(--text-sub)] transition-transform">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[140px] border rounded-lg shadow-2xl z-50 p-2 flex gap-2 bg-[var(--panel)] border-[var(--panel-border)]">
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button 
                key={hour} 
                onClick={() => onChange(`${hour}:${m}`)} 
                className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${
                  h === hour 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' 
                    : 'text-[var(--text-sub)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                {hour}시
              </button>
            ))}
          </div>
          <div className="w-px bg-[var(--panel-border)]"></div>
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button 
                key={minute} 
                onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} 
                className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${
                  m === minute 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' 
                    : 'text-[var(--text-sub)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                {minute}분
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사",
  "마법사", "화염술사", "빙결술사", "전격술사",
  "궁수", "장궁병", "석궁사수",
  "음유시인", "댄서", "악사",
  "힐러", "사제", "수도사", "암흑술사",
  "도적", "격투가", "듀얼블레이드"
];

const PANTHEON_CATEGORIES = [
  { id: 'cp', title: '이번 주 종합 전투력 랭킹', unit: 'CP' },
  { id: 'level', title: '성역 최고 레벨 랭킹', unit: 'LV' },
  { id: 'all_rounder', title: '올라운더 숙련도 랭킹', unit: 'LV' },
  { id: 'abyss', title: '어비스 레이드 정복 랭킹', unit: '회' },
  { id: 'activity', title: '성역 활동 포인트 랭킹', unit: 'PT' },
  { id: 'party', title: '시낙시스 파티 메이커 랭킹', unit: '회' },
];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [allCharactersMap, setAllCharactersMap] = useState<Record<string, string>>({});
  const [allCharactersList, setAllCharactersList] = useState<any[]>([]);
  const [nexusContents, setNexusContents] = useState<any[]>([]);
  
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
  const [abyssDisplay, setAbyssDisplay] = useState({ status: 'waiting', timeText: "계산 중", subText: "계산 중", isDefault: false });

  const [isDeepModalOpen, setIsDeepModalOpen] = useState(false);
  const [isAbyssModalOpen, setIsAbyssModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isWidgetExpandedMobile, setIsWidgetExpandedMobile] = useState(false);

  const [pantheonSlideIdx, setPantheonSlideIdx] = useState(0);

  const [deepHoles, setDeepHoles] = useState<DeepHole[]>([]);
  const [deepZoneUID, setDeepZoneUID] = useState<string>('hz_001');
  const [deepCount, setDeepCount] = useState('0');

  const [abyssReports, setAbyssReports] = useState<AbyssReport[]>([]);
  const [abyssMins, setAbyssMins] = useState(''); 

  const [joinPopupParty, setJoinPopupParty] = useState<any>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("근딜");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [detailModalParty, setDetailModalParty] = useState<any>(null);

  const [journal] = useState([
    { id: 1, text: "이번달 도우미 칭호를 획득했습니다.", date: "어제" },
    { id: 2, text: "길드원이 파티 매칭에 참여했습니다.", date: "어제" }
  ]);

  const formatTimeHM = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0) return `${h}시간 ${mm}분`;
    return `${m}분`;
  };

  // 구버전 '딜러' 포지션을 공식 5대 직군(근딜 등)으로 안전하게 정규화하는 함수
  const formatRoleText = (roleStr: string) => {
    if (!roleStr) return "근딜";
    if (roleStr === "딜러") return "근딜";
    return roleStr;
  };

  useEffect(() => {
    const pantheonTimer = setInterval(() => {
      setPantheonSlideIdx((prev) => (prev + 1) % PANTHEON_CATEGORIES.length);
    }, 4000);
    return () => clearInterval(pantheonTimer);
  }, []);

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
        setAbyssDisplay({ status: 'imminent', timeText: '출현 임박!', subText: `제보자: ${latest.reporter_name}`, isDefault: false });
      } else if (diffMs <= 0 && diffMs > -HOLE_DURATION) {
        setAbyssDisplay({ status: 'active', timeText: '출현중!!', subText: `제보자: ${latest.reporter_name}`, isDefault: false });
      } else {
        const diffSec = Math.floor(diffMs / 1000);
        setAbyssDisplay({ status: 'waiting', timeText: formatTimeHM(diffSec), subText: '다음 출현까지', isDefault: false });
      }
    } else {
      const baseCycle = (36 * 3600) + (15 * 60); 
      const epoch = new Date('2024-01-01T00:00:00Z').getTime() / 1000;
      const currentSec = nowMs / 1000;
      const elapsed = currentSec - epoch;
      const nextSpawnSec = baseCycle - (elapsed % baseCycle);

      setAbyssDisplay({ 
        status: 'waiting',
        timeText: formatTimeHM(nextSpawnSec), 
        subText: '다음 출현까지', 
        isDefault: true 
      });
    }
  };

  const fetchDashboardData = async (currentUser: any) => {
    const [charRes, taskRes, contRes, partyRes, deepRes, abyssRes] = await Promise.all([
      supabase.from('characters').select('*'),
      supabase.from('nexus_tasks').select('*').eq('is_active', true),
      supabase.from('nexus_contents').select('*').eq('is_active', true),
      // 🎯 핵심 수정: '모집완료', '종료됨', '종료', '매칭 완료' 상태인 파티는 메인 미리보기에서 원천 배제
      supabase.from('parties').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('deep_holes').select('*').order('reported_at', { ascending: false }).limit(20),
      supabase.from('abyss_reports').select('*').order('hole_time', { ascending: false }).limit(10)
    ]);
    
    if (deepRes.data) setDeepHoles(deepRes.data);
    if (abyssRes.data) setAbyssReports(abyssRes.data);
    if (contRes.data) setNexusContents(contRes.data);

    if (charRes.data) {
      const allChars = charRes.data;
      setAllCharactersList(allChars);
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
      setAbyssList(sortedContents.filter(c => c.type === 'abyss').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setRaidList(sortedContents.filter(c => c.type === 'raid').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

      const myChars = allChars.filter(char => char.owner === currentUser?.nickname || char.nickname === currentUser?.nickname);
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
    }
    if (partyRes.data) {
      // 🎯 엄격한 상태 필터링: 모집중 혹은 운영중인 파티만 메인에 최대 4개 노출
      const recruitingParties = partyRes.data.filter((p: any) => {
        const s = (p.status || "").trim();
        return s !== '모집완료' && s !== '종료됨' && s !== '종료' && s !== '매칭 완료';
      }).slice(0, 4);
      setActiveParties(recruitingParties);
    }
  };

  const getPantheonRankersForCategory = (catId: string) => {
    if (!allCharactersList || allCharactersList.length === 0) return [];
    const list = [...allCharactersList];

    switch (catId) {
      case 'cp':
        list.sort((a, b) => Number(String(b.combat_power || "0").replace(/,/g, '')) - Number(String(a.combat_power || "0").replace(/,/g, '')));
        return list.slice(0, 3).map(c => ({
          nickname: c.nickname,
          job: c.job,
          val: Number(String(c.combat_power || "0").replace(/,/g, '')).toLocaleString()
        }));
      case 'level':
        list.sort((a, b) => Number(b.level || 1) - Number(a.level || 1));
        return list.slice(0, 3).map(c => ({
          nickname: c.nickname,
          job: c.job,
          val: `Lv.${c.level || 1}`
        }));
      case 'all_rounder':
        list.sort((a, b) => {
          const sumA = a.levels ? Object.values(a.levels).reduce((acc: number, cur: any) => acc + Number(cur || 1), 0) : 1;
          const sumB = b.levels ? Object.values(b.levels).reduce((acc: number, cur: any) => acc + Number(cur || 1), 0) : 1;
          return sumB - sumA;
        });
        return list.slice(0, 3).map(c => {
          const sum = c.levels ? Object.values(c.levels).reduce((acc: number, cur: any) => acc + Number(cur || 1), 0) : 1;
          return { nickname: c.nickname, job: c.job, val: `${sum} LV합` };
        });
      case 'abyss':
        list.sort((a, b) => {
          const countA = a.raid_checks ? Object.keys(a.raid_checks).length : 0;
          const countB = b.raid_checks ? Object.keys(b.raid_checks).length : 0;
          return countB - countA;
        });
        return list.slice(0, 3).map(c => {
          const count = c.raid_checks ? Object.keys(c.raid_checks).length : 0;
          return { nickname: c.nickname, job: c.job, val: `${count}회` };
        });
      case 'activity':
      case 'party':
      default:
        list.sort((a, b) => Number(String(b.combat_power || "0").replace(/,/g, '')) - Number(String(a.combat_power || "0").replace(/,/g, '')));
        return list.slice(0, 3).map(c => ({
          nickname: c.nickname,
          job: c.job,
          val: `${Math.floor(Math.random() * 500 + 800)} PT`
        }));
    }
  };

  useEffect(() => {
    setMounted(true);
    const loadUserAndData = () => {
      const savedUser = localStorage.getItem("nexus_user");
      if (!savedUser) { 
        router.push("/login"); 
      } else { 
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        fetchDashboardData(parsedUser);
      }
    };

    loadUserAndData();
  }, [router]);

  const checkTaskDone = (char: any, item: any, type: "daily" | "weekly" | "raid") => {
    if (!char) return false;
    let rawChecks: any[] = [];
    if (type === "daily") rawChecks = char.daily_checks;
    else if (type === "weekly") {
      rawChecks = Array.isArray(char.weekly_checks) 
        ? char.weekly_checks 
        : (Array.isArray(char.weekly_checks?.normal) ? char.weekly_checks.normal : []);
    } else if (type === "raid") rawChecks = char.raid_checks;

    return isTaskChecked(rawChecks, item, nexusContents);
  };

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
    else setJoinSelectedRole("근딜");
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

      alert(updatePayload.status === "모집완료" ? "🎉 시낙시스 파티 매칭 완료!" : "파티 대기열 등록 완료");
      setJoinPopupParty(null);
      fetchDashboardData(user);
    } catch (err) { alert("오류 발생"); }
  };

  const formatName = (fullName: string) => fullName.replace('어비스 - ', '').replace('레이드 - ', '').substring(0, 2);

  let totalAccountCurrent = 0, totalAccountMax = 0;
  myCharacters.forEach(char => {
    const completedDaily = dailyTasks.filter(t => checkTaskDone(char, t, "daily")).length;
    const completedWeekly = weeklyTasks.filter(t => checkTaskDone(char, t, "weekly")).length;
    const completedAbyss = abyssList.filter(a => checkTaskDone(char, a, "raid")).length;
    const completedRaid = raidList.filter(r => checkTaskDone(char, r, "raid")).length;

    totalAccountCurrent += (completedDaily + completedWeekly + completedAbyss + completedRaid);
    totalAccountMax += (dailyTasks.length + weeklyTasks.length + abyssList.length + raidList.length);
  });
  const accountProgressRate = totalAccountMax > 0 ? Math.round((totalAccountCurrent / totalAccountMax) * 100) : 0;

  if (!mounted || !user) return null;

  const currentPantheonCat = PANTHEON_CATEGORIES[pantheonSlideIdx];
  const currentPantheonRankers = getPantheonRankersForCategory(currentPantheonCat.id);

  return (
    <div className="max-w-[1400px] mx-auto px-2 md:px-6 pt-1 md:pt-2 pb-6 md:pb-8 space-y-4 md:space-y-6 animate-in fade-in duration-300">
      
      {/* 상단 알리미 위젯 섹션 */}
      <section className="space-y-2">
        <div className="flex justify-between items-center px-1 gap-2">
          <span className="text-[0.6rem] md:text-[0.65rem] font-medium flex items-center gap-1.5 backdrop-blur px-2.5 py-1 rounded-full border whitespace-nowrap shadow-sm bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] truncate">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500 shrink-0"></span>
            <span className="truncate">심층 및 어비스 구멍 출현시간 제보 시 성역 길드원에게 실시간 공유됩니다!</span>
          </span>

          <button
            onClick={() => setIsWidgetExpandedMobile(!isWidgetExpandedMobile)}
            className="md:hidden text-[0.6rem] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--accent)] hover:border-[var(--accent)]"
          >
            <span>{isWidgetExpandedMobile ? '위젯 요약' : '위젯 전체보기'}</span>
            <span className="text-[0.5rem]">{isWidgetExpandedMobile ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className={`grid grid-cols-2 xl:grid-cols-6 gap-2 md:gap-3 items-stretch ${
          isWidgetExpandedMobile ? 'block' : 'hidden md:grid'
        }`}>
          
          <div 
            onClick={() => router.push('/lounge?tab=ASTRA')}
            className="rounded-xl border backdrop-blur p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm order-1 cursor-pointer transition group bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]"
          >
            <div className="absolute -right-2 -bottom-2 opacity-20 group-hover:scale-110 transition-transform pointer-events-none filter drop-shadow">
              <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="xl" colorClass="bg-[var(--accent)]" />
            </div>
            
            <div className="mb-2">
              <span className="text-[0.55rem] xs:text-[0.6rem] uppercase tracking-tight xs:tracking-wider font-black block leading-tight whitespace-nowrap text-[var(--accent)]">Sanctuary ASTRA</span>
              <p className="text-[0.6rem] xs:text-[0.65rem] font-bold mt-0.5 leading-tight whitespace-nowrap text-[var(--text-sub)]">성역에 새겨진 모든 별들</p>
            </div>

            <div className="grid grid-cols-2 gap-1 xs:gap-2 pt-2 border-t mt-auto border-[var(--panel-border)]">
              <div className="flex flex-col min-w-0">
                <span className="text-[0.55rem] xs:text-[0.6rem] uppercase font-bold tracking-wider text-[var(--accent)] truncate">SOL</span>
                <div className="flex items-baseline gap-0.5 xs:gap-1 mt-0.5 whitespace-nowrap">
                  <span className="text-lg xs:text-xl md:text-2xl font-black cursor-help leading-none text-[var(--text-main)]" title="등록된 계정 수">{uniqueAccountsCount}</span>
                  <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-none whitespace-nowrap text-[var(--text-sub)]">계정</span>
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[0.55rem] xs:text-[0.6rem] uppercase font-bold text-blue-400 tracking-wider truncate">LUNA</span>
                <div className="flex items-baseline gap-0.5 xs:gap-1 mt-0.5 whitespace-nowrap">
                  <span className="text-lg xs:text-xl md:text-2xl font-black cursor-help leading-none text-[var(--text-main)]" title="등록된 캐릭터 수">{totalCharactersCount}</span>
                  <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-none whitespace-nowrap text-[var(--text-sub)]">캐릭터</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border backdrop-blur p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm order-2 bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="absolute -right-2 -bottom-2 opacity-25 pointer-events-none filter drop-shadow">
              <MarkIcon src="/svgs/UI mark/도감 마크.svg" size="xl" colorClass="bg-[var(--accent)]" />
            </div>
            <p className="text-[0.55rem] xs:text-[0.6rem] uppercase tracking-[0.05em] xs:tracking-[0.1em] font-bold whitespace-nowrap text-[var(--text-sub)]">올라운더 달성률</p>
            <div className="my-auto py-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black leading-none text-[var(--accent)]">{allRounderLevel}</span>
              <span className="text-[0.65rem] xs:text-[0.7rem] font-bold leading-none text-[var(--text-sub)]">LV</span>
            </div>
            <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">최대 1365 LV</p>
          </div>

          <div className={`rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative transition-all duration-500 order-3 backdrop-blur border bg-[var(--panel)] ${
            fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' 
              ? 'border-yellow-500' 
              : 'border-[var(--panel-border)]'
          } ${fieldBossEvent.status === 'imminent' ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <p className={`text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap ${fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' ? 'text-yellow-400' : 'text-[var(--text-sub)]'}`}>필드보스 알림</p>
              <MarkIcon src="/svgs/contens mark/필드보스 마크.svg" size="sm" colorClass="bg-yellow-400" />
            </div>
            <div className="my-auto py-1 flex flex-col">
              <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
                {fieldBossEvent.status === 'imminent' ? '출현 임박!' : fieldBossEvent.status === 'active' ? '출현중!' : formatTimeHM(fieldBossEvent.sec)}
              </span>
              {fieldBossEvent.status === 'waiting' && <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">다음 출현까지</span>}
            </div>
            <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">{fieldBossEvent.status === 'active' ? '지도에서 위치 확인' : '12, 18, 20, 22시'}</p>
          </div>

          <div className={`rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative transition-all duration-500 order-4 backdrop-blur border bg-[var(--panel)] ${
            barrierEvent.status === 'imminent' || barrierEvent.status === 'active' 
              ? 'border-red-500' 
              : 'border-[var(--panel-border)]'
          } ${barrierEvent.status === 'imminent' ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <p className={`text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap ${barrierEvent.status === 'imminent' || barrierEvent.status === 'active' ? 'text-red-400' : 'text-[var(--text-sub)]'}`}>소환의 결계 알림</p>
              <MarkIcon src="/svgs/contens mark/여신상 마크.svg" size="sm" colorClass="bg-red-400" />
            </div>
            <div className="my-auto py-1 flex flex-col">
              <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
                {barrierEvent.status === 'imminent' ? '곧 출현!' : barrierEvent.status === 'active' ? '출현중!' : formatTimeHM(barrierEvent.sec)}
              </span>
              {barrierEvent.status === 'waiting' && <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">다음 출현까지</span>}
            </div>
            <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">{barrierEvent.status === 'active' ? '몬스터 등장 중' : '매 정각 실시간 타이머'}</p>
          </div>

          <div className="rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative backdrop-blur order-5 border bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="flex justify-between items-center mb-1 gap-1">
              <div className="flex items-center gap-1">
                <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
                <p className="text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap text-[var(--accent)]">어비스 구멍</p>
              </div>
              <button 
                onClick={() => setIsAbyssModalOpen(true)} 
                className="text-[0.55rem] xs:text-[0.6rem] px-1.5 py-0.5 rounded border transition font-bold shadow shrink-0 whitespace-nowrap hover:opacity-80 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--accent)]"
              >
                제보
              </button>
            </div>
            <div className="flex flex-col my-auto py-1">
              <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
                {abyssDisplay.timeText}
              </span>
              <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">{abyssDisplay.subText}</span>
            </div>
          </div>

          <div className="rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative backdrop-blur order-6 border bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="flex flex-col mb-1">
              <div className="flex justify-between items-center w-full gap-1">
                <div className="flex items-center gap-1">
                  <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" colorClass="bg-red-400" />
                  <p className="text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap text-red-400">심층 구멍</p>
                </div>
                <button 
                  onClick={() => setIsDeepModalOpen(true)} 
                  className="text-[0.55rem] xs:text-[0.6rem] px-1.5 py-0.5 rounded border transition font-bold shadow shrink-0 whitespace-nowrap hover:opacity-80 bg-[var(--inner-box)] border-[var(--panel-border)] text-red-400"
                >
                  제보
                </button>
              </div>
              <span className="text-[0.5rem] xs:text-[0.55rem] font-mono mt-0.5 whitespace-nowrap text-[var(--text-sub)]">{deepTimer} 초기화</span>
            </div>
            <div className="grid grid-cols-2 gap-1 my-auto">
              {HUNTING_ZONES.filter(z => z.isActive).map(zone => {
                const activeHole = getActiveDeepHoles(zone.uid)[0];
                return (
                  <div 
                    key={zone.uid} 
                    className="flex flex-col justify-center items-center border p-1 rounded-lg text-center gap-0.5 whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] min-w-0"
                  >
                    <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-tight truncate w-full text-[var(--text-main)]">{zone.name}</span>
                    <span 
                      className={`text-[0.55rem] xs:text-[0.6rem] w-full py-0.5 rounded font-bold ${activeHole && activeHole.channel !== '0' ? 'bg-red-500 text-white' : 'bg-[var(--panel)] text-[var(--text-sub)]'}`}
                    >
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
      <section className="bg-transparent p-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 pb-3 border-b gap-3 border-[var(--panel-border)]">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <MarkIcon src="/svgs/UI mark/가방 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm md:text-base flex items-center gap-2 whitespace-nowrap text-[var(--text-main)]">크로노스(KRONOS) 숙제 체크보드</h2>
                <span className="text-[0.55rem] font-black px-1.5 py-0.5 rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]">실시간 연동</span>
              </div>
              <p className="text-[0.6rem] md:text-[0.65rem] mt-0.5 break-keep truncate sm:whitespace-normal text-[var(--text-sub)]">계정 내 모든 캐릭터의 핵심 스탯과 일일/주간/레이드 숙제를 한눈에 관리하세요.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <div className="flex items-center gap-2 min-w-[140px] xs:min-w-[180px]">
               <div className="flex flex-col text-right text-[0.6rem] font-bold leading-tight whitespace-nowrap">
                  <span className="text-[var(--text-sub)]">계정 달성률</span>
                  <span className="text-[0.75rem] font-black text-[var(--accent)]">{accountProgressRate}%</span>
               </div>
               <div className="flex-1 border h-2 rounded-full overflow-hidden shadow-inner bg-[var(--inner-box)] border-[var(--panel-border)]">
                  <div style={{ width: `${accountProgressRate}%` }} className="h-full transition-all duration-700 bg-[var(--accent)]"></div>
               </div>
            </div>
            
            <button 
              onClick={() => router.push('/character')} 
              className="whitespace-nowrap shrink-0 text-[0.7rem] font-black px-3.5 py-2 rounded-xl transition shadow hover:opacity-90 flex items-center gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)]"
            >
              <span>⚔️</span>
              <span>크로노스 관리</span>
            </button>
          </div>

        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
          {myCharacters.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs font-bold text-[var(--text-sub)]">등록된 캐릭터가 없습니다. '크로노스 관리'에서 캐릭터를 등록해주세요!</div>
          ) : (
            myCharacters.map((char) => {
              const completedDailyCount = dailyTasks.filter(t => checkTaskDone(char, t, "daily")).length;
              const completedWeeklyCount = weeklyTasks.filter(t => checkTaskDone(char, t, "weekly")).length;

              const dRate = Math.round((completedDailyCount / (dailyTasks.length || 1)) * 100);
              const wRate = Math.round((completedWeeklyCount / (weeklyTasks.length || 1)) * 100);

              const abyssCount = abyssList.filter(a => checkTaskDone(char, a, "raid")).length;
              const raidCount = raidList.filter(r => checkTaskDone(char, r, "raid")).length;

              return (
                <div 
                  key={char.id || char.nickname} 
                  onClick={() => router.push(`/character?char=${encodeURIComponent(char.nickname)}`)} 
                  className="backdrop-blur border rounded-xl p-2.5 md:p-3 cursor-pointer transition shadow-sm flex flex-col gap-2 group min-w-0 active:scale-[0.98] bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]"
                >
                  <div className="flex items-center justify-between border-b pb-1.5 gap-2 border-[var(--panel-border)]">
                    <div className="flex items-center gap-1.5 w-full truncate">
                      <ClassIcon job={char.job} size="sm" />
                      <span className="font-black text-[0.75rem] md:text-[0.85rem] truncate flex-1 min-w-0 text-[var(--text-main)]">{char.nickname}</span>
                    </div>
                    {char.is_main && (
                      <span className="text-[0.55rem] font-black px-1 py-0.2 rounded shrink-0 hidden sm:block whitespace-nowrap bg-[var(--accent)] text-[var(--accent-fg)]">
                        대표
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-[0.6rem] font-bold px-0.5">
                    <div>
                      <div className="flex justify-between mb-0.5 gap-2 text-[var(--text-sub)]">
                        <span className="whitespace-nowrap">일일 숙제</span>
                        <span className="font-mono shrink-0 text-[var(--accent)]">{Math.min(dRate, 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--inner-box)]">
                        <div style={{ width: `${Math.min(dRate, 100)}%` }} className="h-full transition-all bg-[var(--accent)]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5 gap-2 text-[var(--text-sub)]">
                        <span className="whitespace-nowrap">주간 숙제</span>
                        <span className="font-mono shrink-0 text-[var(--accent)]">{Math.min(wRate, 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--inner-box)]">
                        <div style={{ width: `${Math.min(wRate, 100)}%` }} className="h-full transition-all bg-[var(--accent)]"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-1.5 rounded-lg border mt-auto bg-[var(--inner-box)] border-[var(--panel-border)]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.55rem] font-bold truncate text-[var(--text-sub)]">어비스 ({abyssCount}/{abyssList.length})</span>
                      <div className="grid grid-cols-2 gap-1">
                        {abyssList.length > 0 ? abyssList.map((a, idx) => {
                          const isChecked = checkTaskDone(char, a, "raid");
                          const dName = a.short_name || formatName(a.name);
                          const isOddAndLast = (abyssList.length % 2 !== 0) && (idx === abyssList.length - 1);
                          return (
                            <span 
                              key={a.id} 
                              className={`w-full text-[0.55rem] px-1 py-0.5 rounded border font-bold text-center truncate transition-colors ${isOddAndLast ? 'col-span-2' : ''} ${
                                isChecked ? 'bg-[var(--accent-secondary)] text-[var(--accent-fg)] border-[var(--accent-secondary)] shadow-xs' : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]'
                              }`}
                            >
                              {dName}
                            </span>
                          )
                        }) : <span className="font-normal text-[0.55rem] col-span-2 text-center text-[var(--text-sub)]">없음</span>}
                      </div>
                    </div>
                    <div className="border-t border-[var(--panel-border)]"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.55rem] font-bold truncate text-[var(--text-sub)]">레이드 ({raidCount}/{raidList.length})</span>
                      <div className="grid grid-cols-2 gap-1">
                        {raidList.length > 0 ? raidList.map((r, idx) => {
                          const isChecked = checkTaskDone(char, r, "raid");
                          const dName = r.short_name || formatName(r.name);
                          const isOddAndLast = (raidList.length % 2 !== 0) && (idx === raidList.length - 1);
                          return (
                            <span 
                              key={r.id} 
                              className={`w-full text-[0.55rem] px-1 py-0.5 rounded border font-bold text-center truncate transition-colors ${isOddAndLast ? 'col-span-2' : ''} ${
                                isChecked ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-xs' : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]'
                              }`}
                            >
                              {dName}
                            </span>
                          )
                        }) : <span className="font-normal text-[0.55rem] col-span-2 text-center text-[var(--text-sub)]">없음</span>}
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
      <section className="bg-transparent p-1 w-full flex flex-col mt-4">
        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between mb-4 pb-3 border-b gap-3 border-[var(--panel-border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <MarkIcon src="/svgs/UI mark/채팅 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm md:text-base whitespace-nowrap text-[var(--text-main)]">시낙시스(SYNAXIS) 실시간 오토 파티 매칭</h2>
                <span className="text-[0.55rem] font-black px-1.5 py-0.5 rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]">스마트 매칭</span>
              </div>
              <p className="text-[0.6rem] md:text-[0.65rem] mt-0.5 truncate sm:whitespace-normal break-keep text-[var(--text-sub)]">인원이 꽉 차면 시스템이 15분 단위 최적 출발 시간과 파티장을 자동 확정합니다.</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/party')} 
            className="w-full sm:w-auto whitespace-nowrap shrink-0 text-[0.65rem] font-black px-3.5 py-1.5 rounded-lg transition shadow hover:opacity-90 bg-[var(--accent)] text-[var(--accent-fg)]"
          >
            시낙시스 전체 게시판
          </button>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-4 flex-1">
          {activeParties.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-10 font-bold text-[0.75rem] text-[var(--text-sub)]">현재 모집 중인 파티가 없습니다.</div>
          ) : (
            activeParties.map((party) => {
              const isMyParty = party.members.some((m: any) => m.name === user?.nickname || myCharacters.some(c => c.nickname === m.name));
              const isFull = party.members.length >= party.max_members;
              const isOver4 = party.max_members > 4;
              const isCompleted = party.status === "모집완료";

              return (
                <div 
                  key={party.id} 
                  className={`rounded-xl border p-3.5 flex flex-col gap-3 shadow-sm transition-all min-w-0 backdrop-blur bg-[var(--panel)] ${
                    party.party_type === '연속 뺑이' ? 'border-red-500' : isCompleted ? 'border-[var(--accent)]' : 'border-[var(--panel-border)]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 border-b pb-2 border-[var(--panel-border)]">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {isCompleted ? (
                          <span className="text-[0.6rem] font-black px-2 py-0.5 rounded shadow whitespace-nowrap bg-[var(--accent)] text-[var(--accent-fg)]">✅ 매칭완료</span>
                        ) : (
                          <span className="text-[0.6rem] font-black px-1.5 py-0.5 rounded border whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]">대기중</span>
                        )}
                        <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded border text-purple-400 whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)]">{party.difficulty}</span>
                        <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]">{party.max_members}인팟</span>
                      </div>
                      <p className={`text-[0.85rem] md:text-base font-black leading-tight truncate ${isCompleted ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>{party.content_name}</p>
                      <div className="mt-1">
                        {isCompleted ? (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded font-bold border animate-pulse whitespace-nowrap bg-[var(--inner-box)] border-yellow-500 text-yellow-500">⏰ 확정 출발 {party.final_start_time}</span>
                        ) : (
                          <span className="text-[0.6rem] font-mono whitespace-nowrap text-[var(--accent)]">⏰ 희망 {party.time_start} ~ {party.time_end}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[0.65rem] font-black border px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]">{party.members.length} / {party.max_members} 명</span>
                      {isFull ? (
                        <button disabled className="text-[0.6rem] font-bold border px-2.5 py-1 rounded cursor-not-allowed shrink-0 whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]">모집 마감</button>
                      ) : (
                        <button onClick={() => openJoinPopup(party)} className="text-[0.6rem] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded shadow transition shrink-0 whitespace-nowrap">참여 신청</button>
                      )}
                    </div>
                  </div>

                  {party.matching_mode === "조합우선" && party.wanted_roles && party.wanted_roles.length > 0 && (
                    <div className="flex items-center gap-1.5 border border-rose-500/30 px-2 py-1 rounded-lg flex-wrap bg-[var(--inner-box)]">
                      <span className="text-[0.55rem] font-black text-rose-400 animate-pulse shrink-0">WANTED</span>
                      {party.wanted_roles.map((role: string) => <span key={role} className="text-[0.55rem] font-bold text-rose-300 px-1.5 py-0.2 rounded border whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)]">{role}</span>)}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1.5 p-2 rounded-lg border bg-[var(--inner-box)] border-[var(--panel-border)]">
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 touch-pan-x items-center py-1">
                      {Array.from({ length: isOver4 ? 4 : party.max_members }).map((_, i) => {
                        const m = party.members[i];
                        const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                        const displayRole = m?.roles && m.roles.length > 0 ? formatRoleText(m.roles[0]) : (m?.role ? formatRoleText(m.role) : "");
                        return m ? (
                          <div 
                            key={i} 
                            className={`flex flex-col items-center justify-center border rounded p-1 w-11 h-13 md:w-12 md:h-14 flex-shrink-0 relative ${
                              isCompleted && party.leader_name === m.name 
                                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]' 
                                : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]'
                            }`}
                          >
                            <ClassIcon job={actualJob} size="sm" />
                            <span className="text-[0.5rem] md:text-[0.55rem] truncate w-full text-center font-bold mt-1">{m.name}</span>
                            {displayRole && <span className="absolute -bottom-1 w-full text-center text-[0.45rem] rounded-b truncate px-0.5 bg-[var(--accent-strong)] text-white">{displayRole}</span>}
                          </div>
                        ) : (
                          <div key={i} className="flex flex-col items-center justify-center border border-dashed rounded p-1 w-11 h-13 md:w-12 md:h-14 flex-shrink-0 bg-[var(--panel)] border-[var(--panel-border)]">
                            <span className="text-[0.5rem] whitespace-nowrap text-[var(--text-sub)]">빈자리</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    {isOver4 && (
                      <button 
                        onClick={() => setDetailModalParty(party)} 
                        className="border text-[0.6rem] font-bold px-2 py-2 rounded flex flex-col items-center justify-center gap-0.5 transition flex-shrink-0 hover:opacity-80 bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]"
                      >
                        <span className="whitespace-nowrap">+보기</span>
                        <span className="text-[0.5rem] whitespace-nowrap text-[var(--text-sub)]">({party.members.length}/{party.max_members})</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="text-[0.6rem] font-medium flex justify-between items-center pt-0.5 gap-2 text-[var(--text-sub)]">
                    <span className="truncate">파티장: <span className="font-bold text-[var(--text-main)]">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
                    {isMyParty && <button onClick={() => handleDeleteParty(party.id)} className="text-[0.6rem] text-red-400 hover:underline shrink-0 whitespace-nowrap">내 파티 취소하기</button>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 판테온 명예의 전당 & 저널 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        <section className="lg:col-span-2 bg-transparent p-1 mt-2">
          <div className="flex justify-between items-center mb-3 border-b pb-2.5 gap-3 border-[var(--panel-border)]">
            <div className="flex items-center gap-2">
              <MarkIcon src="/svgs/UI mark/트 로피 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
              <div>
                <h2 className="font-bold text-sm md:text-base whitespace-nowrap text-[var(--text-main)]">판테온(PANTHEON) 명예의 전당</h2>
                <p className="text-[0.5rem] text-[var(--accent)] font-mono">⚡ 6대 랭킹 실시간 오토 슬라이드</p>
              </div>
            </div>
            <button onClick={() => router.push('/lounge?tab=PANTHEON')} className="text-[0.65rem] font-bold transition shrink-0 whitespace-nowrap hover:opacity-80 text-[var(--text-sub)]">전체 랭킹 보기</button>
          </div>
          
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[0.7rem] font-black text-[var(--accent)] flex items-center gap-1">
              <span>✦</span> {currentPantheonCat.title}
            </span>
            <div className="flex gap-1">
              {PANTHEON_CATEGORIES.map((cat, i) => (
                <button 
                  key={cat.id} 
                  onClick={() => setPantheonSlideIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === pantheonSlideIdx ? 'bg-[var(--accent)] w-4' : 'bg-[var(--panel-border)]'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2.5 min-h-[170px] transition-all">
            {currentPantheonRankers.length === 0 ? (
              <div className="text-center py-10 text-xs font-bold text-[var(--text-sub)]">랭킹 데이터가 집계되지 않았습니다.</div>
            ) : (
              currentPantheonRankers.map((ranker, idx) => (
                <div 
                  key={ranker.nickname + idx} 
                  className="flex items-center gap-3 backdrop-blur p-2.5 rounded-xl border shadow-sm min-w-0 bg-[var(--panel)] border-[var(--panel-border)] animate-in fade-in duration-300"
                >
                  <div 
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[0.7rem] font-black shrink-0 border ${
                      idx === 0 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                        : idx === 1
                        ? 'bg-slate-400/20 text-slate-300 border-slate-400/50'
                        : 'bg-amber-800/20 text-amber-600 border-amber-800/50'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-center">
                    <ClassIcon job={ranker.job} rank={(idx + 1) as 1 | 2 | 3} size="md" />
                  </div>

                  <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                    <span className="font-bold text-[0.8rem] truncate text-[var(--text-main)]">{ranker.nickname}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-[var(--accent)]" />
                      <span className="font-mono font-bold text-[0.75rem] whitespace-nowrap text-[var(--accent)]">
                        {ranker.val} <span className="text-[0.55rem] text-[var(--text-sub)]">{currentPantheonCat.unit}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-3 bg-transparent p-1 flex flex-col mt-2">
          <div className="flex justify-between items-center mb-3 border-b pb-2.5 gap-3 border-[var(--panel-border)]">
            <div className="flex items-center gap-2">
              <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
              <h2 className="font-bold text-sm md:text-base whitespace-nowrap text-[var(--text-main)]">SANCTUM 길드 저널</h2>
            </div>
            <span className="text-[0.6rem] border px-2 py-0.5 rounded font-bold shrink-0 whitespace-nowrap bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent)]">
              활동 포인트 1,250 획득
            </span>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row flex-1">
            <div className="flex-1 space-y-2 min-w-0">
              <p className="text-[0.65rem] font-bold mb-1.5 whitespace-nowrap text-[var(--text-sub)]">최근 내 활동 내역</p>
              {journal.map(entry => (
                <div 
                  key={entry.id} 
                  className="backdrop-blur p-2.5 rounded-lg border flex justify-between items-center gap-2 shadow-sm min-w-0 bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]"
                >
                  <span className="text-[0.7rem] truncate">{entry.text}</span>
                  <span className="text-[0.6rem] shrink-0 whitespace-nowrap text-[var(--text-sub)]">{entry.date}</span>
                </div>
              ))}
            </div>
            <div className="backdrop-blur border shadow-sm rounded-xl p-3.5 flex flex-col min-w-0 bg-[var(--panel)] border-[var(--panel-border)]">
              <p className="text-[0.65rem] font-bold mb-2 whitespace-nowrap text-[var(--text-sub)]">🏅 도전 중인 칭호</p>
              <div className="flex flex-col gap-2">
                <div className="p-2.5 rounded-lg border border-dashed relative bg-[var(--inner-box)] border-[var(--accent)]">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-[0.7rem] font-black transition whitespace-nowrap text-[var(--accent)]">❓ 파티 메이커</span>
                    <span className="text-[0.6rem] shrink-0 whitespace-nowrap text-[var(--text-sub)]">6 / 10 회</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--panel)]">
                    <div style={{ width: '60%' }} className="h-full bg-[var(--accent)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* 모달 팝업들 */}
      {isAbyssModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <div className="flex items-center gap-1.5">
                <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
                <h2 className="text-base font-black whitespace-nowrap text-[var(--accent)]">어비스 구멍 제보</h2>
              </div>
              <button onClick={() => setIsAbyssModalOpen(false)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[0.65rem] font-bold whitespace-nowrap text-[var(--text-sub)]">신규 제보 입력</span>
                {((user?.nickname && ["한설", "수도사는수도사", "신파랑", "제ส"].includes(user.nickname)) || 
                  ["길드마스터", "마스터", "부마스터"].includes(user?.role)) && (
                  <label className="flex items-center space-x-1.5 cursor-pointer border px-2 py-0.5 rounded shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)]">
                    <input type="checkbox" checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} className="w-3 h-3 accent-[var(--accent)]" />
                    <span className="text-[0.6rem] font-bold whitespace-nowrap text-[var(--text-sub)]">관리자(CBT)</span>
                  </label>
                )}
              </div>
              <form onSubmit={submitAbyssHole} className="flex gap-2">
                <input 
                  type="text" 
                  value={user?.nickname || "로딩중..."} 
                  disabled 
                  className="w-24 text-[0.7rem] p-2 rounded border cursor-not-allowed shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]" 
                />
                <div className="flex-1 relative min-w-0">
                  <input 
                    type="number" 
                    placeholder="등장까지 몇분 남았나요?" 
                    value={abyssMins} 
                    onChange={(e) => setAbyssMins(e.target.value)} 
                    className="w-full text-[0.7rem] p-2 rounded border focus:outline-none pr-8 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]" 
                  />
                  <span className="absolute right-2.5 top-2 text-[0.7rem] font-bold whitespace-nowrap text-[var(--text-sub)]">분</span>
                </div>
                <button 
                  type="submit" 
                  className="text-[0.7rem] px-3.5 rounded font-bold transition shrink-0 whitespace-nowrap hover:opacity-90 bg-[var(--accent)] text-[var(--accent-fg)]"
                >
                  제보
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeepModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <div className="flex items-center gap-1.5">
                <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" colorClass="bg-red-500" />
                <h2 className="text-base font-black text-red-500 whitespace-nowrap">심층 구멍 현황 제보</h2>
              </div>
              <button onClick={() => setIsDeepModalOpen(false)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <form onSubmit={submitDeepHole} className="p-4 space-y-4">
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">제보자 닉네임</label>
                <input type="text" value={user?.nickname || "로딩중..."} disabled className="w-full text-[0.75rem] p-2.5 rounded border cursor-not-allowed bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]" />
              </div>
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">사냥터 선택</label>
                <div className="flex gap-1.5 flex-wrap">
                  {HUNTING_ZONES.filter(z => z.isActive).map((zone) => (
                    <button 
                      type="button" 
                      key={zone.uid} 
                      onClick={() => setDeepZoneUID(zone.uid)} 
                      className={`flex-1 min-w-[90px] text-[0.7rem] font-bold py-2 rounded-lg transition whitespace-nowrap border ${
                        deepZoneUID === zone.uid 
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' 
                          : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">현재 구멍 갯수</label>
                <div className="flex gap-1.5">
                  {['0', '1', '2', '3'].map((num) => (
                    <button 
                      type="button" 
                      key={num} 
                      onClick={() => setDeepCount(num)} 
                      className={`flex-1 text-[0.8rem] font-black py-2 rounded-lg transition whitespace-nowrap border ${
                        deepCount === num 
                          ? 'bg-red-500 text-white border-red-500' 
                          : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                      }`}
                    >
                      {num}개
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-1">
                <button type="submit" className="w-full text-[0.75rem] py-2.5 rounded-xl font-black transition shadow-lg whitespace-nowrap hover:opacity-90 bg-red-500 text-white">제보 반영하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailModalParty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <h3 className="font-bold text-[0.8rem] truncate text-[var(--text-main)]">👥 {detailModalParty.content_name} 전체 멤버 ({detailModalParty.members.length}/{detailModalParty.max_members})</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-lg shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <div className="p-4 grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[var(--panel)]">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                const displayRole = m?.roles && m.roles.length > 0 ? formatRoleText(m.roles[0]) : (m?.role ? formatRoleText(m.role) : "");
                return m ? (
                  <div key={i} className={`flex flex-col items-center justify-center border rounded p-2 h-20 relative ${
                    detailModalParty.status === '모집완료' && detailModalParty.leader_name === m.name 
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]' 
                      : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]'
                  }`}>
                    <ClassIcon job={actualJob} size="md" />
                    <span className="text-[0.6rem] truncate w-full text-center font-bold mt-1">{m.name}</span>
                    {displayRole && <span className="absolute bottom-0 w-full text-center text-[0.45rem] rounded-b truncate px-0.5 bg-[var(--accent-strong)] text-white">{displayRole}</span>}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center border border-dashed rounded p-2 h-20 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]">
                    <span className="text-[0.55rem] font-bold">빈자리</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {joinPopupParty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <h2 className="text-[0.85rem] font-black whitespace-nowrap text-[var(--text-main)]">⚔️ 파티 참여 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            
            <div className="p-4 space-y-3.5">
              <div className="p-2.5 rounded-lg border bg-[var(--panel)] border-[var(--panel-border)]">
                <p className="text-[0.75rem] font-black text-[var(--text-main)]">{joinPopupParty.content_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[0.55rem] px-1.5 py-0.2 rounded border bg-[var(--inner-box)] border-[var(--panel-border)] text-purple-400">{joinPopupParty.difficulty}</span>
                  <span className="text-[0.55rem] text-[var(--text-sub)] font-mono">{joinPopupParty.time_start} ~ {joinPopupParty.time_end}</span>
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">참여할 내 캐릭터</label>
                <select 
                  value={joinSelectedChar} 
                  onChange={(e) => setJoinSelectedChar(e.target.value)}
                  className="w-full text-[0.75rem] p-2 rounded border outline-none bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]"
                >
                  {myCharacters.map(c => (
                    <option key={c.id || c.nickname} value={c.nickname}>{c.nickname} (Lv.{c.level || 1})</option>
                  ))}
                  {myCharacters.length === 0 && <option value="">등록된 캐릭터가 없습니다</option>}
                </select>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">수행 포지션 (5대 직군)</label>
                <div className="grid grid-cols-5 gap-1">
                  {['탱커', '근딜', '원딜', '힐러', '서포터'].map(r => (
                    <label key={r} className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer transition ${joinSelectedRole === r ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-bold' : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'}`}>
                      <input type="radio" name="role" value={r} checked={joinSelectedRole === r} onChange={(e) => setJoinSelectedRole(e.target.value)} className="hidden" />
                      <span className="text-[0.65rem] truncate">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">나의 실제 참여 가능 시간 (파티와 조율됨)</label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold text-xs">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>

            <div className="p-3 border-t flex justify-end gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <button onClick={() => setJoinPopupParty(null)} className="px-3.5 py-1.5 rounded text-[0.7rem] font-bold transition bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">취소</button>
              <button onClick={executeJoinParty} className="px-3.5 py-1.5 rounded text-[0.7rem] font-black transition shadow hover:opacity-90 bg-[var(--accent)] text-[var(--accent-fg)]">신청 확정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}