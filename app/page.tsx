"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { 
  calculateOptimalStartTime, 
  isScheduleConflict, 
  pickRandomLeader, 
  isTaskChecked,
  cleanItemName
} from "../lib/matchingUtils";

import SanctumHeaderWidgets from "../components/sanctum/SanctumHeaderWidgets";
import KronosCheckboardSection from "../components/sanctum/KronosCheckboardSection";
import SynaxisPartySection from "../components/sanctum/SynaxisPartySection";
import PantheonRankingSection from "../components/sanctum/PantheonRankingSection";
import SanctumModals from "../components/sanctum/SanctumModals";

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

const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사",
  "마법사", "화염술사", "빙결술사", "전격술사",
  "궁수", "장궁병", "석궁사수",
  "음유시인", "댄서", "악사",
  "힐러", "사제", "수도사", "암흑술사",
  "도적", "격투가", "듀얼블레이드"
];

const PANTHEON_CATEGORIES = [
  { id: 'TELOS', nameEn: 'TELOS', nameKr: '텔로스', rankLabel: '종합 랭킹', unit: '점', statName: '종합 점수' },
  { id: 'SYMPHONIA', nameEn: 'SYMPHONIA', nameKr: '심포니아', rankLabel: '계정 랭킹', unit: '점', statName: '계정 총점' },
  { id: 'KRATOS', nameEn: 'KRATOS', nameKr: '크라토스', rankLabel: '전투력 랭킹', unit: 'CP', statName: '전투력' },
  { id: 'TECHNE', nameEn: 'TECHNĒ', nameKr: '테크네', rankLabel: '생활력 랭킹', unit: 'LV', statName: '최고 생활력' },
  { id: 'HARMONIA', nameEn: 'HARMONIA', nameKr: '하르모니아', rankLabel: '매력 랭킹', unit: 'PT', statName: '매력' },
  { id: 'PIETAS', nameEn: 'PIETAS', nameKr: '피에타스', rankLabel: '공헌도 랭킹', unit: 'PT', statName: '공헌도' },
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

  const formatTimeHM = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0) return `${h}시간 ${mm}분`;
    return `${m}분`;
  };

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

      const bossTimes: number[] = [12, 15, 18, 20, 22];
      let fStatus = 'waiting';
      let fSec = 0;
      let nextBossTime: Date | null = null;
      let currentBossTime: Date | null = null;
      
      for (const hour of bossTimes) {
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
      const recruitingParties = partyRes.data.filter((p: any) => {
        const s = (p.status || "").trim();
        return s !== '모집완료' && s !== '종료됨' && s !== '종료' && s !== '매칭 완료';
      }).slice(0, 4);
      setActiveParties(recruitingParties);
    }
  };

  const getPantheonRankersForCategory = (catId: string) => {
    if (!allCharactersList || allCharactersList.length === 0) return [];

    const getScore = (c: any, type: string) => {
      const cp = Number(c.combat_power) || 0;
      const life = Number(c.life_energy) || 0;
      const charm = Number(c.charm) || 0;
      const contrib = Number(c.contribution) || 0;

      switch(type) {
        case 'KRATOS': return cp; 
        case 'TECHNE': return life;
        case 'HARMONIA': return charm;
        case 'TELOS': return cp + life + charm;
        case 'PIETAS': return contrib;
        default: return 0;
      }
    };

    if (catId === 'PIETAS') {
      const ownerMap = new Map<string, any>();
      allCharactersList.forEach((c: any) => { 
        if (c.is_main) {
          const ownerKey = (c.owner && c.owner.trim() !== "") ? c.owner.trim() : c.nickname;
          ownerMap.set(ownerKey, c); 
        }
      });
      allCharactersList.forEach((c: any) => {
        const ownerKey = (c.owner && c.owner.trim() !== "") ? c.owner.trim() : c.nickname;
        if (!ownerMap.has(ownerKey)) {
          ownerMap.set(ownerKey, c);
        } else {
          const existing = ownerMap.get(ownerKey);
          if (!existing.is_main && (Number(c.contribution) || 0) > (Number(existing.contribution) || 0)) {
            ownerMap.set(ownerKey, c);
          }
        }
      });
      const list = Array.from(ownerMap.values());
      list.sort((a, b) => (Number(b.contribution) || 0) - (Number(a.contribution) || 0));
      return list.slice(0, 3).map(c => ({
        nickname: c.nickname,
        job: c.job || '전사',
        val: (Number(c.contribution) || 0).toLocaleString()
      }));
    }

    if (catId === 'TECHNE') {
      // 생활력은 계정에서 공유되므로 판테온 본 화면과 동일하게 계정별 최고 캐릭터만 남긴다.
      const ownerMap = new Map<string, (typeof allCharactersList)[number]>();
      allCharactersList.forEach((c) => {
        const ownerKey = c.owner?.trim() || c.nickname;
        const current = ownerMap.get(ownerKey);
        if (!current || getScore(c, 'TECHNE') > getScore(current, 'TECHNE')) {
          ownerMap.set(ownerKey, c);
        }
      });

      return Array.from(ownerMap.values())
        .sort((a, b) => getScore(b, 'TECHNE') - getScore(a, 'TECHNE'))
        .slice(0, 3)
        .map(c => ({
          nickname: c.nickname,
          job: c.job || '전사',
          val: getScore(c, 'TECHNE').toLocaleString()
        }));
    }

    if (catId === 'SYMPHONIA') {
      const accountMap: Record<string, any> = {};
      allCharactersList.forEach(c => {
        const ownerKey = (c.owner && c.owner.trim() !== "") ? c.owner.trim() : c.nickname;
        const cCombat = Number(c.combat_power) || 0;
        const cLife = Number(c.life_energy) || 0;
        const cCharm = Number(c.charm) || 0;
        const charTotalScore = cCombat + cLife + cCharm;

        if (!accountMap[ownerKey]) {
          accountMap[ownerKey] = { nickname: ownerKey, job: c.job || '전사', totalScore: 0 };
        }
        accountMap[ownerKey].totalScore += charTotalScore;
        if (c.is_main) { accountMap[ownerKey].job = c.job; }
      });

      return Object.values(accountMap)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3)
        .map(acc => ({
          nickname: acc.nickname,
          job: acc.job,
          val: acc.totalScore.toLocaleString()
        }));
    }

    const list = [...allCharactersList];
    list.sort((a, b) => getScore(b, catId) - getScore(a, catId));

    return list.slice(0, 3).map(c => ({
      nickname: c.nickname,
      job: c.job || '전사',
      val: getScore(c, catId).toLocaleString()
    }));
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
    let rawChecks: any = null;
    if (type === "daily") rawChecks = char.daily_checks;
    else if (type === "weekly") {
      rawChecks = Array.isArray(char.weekly_checks) 
        ? char.weekly_checks 
        : (Array.isArray(char.weekly_checks?.normal) ? char.weekly_checks.normal : char.weekly_checks);
    } else if (type === "raid") rawChecks = char.raid_checks;

    if (!rawChecks) return false;

    if (typeof rawChecks === "object" && !Array.isArray(rawChecks)) {
      const activeKeys = Object.keys(rawChecks).filter(k => Boolean(rawChecks[k]));
      return isTaskChecked(activeKeys, item, nexusContents);
    }

    return isTaskChecked(rawChecks, item, nexusContents);
  };

  const handleToggleTask = async (char: any, item: any, type: "daily" | "weekly" | "raid") => {
    if (!char) return;
    const fieldMap: Record<string, string> = { daily: "daily_checks", weekly: "weekly_checks", raid: "raid_checks" };
    const field = fieldMap[type] || "raid_checks";
    
    const raw = char[field];
    const isDone = checkTaskDone(char, item, type);
    const itemKey = item.id || item.name;

    let updatedPayload: any;

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const objCopy = { ...raw };
      if (isDone) {
        delete objCopy[itemKey];
        if (item.short_name) delete objCopy[item.short_name];
        if (item.name) delete objCopy[item.name];
      } else {
        objCopy[itemKey] = true;
      }
      updatedPayload = objCopy;
    } else {
      let arrCopy = Array.isArray(raw) ? [...raw] : [];
      if (isDone) {
        const cleanName = cleanItemName(item.name || "");
        arrCopy = arrCopy.filter((c: any) => {
          const checkStr = typeof c === "object" ? String(c.id || c.name || "") : String(c);
          if (checkStr === String(itemKey)) return false;
          if (checkStr.toLowerCase() === (item.name || "").toLowerCase()) return false;
          if (cleanName && checkStr.toLowerCase() === cleanName.toLowerCase()) return false;
          if (item.short_name && checkStr.includes(item.short_name)) return false;
          return true;
        });
      } else {
        arrCopy.push(itemKey);
      }
      updatedPayload = arrCopy;
    }

    setMyCharacters((prev) =>
      prev.map((c) => {
        if ((c.id && c.id === char.id) || (c.nickname && c.nickname === char.nickname)) {
          return { ...c, [field]: updatedPayload };
        }
        return c;
      })
    );

    if (char.id) {
      try {
        await supabase.from("characters").update({ [field]: updatedPayload }).eq("id", char.id);
      } catch (err) {
        console.error("Supabase 숙제 업데이트 실패:", err);
      }
    }
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

  const handleDeleteParty = async (id: string | number) => {
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
      
      {/* 1. 상단 타이머 및 ASTRA 위젯 섹션 */}
      <SanctumHeaderWidgets
        isWidgetExpandedMobile={isWidgetExpandedMobile}
        setIsWidgetExpandedMobile={setIsWidgetExpandedMobile}
        uniqueAccountsCount={uniqueAccountsCount}
        totalCharactersCount={totalCharactersCount}
        allRounderLevel={allRounderLevel}
        fieldBossEvent={fieldBossEvent}
        barrierEvent={barrierEvent}
        abyssDisplay={abyssDisplay}
        deepTimer={deepTimer}
        HUNTING_ZONES={HUNTING_ZONES}
        getActiveDeepHoles={getActiveDeepHoles}
        setIsAbyssModalOpen={setIsAbyssModalOpen}
        setIsDeepModalOpen={setIsDeepModalOpen}
        formatTimeHM={formatTimeHM}
        router={router}
      />

      {/* 2. 크로노스 숙제 체크보드 섹션 */}
      <KronosCheckboardSection
        myCharacters={myCharacters}
        dailyTasks={dailyTasks}
        weeklyTasks={weeklyTasks}
        abyssList={abyssList}
        raidList={raidList}
        accountProgressRate={accountProgressRate}
        checkTaskDone={checkTaskDone}
        onToggleTask={handleToggleTask}
        formatName={formatName}
        router={router}
      />

      {/* 3. 시낙시스 오토 파티 매칭 위젯 섹션 */}
      <SynaxisPartySection
        activeParties={activeParties}
        user={user}
        myCharacters={myCharacters}
        allCharactersMap={allCharactersMap}
        formatRoleText={formatRoleText}
        openJoinPopup={openJoinPopup}
        setDetailModalParty={setDetailModalParty}
        handleDeleteParty={handleDeleteParty}
        router={router}
      />

      {/* 4. 판테온 명예의 전당 6대 랭킹 섹션 */}
      <PantheonRankingSection
        currentPantheonCat={currentPantheonCat}
        currentPantheonRankers={currentPantheonRankers}
        pantheonSlideIdx={pantheonSlideIdx}
        setPantheonSlideIdx={setPantheonSlideIdx}
        PANTHEON_CATEGORIES={PANTHEON_CATEGORIES}
        router={router}
      />

      {/* 5. 모달 팝업 집합 */}
      <SanctumModals
        isAbyssModalOpen={isAbyssModalOpen}
        setIsAbyssModalOpen={setIsAbyssModalOpen}
        user={user}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        abyssMins={abyssMins}
        setAbyssMins={setAbyssMins}
        submitAbyssHole={submitAbyssHole}

        isDeepModalOpen={isDeepModalOpen}
        setIsDeepModalOpen={setIsDeepModalOpen}
        deepZoneUID={deepZoneUID}
        setDeepZoneUID={setDeepZoneUID}
        deepCount={deepCount}
        setDeepCount={setDeepCount}
        submitDeepHole={submitDeepHole}
        HUNTING_ZONES={HUNTING_ZONES}

        detailModalParty={detailModalParty}
        setDetailModalParty={setDetailModalParty}
        allCharactersMap={allCharactersMap}
        formatRoleText={formatRoleText}

        joinPopupParty={joinPopupParty}
        setJoinPopupParty={setJoinPopupParty}
        joinSelectedChar={joinSelectedChar}
        setJoinSelectedChar={setJoinSelectedChar}
        joinSelectedRole={joinSelectedRole}
        setJoinSelectedRole={setJoinSelectedRole}
        joinTimeStart={joinTimeStart}
        setJoinTimeStart={setJoinTimeStart}
        joinTimeEnd={joinTimeEnd}
        setJoinTimeEnd={setJoinTimeEnd}
        myCharacters={myCharacters}
        executeJoinParty={executeJoinParty}
      />

    </div>
  );
}
