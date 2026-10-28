"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isTaskChecked } from "../../../lib/matchingUtils";
import ClassIcon from "@/components/common/ClassIcon";
import { filterApprovedCharacters } from "@/lib/approvedCharacters";
import {parseActivityDirectory,formatRecentActivity,type ActivityDirectory} from '@/lib/accountActivity';
import {useAccountOnline} from "@/lib/useAccountOnline";
import { isCurrentParty, isPartyInProgress } from "@/lib/activeParty";

// --- 타입 정의 ---
interface Character {
  id: string | number;
  nickname: string;
  name?: string;
  owner: string;
  job: string;
  combat_power: number;
  magic_resistance: number;
  life_energy: number;
  charm: number;
  contribution: number;
  is_main: boolean;
  sort_order?: number;
  updated_at?: string;
  homework_status?: any;
  raid_checks?: any;
}

interface PartyInfo {
  id: string | number;
  content_name: string;
  difficulty: string;
  status: string;
  time_start: string;
  time_end: string;
  final_start_time?: string;
  party_date?: string;
  created_at?: string;
  members?: Array<{ name?: string; character_name?: string }>;
}

const HOMEWORK_ITEMS = [
  { label: "허상", short: "허상", keys: ['abyss_1', 'abyss1', 'abyss_illusion', 'illusion', '허상', '허상의 정박지'] },
  { label: "동굴", short: "동굴", keys: ['abyss_2', 'abyss2', 'abyss_cave', 'cave', '동굴', '광기의 동굴', '광기'] },
  { label: "물길", short: "물길", keys: ['abyss_3', 'abyss3', 'abyss_waterway', 'waterway', '물길', '흩어진 물길'] },
  { label: "카브", short: "카브", keys: ['raid_kavrak', 'raid1', 'kavrak', '카브', '카브락'] },
  { label: "에렐", short: "에렐", keys: ['raid_eirel', 'raid3', 'eirel', '에렐', '에이렐'] },
  { label: "화석", short: "화석", keys: ['raid_succubus', 'succubus', '화석', '서큐', '서큐버스', '화이트 서큐', '화이트서큐'] },
];

const FALLBACK_ROLE_MAP: Record<string, string[]> = {
  "탱커": ["전사", "기사", "빙결술사"],
  "원딜": ["마법사", "전격술사", "화염술사", "궁수", "장궁병", "석궁사수", "악사", "암흑술사"],
  "근딜": ["대검전사", "검술사", "댄서", "도적", "격투가", "듀얼블레이드"],
  "힐러": ["사제", "수도사", "힐러"],
  "서포터": ["음유시인"]
};

const FALLBACK_ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사", 
  "마법사", "화염술사", "빙결술사", "전격술사", 
  "궁수", "장궁병", "석궁사수", 
  "힐러", "사제", "수도사", "암흑술사", 
  "음유시인", "댄서", "악사", 
  "도적", "격투가", "듀얼블레이드"
];

const formatStatNumber = (val: any) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("ko-KR");
};

async function readDirectory(signal?:AbortSignal){
    const response=await fetch('/api/accounts/directory',{cache:'no-store',signal});if(!response.ok)throw Error('계정 명단을 확인하지 못했어요.');
    const raw=await response.json();if(typeof raw.activityAvailable!=='boolean')throw Error('활동 기록 지원을 확인하지 못했어요.');
    return {value:parseActivityDirectory(raw),available:raw.activityAvailable};
  }

export default function AstraView() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [parties, setParties] = useState<PartyInfo[]>([]);
  const [homeworkMap, setHomeworkMap] = useState<Record<string, any>>({});
  const [nexusContents, setNexusContents] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [dataError, setDataError] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activityDirectory,setActivityDirectory]=useState<ActivityDirectory|null>(null);
  const [activityAvailable,setActivityAvailable]=useState(false);
  const online=useAccountOnline(activityDirectory?.viewer.id??null);
  const onlineLabel=online.mode==='ready'?'온라인':online.mode==='legacy'?'웹 ASTRA 연결':'온라인 확인 불가';
  const directoryGeneration=useRef(0),directoryAbort=useRef<AbortController|null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 필터 상태
  const [showDetailSearch, setShowDetailSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("전체");
  const [minCombat, setMinCombat] = useState<number | "">("");
  const [minMagicResist, setMinMagicResist] = useState<number | "">("");
  const [homeworkFilter, setHomeworkFilter] = useState<string>("전체");
  const [partyFilter, setPartyFilter] = useState<string>("전체");
  const [roleFilter, setRoleFilter] = useState<string>("전체");
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);

  const [selectedCharDetail, setSelectedCharDetail] = useState<{ char: Character; partyInfo?: PartyInfo } | null>(null);

  // 🎯 DB 기반 동적 클래스 목록 및 역할군 매핑 연산
  const dynamicClasses = useMemo(() => {
    if (!dbClasses || dbClasses.length === 0) return FALLBACK_ALL_CLASSES;
    return dbClasses.map((c: any) => c.name);
  }, [dbClasses]);

  const dynamicRoleMap = useMemo(() => {
    if (!dbClasses || dbClasses.length === 0) return FALLBACK_ROLE_MAP;
    const map: Record<string, string[]> = {
      "탱커": [],
      "원딜": [],
      "근딜": [],
      "힐러": [],
      "서포터": []
    };
    dbClasses.forEach((c: any) => {
      const role = c.role || "근딜";
      if (map[role]) {
        if (!map[role].includes(c.name)) map[role].push(c.name);
      } else {
        map[role] = [c.name];
      }
    });
    return map;
  }, [dbClasses]);

  const getKratosClassRank = useCallback((char?: Character): number => {
    if (!char || !char.job) return 0;
    const sameJobChars = characters
      .filter(c => c.job === char.job)
      .sort((a, b) => (Number(b.combat_power) || 0) - (Number(a.combat_power) || 0));
    
    const index = sameJobChars.findIndex(c => c.id === char.id || c.nickname === char.nickname);
    return index >= 0 ? index + 1 : 0;
  }, [characters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCharDetail(null);
    };
    if (selectedCharDetail) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCharDetail]);

  const fetchAstraData = useCallback(async () => {
    const generation=++directoryGeneration.current;
    directoryAbort.current?.abort();const abort=new AbortController();directoryAbort.current=abort;
    try {
      const [charRes, partyRes, hwRes, contRes, classRes, directory] = await Promise.all([
        supabase.from('characters').select('*').order('sort_order', { ascending: true }),
        supabase.from('parties').select('*').neq('status', '종료됨'),
        supabase.from('homework_status').select('*'),
        supabase.from('nexus_contents').select('*'),
        supabase.from('nexus_classes').select('*').order('id', { ascending: true }),
        readDirectory(abort.signal),
      ]);
      if(generation!==directoryGeneration.current||abort.signal.aborted)return;
      setCurrentUser(directory.value.viewer.nickname);setActivityDirectory(previous=>previous&&Date.parse(previous.observedAt)>Date.parse(directory.value.observedAt)?previous:directory.value);setActivityAvailable(directory.available);
      const approvedNames=new Set(directory.value.accounts.map(account=>account.nickname));
      if (charRes.error) throw charRes.error;
      if (partyRes.error) throw partyRes.error;
      setCharacters(filterApprovedCharacters(charRes.data || [], approvedNames));
      if (partyRes.data) setParties(partyRes.data);
      setDataError("");
      if (contRes.data) setNexusContents(contRes.data);
      if (classRes.data) setDbClasses(classRes.data.filter((c: any) => c.is_active ?? true));

      if (hwRes.data) {
        const map: Record<string, any> = {};
        hwRes.data.forEach((h: any) => {
          if (h.nickname) map[h.nickname] = h;
          if (h.character_id) map[h.character_id] = h;
          if (h.id) map[h.id] = h;
          if (h.character_name) map[h.character_name] = h;
        });
        setHomeworkMap(map);
      }
    } catch (err) {
      if(generation!==directoryGeneration.current||abort.signal.aborted)return;
      console.error("아스트라 데이터 불러오기 실패", err);
      setCharacters([]);
      setParties([]);
      setDataError("길드원 명단을 확인하지 못했습니다. 잠시 후 새로고침해 주세요.");
    }
  },[]);

  const invalidateDirectory=useCallback(()=>{directoryGeneration.current++;directoryAbort.current?.abort();},[]);

  useEffect(() => {
    const changed=()=>{setCurrentUser('');setOnlineUsers(new Set());setActivityDirectory(null);setActivityAvailable(false);void fetchAstraData();};
    const storage=(event:StorageEvent)=>{if(event.key==='nexus_user'||event.key==='sanctum_active_account_id')changed();};
    const recorded=()=>{const generation=directoryGeneration.current;void readDirectory(directoryAbort.current?.signal).then(result=>{if(generation!==directoryGeneration.current)return;setActivityDirectory(previous=>previous&&Date.parse(previous.observedAt)>Date.parse(result.value.observedAt)?previous:result.value);setActivityAvailable(result.available);}).catch(()=>{});};
    void fetchAstraData();
    window.addEventListener('sanctum_account_changed',changed);window.addEventListener('storage',storage);
    window.addEventListener('sanctum_activity_recorded',recorded);
    return()=>{invalidateDirectory();window.removeEventListener('sanctum_account_changed',changed);window.removeEventListener('storage',storage);window.removeEventListener('sanctum_activity_recorded',recorded);};
  }, [fetchAstraData,invalidateDirectory]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentUser||online.mode!=='legacy') return;
    let active=true;
    const channel = supabase.channel('sanctum_presence', {
      config: { presence: { key: currentUser } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        if(!active)return;
        const state = channel.presenceState();
        const onlineSet = new Set<string>();
        Object.keys(state).forEach((key) => onlineSet.add(key));
        setOnlineUsers(onlineSet);
      })
      .subscribe(async (status) => {
        if (active&&status === 'SUBSCRIBED') {
          await channel.track({
            user: currentUser,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      active=false;
      supabase.removeChannel(channel);
    };
  }, [currentUser,online.mode]);

  // 🔑 공통 유틸(isTaskChecked)과 homeworkMap/homework_status 결합 판정
  const checkCompleted = useCallback((c: Character, itemKeys: string[]) => {
    if (!c) return false;

    let raidChecks: any[] = [];
    if (Array.isArray(c.raid_checks)) {
      raidChecks = c.raid_checks;
    } else if (typeof c.raid_checks === 'string') {
      try { raidChecks = JSON.parse(c.raid_checks); } catch (e) {}
    }

    if (isTaskChecked(raidChecks, { keys: itemKeys }, nexusContents)) return true;

    let charHw: any = {};
    if (typeof c.homework_status === 'string') {
      try { charHw = JSON.parse(c.homework_status); } catch (e) {}
    } else if (typeof c.homework_status === 'object' && c.homework_status !== null) {
      charHw = c.homework_status;
    }

    const mapRecord = homeworkMap[c.nickname] || homeworkMap[String(c.id)] || (c.name ? homeworkMap[c.name] : {}) || {};
    let mapHw: any = {};
    if (typeof mapRecord.homework_status === 'string') {
      try { mapHw = JSON.parse(mapRecord.homework_status); } catch (e) {}
    } else if (typeof mapRecord.homework_status === 'object' && mapRecord.homework_status !== null) {
      mapHw = mapRecord.homework_status;
    }

    const combinedHw = { ...c, ...charHw, ...mapRecord, ...mapHw };
    for (const k of itemKeys) {
      const val = combinedHw[k];
      if (val === true || val === 1 || val === 'true' || val === 'Y' || val === 'TRUE') return true;
    }

    return false;
  }, [homeworkMap, nexusContents]);

  const totalLuna = characters.length;
  const uniqueOwners = useMemo(() => Array.from(new Set(characters.map(c => c.owner?.trim() || c.nickname))), [characters]);
  const totalSol = uniqueOwners.length;

  const checkAccountOnline = useCallback((ownerKey: string, ownerChars: Character[]) => {
    if(online.mode!=='legacy'){const member=activityDirectory?.accounts.find(row=>row.nickname===ownerKey);return online.mode==='ready'&&!!member&&online.ids.has(member.id);}
    if (onlineUsers.has(ownerKey)) return true;
    return ownerChars.some(c => onlineUsers.has(c.nickname) || onlineUsers.has(c.owner));
  }, [onlineUsers,online,activityDirectory]);

  const onlineSolCount = useMemo(() => {
    return uniqueOwners.filter(ownerKey => {
      const ownerChars = characters.filter(c => (c.owner?.trim() || c.nickname) === ownerKey);
      return checkAccountOnline(ownerKey, ownerChars);
    }).length;
  }, [uniqueOwners, characters, checkAccountOnline]);

  const getCharPartyInfo = useCallback((nickname: string) => {
    return parties.find(p => isCurrentParty(p, nowTick) && p.members?.some(m => (m.name || m.character_name) === nickname));
  }, [parties, nowTick]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedClass("전체");
    setMinCombat("");
    setMinMagicResist("");
    setHomeworkFilter("전체");
    setPartyFilter("전체");
    setRoleFilter("전체");
    setOnlyOnline(false);
  };

  const isFilterActive = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      selectedClass !== "전체" ||
      roleFilter !== "전체" ||
      partyFilter !== "전체" ||
      homeworkFilter !== "전체" ||
      minCombat !== "" ||
      minMagicResist !== "" ||
      onlyOnline
    );
  }, [searchTerm, selectedClass, roleFilter, partyFilter, homeworkFilter, minCombat, minMagicResist, onlyOnline]);

  const isCharacterMatched = useCallback((c: Character, ownerKey: string) => {
    const partyInfo = getCharPartyInfo(c.nickname);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchOwner = ownerKey.toLowerCase().includes(q);
      const matchNick = c.nickname.toLowerCase().includes(q);
      const matchJob = c.job.toLowerCase().includes(q);
      if (!matchOwner && !matchNick && !matchJob) return false;
    }

    if (selectedClass !== "전체" && c.job !== selectedClass) return false;

    if (roleFilter !== "전체") {
      const targetJobs = dynamicRoleMap[roleFilter] || [];
      if (!targetJobs.includes(c.job)) return false;
    }

    if (minCombat !== "" && (Number(c.combat_power) || 0) < Number(minCombat)) return false;
    if (minMagicResist !== "" && (Number(c.magic_resistance) || 0) < Number(minMagicResist)) return false;

    if (partyFilter === "모집중" && (!partyInfo || partyInfo.status === '종료됨' || partyInfo.status === '모집완료')) return false;
    if (partyFilter === "확정" && (!partyInfo || !['모집완료', '매칭 완료'].includes(partyInfo.status))) return false;
    if (partyFilter === "미참여" && partyInfo) return false;

    if (homeworkFilter !== "전체") {
      const targetItem = HOMEWORK_ITEMS.find(item => item.label === homeworkFilter);
      if (targetItem) {
        const done = checkCompleted(c, targetItem.keys);
        if (done) return false;
      }
    }

    return true;
  }, [searchTerm, selectedClass, roleFilter, minCombat, minMagicResist, partyFilter, homeworkFilter, dynamicRoleMap, getCharPartyInfo, checkCompleted]);

  const groupedByOwner = useMemo(() => {
    const list = uniqueOwners.map(ownerKey => {
      const ownerChars = characters.filter(c => (c.owner?.trim() || c.nickname) === ownerKey);
      ownerChars.sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });

      const mainChar = ownerChars.find(c => c.is_main) || ownerChars[0];
      const isOnline = checkAccountOnline(ownerKey, ownerChars);

      const latestSeen=activityDirectory?.accounts.find(account=>account.nickname===ownerKey)?.lastActiveAt;

      return { ownerKey, mainChar, characters: ownerChars, isOnline, latestSeen };
    });

    list.sort((a, b) => {
      if (currentUser) {
        const isAUser = a.ownerKey === currentUser || a.characters.some(c => c.nickname === currentUser || c.owner === currentUser);
        const isBUser = b.ownerKey === currentUser || b.characters.some(c => c.nickname === currentUser || c.owner === currentUser);
        if (isAUser && !isBUser) return -1;
        if (!isAUser && isBUser) return 1;
      }
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;

      return a.ownerKey.localeCompare(b.ownerKey, "ko");
    });

    return list;
  }, [uniqueOwners, characters, checkAccountOnline, currentUser,activityDirectory]);

  const filteredAccounts = useMemo(() => {
    return groupedByOwner.filter(acc => {
      if (onlyOnline && !acc.isOnline) return false;
      return acc.characters.some(c => isCharacterMatched(c, acc.ownerKey));
    });
  }, [groupedByOwner, onlyOnline, isCharacterMatched]);

  const filteredFlatCharacters = useMemo(() => {
    const flatList: { char: Character; ownerKey: string; isOnline: boolean }[] = [];
    groupedByOwner.forEach(acc => {
      if (onlyOnline && !acc.isOnline) return;
      acc.characters.forEach(c => {
        if (isCharacterMatched(c, acc.ownerKey)) {
          flatList.push({ char: c, ownerKey: acc.ownerKey, isOnline: acc.isOnline });
        }
      });
    });
    return flatList;
  }, [groupedByOwner, onlyOnline, isCharacterMatched]);

  const handleNavigateToParty = (partyId?: string | number) => {
    if (partyId) router.push(`/party?id=${partyId}`);
    else router.push('/party');
  };

  return (
    <section className="space-y-2.5 md:space-y-4 animate-in fade-in duration-200 select-none relative">
      <p className="text-xs text-[var(--text-sub)] leading-relaxed">최근 활동과 온라인은 별도예요. {online.mode==="legacy"?"통합 온라인 준비 중이며, 현재 표시는 웹 ASTRA 화면 연결만 나타내요.":online.mode==="ready"?"웹 또는 IRIS 연결이 확인된 길드원을 온라인으로 표시해요.":"온라인 연결을 확인하고 있어요. 최근 활동 기록은 그대로 유지돼요."}</p>
      {dataError && <p role="alert" className="rounded-xl border border-rose-500/50 bg-rose-950/20 px-3 py-2 text-sm text-rose-300">{dataError}</p>}
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-[var(--panel)] border border-[var(--accent)] text-[var(--text-main)] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in slide-in-from-bottom-5 duration-300">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🔍 검색 및 세부 검색 제어바 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] p-2.5 sm:p-3 md:p-3.5 rounded-xl md:rounded-2xl shadow-xs space-y-2.5 md:space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 md:gap-3">
          
          <div className="flex items-center gap-2 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-black text-xs md:text-sm">SOL</span>
              <span className="text-xs md:text-sm font-black text-[var(--text-main)]">
                {totalSol} <span className="text-[0.65rem] md:text-xs text-[var(--text-sub)]">계정</span>
              </span>
              <span className="text-[0.6rem] md:text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black px-2 py-0.5 rounded-full ml-1">
                🟢 {onlineLabel} {online.mode==="ready"||online.mode==="legacy"?onlineSolCount+"명":""}
              </span>
            </div>
            <span className="text-[var(--panel-border)]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sky-400 font-black text-xs md:text-sm">LUNA</span>
              <span className="text-xs md:text-sm font-black text-[var(--text-main)]">{totalLuna} <span className="text-[0.65rem] md:text-xs text-[var(--text-sub)]">캐릭터</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
            <input 
              type="text" 
              placeholder="계정/캐릭터/클래스 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] flex-1 min-w-[130px]"
            />
            
            <button 
              onClick={() => setShowDetailSearch(!showDetailSearch)}
              className={`px-3 py-1.5 md:py-2 rounded-xl border text-xs md:text-sm font-black transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                showDetailSearch ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' : 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)]'
              }`}
            >
              ⚙️ 세부 검색 {showDetailSearch ? "▲" : "▼"}
            </button>

            {isFilterActive && (
              <button 
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 md:py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs md:text-sm font-black text-rose-400 hover:bg-rose-500 hover:text-white shrink-0 cursor-pointer transition flex items-center gap-1"
                title="필터 초기화"
              >
                🔄 초기화
              </button>
            )}
          </div>
        </div>

        {/* 🌟 세부 검색 패널 */}
        {showDetailSearch && (
          <div className="pt-2.5 md:pt-3.5 border-t border-[var(--panel-border)] space-y-2.5 md:space-y-3 animate-in fade-in duration-150">
            
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <button
                onClick={() => setOnlyOnline(!onlyOnline)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  onlyOnline 
                    ? 'bg-emerald-600 text-white border border-emerald-400 shadow-xs' 
                    : 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)] hover:text-[var(--text-main)]'
                }`}
              >
                 🟢 {online.mode==="legacy"?"ASTRA 연결만":"온라인만"}
              </button>

              <div className="grid grid-cols-5 gap-1 bg-[var(--inner-box)] rounded-xl p-1 border border-[var(--panel-border)] md:hidden w-full">
                {["탱커", "원딜", "근딜", "힐러", "서포터"].map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(roleFilter === role ? "전체" : role)}
                    className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                      roleFilter === role 
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                        : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="hidden md:flex items-center bg-[var(--inner-box)] rounded-xl p-1 border border-[var(--panel-border)]">
                {["전체", "탱커", "원딜", "근딜", "힐러", "서포터"].map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      roleFilter === role 
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                        : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer w-full"
              >
                <option value="전체">🛡️ 모든 클래스</option>
                {dynamicClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              <select 
                value={partyFilter} 
                onChange={e => setPartyFilter(e.target.value)}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 md:py-2 rounded-xl font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] text-xs md:text-sm cursor-pointer w-full"
              >
                <option value="전체">🔥 시낙시스 전체</option>
                <option value="모집중">🔥 파티 모집중만</option>
                <option value="확정">✅ 출발 확정만</option>
                <option value="미참여">💤 파티 미참여만</option>
              </select>

              <select 
                value={homeworkFilter} 
                onChange={e => setHomeworkFilter(e.target.value)}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 md:py-2 rounded-xl font-bold text-amber-400 outline-none focus:border-[var(--accent)] text-xs md:text-sm cursor-pointer w-full"
              >
                <option value="전체">📋 숙제 미완료 필터(전체)</option>
                {HOMEWORK_ITEMS.map(item => (
                  <option key={item.label} value={item.label}>🔴 {item.label} 미완료만 보기</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--panel-border)]/40">
              <div className="flex items-center justify-between gap-1.5 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] min-w-0">
                <span className="text-[0.68rem] md:text-xs font-black text-red-400 whitespace-nowrap shrink-0">최소 전투력</span>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={minCombat}
                  onChange={e => setMinCombat(e.target.value ? Number(e.target.value) : "")}
                  className="bg-transparent font-bold text-[var(--text-main)] outline-none w-full text-xs md:text-sm text-right min-w-0"
                />
              </div>

              <div className="flex items-center justify-between gap-1.5 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] min-w-0">
                <span className="text-[0.68rem] md:text-xs font-black text-sky-400 whitespace-nowrap shrink-0">최소 마도저항</span>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={minMagicResist}
                  onChange={e => setMinMagicResist(e.target.value ? Number(e.target.value) : "")}
                  className="bg-transparent font-bold text-[var(--text-main)] outline-none w-full text-xs md:text-sm text-right min-w-0"
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 🌟 모드 1: 검색/필터 적용 시 - 플랫 단일 캐릭터 리스트 */}
      {isFilterActive ? (
        <div className="space-y-1.5 md:space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs md:text-sm font-bold text-[var(--text-sub)]">
            <span>🔍 검색 결과: <strong className="text-[var(--accent)]">{filteredFlatCharacters.length}</strong>개 캐릭터</span>
            <button onClick={handleResetFilters} className="text-rose-400 hover:underline cursor-pointer">전체 계정 보기로 돌아가기</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5 md:gap-3">
            {filteredFlatCharacters.map(({ char, ownerKey, isOnline }) => {
              const partyInfo = getCharPartyInfo(char.nickname);
              const isLfg = !!partyInfo;
              const kratosRank = getKratosClassRank(char);

              return (
                <div
                  key={`${ownerKey}-${char.nickname}`}
                  onClick={() => setSelectedCharDetail({ char, partyInfo })}
                  className={`bg-[var(--inner-box)] border rounded-lg md:rounded-xl p-2 md:p-3 hover:border-[var(--accent)] transition-all cursor-pointer relative shadow-2xs md:shadow-md ${
                    isLfg ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/20' : 'border-[var(--panel-border)] hover:bg-[var(--panel)]/50'
                  }`}
                >
                  <div className="flex flex-wrap gap-x-2 text-xs text-[var(--text-sub)] mb-1">
                    <span>{activityAvailable?formatRecentActivity(activityDirectory?.accounts.find(account=>account.nickname===ownerKey)?.lastActiveAt,nowTick):'활동 기록 준비 중'}</span>
                    {isOnline&&<span className="text-emerald-400">{online.mode==="legacy"?"웹 ASTRA 연결":"온라인"}</span>}
                  </div>
                  <div className="md:hidden flex items-center justify-between gap-1.5 w-full">
                    <div className="flex flex-col justify-center space-y-0.5 min-w-0 flex-1 pr-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <ClassIcon job={char.job} kratosClassRank={kratosRank} size="sm" />
                        {char.is_main && <span className="text-[0.45rem] bg-amber-500 text-black font-black px-0.5 rounded shrink-0">대표</span>}
                        <span className="font-black text-xs text-[var(--text-main)] whitespace-normal [overflow-wrap:anywhere]" title={char.nickname}>
                          {char.nickname}
                        </span>
                        {isLfg && (
                          <span className="text-[0.48rem] bg-rose-600 text-white font-black px-1 rounded shrink-0 animate-pulse">
                            {partyInfo && isPartyInProgress(partyInfo, nowTick) ? "파티중" : "파티 예정"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[0.58rem] font-bold text-[var(--text-sub)] whitespace-nowrap">
                        <span>전투력 <strong className="text-red-400 font-black">{formatStatNumber(char.combat_power)}</strong></span>
                        <span>마도저항 <strong className="text-sky-400 font-black">{formatStatNumber(char.magic_resistance)}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-0.5 shrink-0 w-[138px]">
                      {HOMEWORK_ITEMS.map((item) => {
                        const done = checkCompleted(char, item.keys);
                        return (
                          <div 
                            key={item.label}
                            className={`py-0.5 text-center text-[0.58rem] font-black rounded border transition-all ${
                              done 
                                ? 'bg-amber-500 text-black border-amber-400 shadow-2xs' 
                                : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] opacity-35'
                            }`}
                          >
                            {item.short}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col justify-between space-y-2 w-full">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ClassIcon job={char.job} kratosClassRank={kratosRank} size="sm" />
                        {char.is_main && <span className="text-[0.55rem] bg-amber-500 text-black font-black px-1 rounded shrink-0">대표</span>}
                        <span className="font-black text-base text-[var(--text-main)] whitespace-normal [overflow-wrap:anywhere]" title={char.nickname}>
                          {char.nickname}
                        </span>
                      </div>
                      {isLfg && (
                        <span className="text-[0.58rem] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded shrink-0 animate-pulse">
                          {partyInfo && isPartyInProgress(partyInfo, nowTick) ? "파티중" : "파티 예정"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-sub)] bg-[var(--panel)] px-2 py-1 rounded border border-[var(--panel-border)]/50">
                      <span>전투력 <strong className="text-red-400 font-black">{formatStatNumber(char.combat_power)}</strong></span>
                      <span>마도저항 <strong className="text-sky-400 font-black">{formatStatNumber(char.magic_resistance)}</strong></span>
                    </div>

                    <div className="grid grid-cols-6 gap-1 pt-0.5">
                      {HOMEWORK_ITEMS.map((item) => {
                        const done = checkCompleted(char, item.keys);
                        return (
                          <div 
                            key={item.label}
                            className={`py-1 text-center text-xs font-black rounded border transition-all ${
                              done 
                                ? 'bg-amber-500 text-black border-amber-400 shadow-2xs' 
                                : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] opacity-50 hover:opacity-90'
                            }`}
                          >
                            {item.short}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:gap-4">
          {filteredAccounts.map(acc => {
            const isMyAccount = currentUser && (acc.ownerKey === currentUser || acc.characters.some(c => c.nickname === currentUser || c.owner === currentUser));
            const mainKratosRank = getKratosClassRank(acc.mainChar);
            const mainCharName = acc.mainChar?.nickname || acc.ownerKey;

            return (
              <div 
                key={acc.ownerKey} 
                className={`bg-[var(--panel)] border rounded-xl md:rounded-2xl p-2 md:p-3.5 shadow-2xs md:shadow-md space-y-1.5 md:space-y-3 transition-all ${
                  isMyAccount 
                    ? 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.18)] bg-amber-950/10' 
                    : 'border-[var(--panel-border)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between border-b border-[var(--panel-border)] pb-1.5 md:pb-2 gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 bg-[var(--inner-box)] px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl border border-[var(--panel-border)] min-w-0 shadow-2xs">
                    <ClassIcon job={acc.mainChar?.job || "전사"} kratosClassRank={mainKratosRank} size="sm" />
                    <span className="font-black text-xs sm:text-sm md:text-base text-[var(--text-main)] whitespace-normal [overflow-wrap:anywhere]" title={mainCharName}>
                      {mainCharName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${acc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500/50'}`}></span>
                      <span className={`text-xs font-bold px-1.5 md:px-2 py-0.2 md:py-0.5 rounded border ${
                        acc.isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-black' : 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)]'
                      }`}>
                        {activityAvailable?formatRecentActivity(acc.latestSeen,nowTick):'활동 기록 준비 중'}
                      </span>
                      {acc.isOnline&&<span className="text-xs text-emerald-400">{online.mode==="legacy"?"웹 ASTRA 연결":"온라인"}</span>}
                    </div>

                    <span className="text-[0.55rem] md:text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 md:px-2.5 py-0.2 md:py-1 rounded-md md:rounded-lg flex items-center gap-1 shrink-0">
                      <span className="text-amber-400 text-[0.5rem] md:text-xs">⚜️</span>
                      <span>{acc.characters.length} LUNA</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1 md:gap-3">
                  {acc.characters.map(c => {
                    const partyInfo = getCharPartyInfo(c.nickname);
                    const isLfg = !!partyInfo;
                    const charKratosRank = getKratosClassRank(c);

                    return (
                      <div 
                        key={c.nickname}
                        onClick={() => setSelectedCharDetail({ char: c, partyInfo })}
                        className={`bg-[var(--inner-box)] border rounded-lg md:rounded-xl p-2 md:p-3 transition-all cursor-pointer relative ${
                          isLfg ? 'border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/40' : 'border-[var(--panel-border)] hover:bg-[var(--panel)]/50 hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="md:hidden flex items-center justify-between gap-1.5 w-full">
                          <div className="flex flex-col justify-center space-y-0.5 min-w-0 flex-1 pr-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <ClassIcon job={c.job} kratosClassRank={charKratosRank} size="sm" />
                              {c.is_main && <span className="text-[0.45rem] bg-amber-500 text-black font-black px-0.5 rounded shrink-0">대표</span>}
                              <span className="font-black text-xs text-[var(--text-main)] whitespace-normal [overflow-wrap:anywhere]" title={c.nickname}>
                                {c.nickname}
                              </span>
                              {isLfg && (
                                <span className="text-[0.48rem] bg-rose-600 text-white font-black px-1 rounded shrink-0 animate-pulse">
                                  {partyInfo && isPartyInProgress(partyInfo, nowTick) ? "파티중" : "파티 예정"}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[0.58rem] font-bold text-[var(--text-sub)] whitespace-nowrap">
                              <span>전투력 <strong className="text-red-400 font-black">{formatStatNumber(c.combat_power)}</strong></span>
                              <span>마도저항 <strong className="text-sky-400 font-black">{formatStatNumber(c.magic_resistance)}</strong></span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-0.5 shrink-0 w-[138px]">
                            {HOMEWORK_ITEMS.map((item) => {
                              const done = checkCompleted(c, item.keys);
                              return (
                                <div 
                                  key={item.label}
                                  className={`py-0.5 text-center text-[0.58rem] font-black rounded border transition-all ${
                                    done 
                                      ? 'bg-amber-500 text-black border-amber-400 shadow-2xs' 
                                      : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] opacity-35'
                                  }`}
                                >
                                  {item.short}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col justify-between space-y-2 w-full">
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ClassIcon job={c.job} kratosClassRank={charKratosRank} size="sm" />
                              {c.is_main && <span className="text-[0.55rem] bg-amber-500 text-black font-black px-1 rounded shrink-0">대표</span>}
                              <span className="font-black text-base text-[var(--text-main)] whitespace-normal [overflow-wrap:anywhere]" title={c.nickname}>
                                {c.nickname}
                              </span>
                            </div>
                            {isLfg && (
                              <span className="text-[0.58rem] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded shrink-0 animate-pulse">
                                {partyInfo && isPartyInProgress(partyInfo, nowTick) ? "파티중" : "파티 예정"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-sub)] bg-[var(--panel)] px-2 py-1 rounded border border-[var(--panel-border)]/50">
                            <span>전투력 <strong className="text-red-400 font-black">{formatStatNumber(c.combat_power)}</strong></span>
                            <span>마도저항 <strong className="text-sky-400 font-black">{formatStatNumber(c.magic_resistance)}</strong></span>
                          </div>

                          <div className="grid grid-cols-6 gap-1 pt-0.5">
                            {HOMEWORK_ITEMS.map((item) => {
                              const done = checkCompleted(c, item.keys);
                              return (
                                <div 
                                  key={item.label}
                                  className={`py-1 text-center text-xs font-black rounded border transition-all ${
                                    done 
                                      ? 'bg-amber-500 text-black border-amber-400 shadow-2xs' 
                                      : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] opacity-50 hover:opacity-90'
                                  }`}
                                >
                                  {item.short}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🌟 상세보기 모달 */}
      {selectedCharDetail && (
        <div 
          className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedCharDetail(null)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-sm w-full p-4 shadow-2xl relative space-y-3 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <ClassIcon job={selectedCharDetail.char.job} kratosClassRank={getKratosClassRank(selectedCharDetail.char)} size="md" />
                <div className="min-w-0">
                  <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-1.5 truncate">
                    <span className="truncate">{selectedCharDetail.char.nickname}</span>
                    {selectedCharDetail.char.is_main && <span className="text-[0.55rem] bg-amber-500 text-black font-black px-1 rounded shrink-0">대표</span>}
                  </h3>
                  <p className="text-[0.62rem] font-bold text-[var(--text-sub)] truncate">
                    계정: {selectedCharDetail.char.owner || selectedCharDetail.char.nickname} · {selectedCharDetail.char.job}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCharDetail(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-base font-black p-1 rounded-md hover:bg-[var(--inner-box)] transition cursor-pointer shrink-0">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)]">
              <div>
                <span className="text-[var(--text-sub)] block text-[0.58rem]">전투력</span>
                <span className="text-red-400 font-black text-sm">{formatStatNumber(selectedCharDetail.char.combat_power)}</span>
              </div>
              <div>
                <span className="text-[var(--text-sub)] block text-[0.58rem]">마도저항</span>
                <span className="text-sky-400 font-black text-sm">{formatStatNumber(selectedCharDetail.char.magic_resistance)}</span>
              </div>
            </div>

            <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-1.5">
                <span className="text-xs font-black text-[#e6c788] flex items-center gap-1">
                  <span>📋</span> 이번 주 숙제 현황
                </span>
                <span className="text-[0.55rem] text-[var(--text-sub)] font-bold">크로노스 실시간 연동</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {HOMEWORK_ITEMS.map((item) => {
                  const done = checkCompleted(selectedCharDetail.char, item.keys);
                  return (
                    <div 
                      key={item.label}
                      className={`p-1.5 rounded border text-center text-xs font-black ${
                        done 
                          ? 'bg-amber-500 text-black border-amber-400' 
                          : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] opacity-60'
                      }`}
                    >
                      {item.label} {done ? '✅' : '🔴'}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCharDetail.partyInfo ? (
              <div className="bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400">🔥 시낙시스 매칭 현황</span>
                  <span className="text-[0.6rem] font-bold bg-rose-900/50 text-rose-200 px-1.5 py-0.2 rounded">{selectedCharDetail.partyInfo.status}</span>
                </div>
                <div className="text-xs font-bold text-[var(--text-main)]">
                  목표: {selectedCharDetail.partyInfo.content_name} ({selectedCharDetail.partyInfo.difficulty})
                </div>
                <div className="text-[0.65rem] text-[var(--text-sub)] font-mono">
                  시간: {selectedCharDetail.partyInfo.time_start} ~ {selectedCharDetail.partyInfo.time_end}
                </div>
                
                <button 
                  onClick={() => handleNavigateToParty(selectedCharDetail.partyInfo?.id)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition shadow cursor-pointer mt-1 flex items-center justify-center gap-1.5"
                >
                  <span>⚔️</span>
                  <span>해당 시낙시스 파티룸으로 직행</span>
                </button>
              </div>
            ) : (
              <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-center text-xs text-[var(--text-sub)] font-bold">
                현재 참여 중인 시낙시스 파티가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
