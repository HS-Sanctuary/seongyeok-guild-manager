"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
  last_seen_at?: string;
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
  members?: Array<{ name: string }>;
}

const HOMEWORK_ITEMS = [
  { label: "허상", keys: ['abyss_1', 'abyss1', 'abyss_illusion', 'illusion', '허상', '허상의 정박지'] },
  { label: "동굴", keys: ['abyss_2', 'abyss2', 'abyss_cave', 'cave', '동굴', '광기의 동굴', '광기'] },
  { label: "물길", keys: ['abyss_3', 'abyss3', 'abyss_waterway', 'waterway', '물길', '흩어진 물길'] },
  { label: "카브", keys: ['raid_kavrak', 'raid1', 'kavrak', '카브', '카브락'] },
  { label: "에렐", keys: ['raid_eirel', 'raid3', 'eirel', '에렐', '에이렐'] },
  { label: "화석", keys: ['raid_succubus', 'succubus', '화석', '서큐', '서큐버스', '화이트 서큐', '화이트서큐'] },
];

const ROLE_MAP: Record<string, string[]> = {
  "탱커": ["전사", "기사", "빙결술사"],
  "원딜": ["마법사", "전격술사", "화염술사", "궁수", "장궁병", "석궁사수", "악사", "암흑술사"],
  "근딜": ["대검전사", "검술사", "댄서", "도적", "격투가", "듀얼블레이드"],
  "힐러": ["사제", "수도사", "힐러"],
  "서포터": ["음유시인"]
};

const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사", 
  "마법사", "화염술사", "빙결술사", "전격술사", 
  "궁수", "장궁병", "석궁사수", 
  "힐러", "사제", "수도사", "암흑술사", 
  "음유시인", "댄서", "악사", 
  "도적", "격투가", "듀얼블레이드"
];

const formatLastSeen = (dateString?: string) => {
  if (!dateString) return "접속 기록 없음";
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  return `${diffDay}일 전`;
};

export default function AstraView() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [parties, setParties] = useState<PartyInfo[]>([]);
  const [homeworkMap, setHomeworkMap] = useState<Record<string, any>>({});
  const [nexusContents, setNexusContents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // 토스트 알림 상태
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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const name = parsed.username || parsed.nickname || parsed.owner || "한설";
        setCurrentUser(name);
        updateUserLastSeen(name);
      } catch(e) {}
    } else {
      setCurrentUser("한설");
    }
    fetchAstraData();
  }, []);

  const updateUserLastSeen = async (username: string) => {
    try {
      await supabase
        .from('characters')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('owner', username);
    } catch (e) {
      console.error("접속 시간 업데이트 실패", e);
    }
  };

  // Supabase Realtime Presence
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('sanctum_presence', {
      config: { presence: { key: currentUser } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineSet = new Set<string>();
        Object.keys(state).forEach((key) => onlineSet.add(key));
        setOnlineUsers(onlineSet);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: currentUser,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const fetchAstraData = async () => {
    try {
      const [charRes, partyRes, hwRes, contRes] = await Promise.all([
        supabase.from('characters').select('*').order('sort_order', { ascending: true }),
        supabase.from('parties').select('*').neq('status', '종료됨'),
        supabase.from('homework_status').select('*'),
        supabase.from('nexus_contents').select('*')
      ]);

      if (charRes.data) setCharacters(charRes.data);
      if (partyRes.data) setParties(partyRes.data);
      if (contRes.data) setNexusContents(contRes.data);

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
      console.error("아스트라 데이터 불러오기 실패", err);
    }
  };

  const checkCompleted = useCallback((c: Character, itemKeys: string[]) => {
    if (!c) return false;
    let raidChecks: any[] = [];
    if (Array.isArray(c.raid_checks)) {
      raidChecks = c.raid_checks;
    } else if (typeof c.raid_checks === 'string') {
      try { raidChecks = JSON.parse(c.raid_checks); } catch (e) {}
    }

    const checkedNames = new Set<string>();
    if (Array.isArray(raidChecks)) {
      for (const check of raidChecks) {
        const checkStr = String(check).trim();
        for (const nc of nexusContents) {
          if (String(nc.id).trim() === checkStr) {
            if (nc.name) checkedNames.add(String(nc.name).trim());
            if (nc.mobile_name) checkedNames.add(String(nc.mobile_name).trim());
          }
        }
        if (!/^\d+$/.test(checkStr)) checkedNames.add(checkStr);
      }
    }

    for (const k of itemKeys) {
      const kClean = k.trim().toLowerCase();
      for (const name of Array.from(checkedNames)) {
        const nameClean = name.toLowerCase();
        if (kClean === nameClean || kClean.includes(nameClean) || nameClean.includes(kClean)) return true;
      }
    }

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
    if (onlineUsers.has(ownerKey)) return true;
    return ownerChars.some(c => onlineUsers.has(c.nickname) || onlineUsers.has(c.owner));
  }, [onlineUsers]);

  const onlineSolCount = useMemo(() => {
    return uniqueOwners.filter(ownerKey => {
      const ownerChars = characters.filter(c => (c.owner?.trim() || c.nickname) === ownerKey);
      return checkAccountOnline(ownerKey, ownerChars);
    }).length;
  }, [uniqueOwners, characters, checkAccountOnline]);

  const getCharPartyInfo = useCallback((nickname: string) => {
    return parties.find(p => p.members?.some((m: any) => m.name === nickname));
  }, [parties]);

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

      const latestSeen = ownerChars
        .map(c => c.last_seen_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

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
  }, [uniqueOwners, characters, checkAccountOnline, currentUser]);

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
      const targetJobs = ROLE_MAP[roleFilter] || [];
      if (!targetJobs.includes(c.job)) return false;
    }

    if (minCombat !== "" && (c.combat_power || 0) < Number(minCombat)) return false;
    if (minMagicResist !== "" && (c.magic_resistance || 0) < Number(minMagicResist)) return false;

    if (partyFilter === "모집중" && (!partyInfo || partyInfo.status === '종료됨' || partyInfo.status === '모집완료')) return false;
    if (partyFilter === "확정" && (!partyInfo || partyInfo.status !== '모집완료')) return false;
    if (partyFilter === "미참여" && partyInfo) return false;

    if (homeworkFilter !== "전체") {
      const targetItem = HOMEWORK_ITEMS.find(item => item.label === homeworkFilter);
      if (targetItem) {
        const done = checkCompleted(c, targetItem.keys);
        if (done) return false;
      }
    }

    return true;
  }, [searchTerm, selectedClass, roleFilter, minCombat, minMagicResist, partyFilter, homeworkFilter, getCharPartyInfo, checkCompleted]);

  const filteredAccounts = useMemo(() => {
    return groupedByOwner.filter(acc => {
      if (onlyOnline && !acc.isOnline) return false;
      return acc.characters.some(c => isCharacterMatched(c, acc.ownerKey));
    });
  }, [groupedByOwner, onlyOnline, isCharacterMatched]);

  // 다이렉트 파티 이동 핸들러
  const handleNavigateToParty = (partyId?: string | number) => {
    if (partyId) {
      router.push(`/party?id=${partyId}`);
    } else {
      router.push('/party');
    }
  };

  return (
    <section className="space-y-4 animate-in fade-in duration-200 select-none relative">
      
      {/* 토스트 알림 팝업 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-[var(--panel)] border border-[var(--accent)] text-[var(--text-main)] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in slide-in-from-bottom-5 duration-300">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🔍 검색 및 세부 검색 제어바 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] p-2.5 sm:p-3 rounded-2xl shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-2 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-black text-xs">SOL</span>
              <span className="text-xs font-black text-[var(--text-main)]">
                {totalSol} <span className="text-[0.65rem] text-[var(--text-sub)]">계정</span>
              </span>
              <span className="text-[0.6rem] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black px-1.5 py-0.2 rounded-full ml-1">
                🟢 {onlineSolCount}명 접속 중
              </span>
            </div>
            <span className="text-[var(--panel-border)]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sky-400 font-black text-xs">LUNA</span>
              <span className="text-xs font-black text-[var(--text-main)]">{totalLuna} <span className="text-[0.65rem] text-[var(--text-sub)]">캐릭터</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
            <input 
              type="text" 
              placeholder="계정/캐릭터/클래스 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] flex-1 min-w-[140px]"
            />
            
            <button 
              onClick={() => setShowDetailSearch(!showDetailSearch)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                showDetailSearch ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' : 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)]'
              }`}
            >
              ⚙️ 세부 검색 {showDetailSearch ? "▲" : "▼"}
            </button>

            <button 
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] shrink-0 cursor-pointer transition flex items-center gap-1"
              title="필터 초기화"
            >
              🔄 초기화
            </button>
          </div>
        </div>

        {/* 세부 검색 펼침 패널 */}
        {showDetailSearch && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[var(--panel-border)] text-xs animate-in fade-in duration-150">
            
            <button
              onClick={() => setOnlyOnline(!onlyOnline)}
              className={`px-2.5 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1 ${
                onlyOnline 
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-sm' 
                  : 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]'
              }`}
            >
              🟢 온라인 유저만
            </button>

            <div className="flex items-center bg-[var(--inner-box)] rounded-lg p-0.5 border border-[var(--panel-border)]">
              {["전체", "탱커", "원딜", "근딜", "힐러", "서포터"].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-md text-[0.72rem] font-black transition cursor-pointer ${
                    roleFilter === role ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {role === "전체" ? "전체" : role === "탱커" ? "🛡️ 탱커" : role === "원딜" ? "🎯 원딜" : role === "근딜" ? "⚔️ 근딜" : role === "힐러" ? "🌿 힐러" : "🎵 서포터"}
                </button>
              ))}
            </div>

            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="전체">모든 클래스</option>
              {ALL_CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select 
              value={partyFilter} 
              onChange={e => setPartyFilter(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] text-xs cursor-pointer"
            >
              <option value="전체">🔥 시낙시스 전체</option>
              <option value="모집중">🔥 파티 모집중만</option>
              <option value="확정">✅ 출발 확정만</option>
              <option value="미참여">💤 파티 미참여만</option>
            </select>

            <select 
              value={homeworkFilter} 
              onChange={e => setHomeworkFilter(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg font-bold text-amber-400 outline-none focus:border-[var(--accent)] text-xs cursor-pointer"
            >
              <option value="전체">📋 숙제 미완료 필터(전체)</option>
              {HOMEWORK_ITEMS.map(item => (
                <option key={item.label} value={item.label}>🔴 {item.label} 미완료만 보기</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
              <input 
                type="number" 
                placeholder="최소 전투력" 
                value={minCombat}
                onChange={e => setMinCombat(e.target.value ? Number(e.target.value) : "")}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] w-28 text-xs shrink-0"
              />
              <input 
                type="number" 
                placeholder="최소 마도저항" 
                value={minMagicResist}
                onChange={e => setMinMagicResist(e.target.value ? Number(e.target.value) : "")}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] w-28 text-xs shrink-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* 계정별 캐릭터 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAccounts.map(acc => {
          const isMyAccount = currentUser && (acc.ownerKey === currentUser || acc.characters.some(c => c.nickname === currentUser || c.owner === currentUser));

          return (
            <div 
              key={acc.ownerKey} 
              className={`bg-[var(--panel)] border rounded-2xl p-3.5 shadow-sm space-y-3 transition-all ${
                isMyAccount 
                  ? 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)] bg-amber-950/5' 
                  : 'border-[var(--panel-border)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between border-b border-[var(--panel-border)] pb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 max-w-[calc(100%-100px)]">
                  {isMyAccount && (
                    <span className="text-[0.55rem] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded shrink-0">
                      내 계정
                    </span>
                  )}
                  
                  <span className="font-black text-base text-[var(--text-main)] truncate max-w-[140px] sm:max-w-[220px]" title={acc.ownerKey}>
                    {acc.ownerKey}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${acc.isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500/50'}`}></span>
                    <span className={`text-[0.58rem] font-black px-1.5 py-0.2 rounded border ${
                      acc.isOnline 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                    }`}>
                      {acc.isOnline ? '🟢 생텀 접속 중' : `⚪ ${formatLastSeen(acc.latestSeen)}`}
                    </span>
                  </div>

                  <span className="text-[0.6rem] bg-[var(--accent)] text-[var(--accent-fg)] font-black px-1.5 py-0.5 rounded truncate max-w-[130px] sm:max-w-[200px] shrink-0" title={`대표: ${acc.mainChar?.nickname} (${acc.mainChar?.job})`}>
                    대표: {acc.mainChar?.nickname} ({acc.mainChar?.job})
                  </span>
                </div>

                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] shrink-0">
                  보유 {acc.characters.length}캐릭터
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                {acc.characters.map(c => {
                  const partyInfo = getCharPartyInfo(c.nickname);
                  const isLfg = !!partyInfo;
                  const matched = isCharacterMatched(c, acc.ownerKey);

                  return (
                    <div 
                      key={c.nickname}
                      onClick={() => setSelectedCharDetail({ char: c, partyInfo })}
                      className={`bg-[var(--inner-box)] border rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                        matched 
                          ? 'border-[var(--accent)] shadow-[0_0_10px_rgba(212,163,89,0.3)] bg-[var(--accent-soft)]/10 opacity-100 ring-2 ring-amber-500/50' 
                          : 'border-[var(--panel-border)] opacity-30 hover:opacity-60'
                      } ${isLfg && matched ? 'border-rose-500 ring-2 ring-rose-500/50' : ''}`}
                    >
                      {isLfg && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`text-[0.52rem] font-black px-1.5 py-0.2 rounded truncate max-w-full animate-pulse ${
                            partyInfo.status === '모집완료' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {partyInfo.status === '모집완료' ? `✅ 확정 ${partyInfo.final_start_time}` : `🔥 모집중 (${partyInfo.content_name})`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {c.is_main && <span className="text-[0.5rem] bg-amber-500 text-black font-black px-1 rounded shrink-0">대표</span>}
                            <h5 className="font-black text-sm text-[var(--text-main)] truncate" title={c.nickname}>
                              {c.nickname}
                            </h5>
                          </div>
                          <span className="text-[0.62rem] font-bold text-[var(--text-sub)]">{c.job}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 mt-2 text-[0.6rem] font-bold text-center">
                        <div className="bg-[var(--panel)] p-1 rounded border border-[var(--panel-border)]">
                          <span className="text-[0.52rem] text-red-400 block">전투력</span>
                          <span className="text-[var(--text-main)] font-black">{(c.combat_power || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-[var(--panel)] p-1 rounded border border-[var(--panel-border)]">
                          <span className="text-[0.52rem] text-sky-400 block">마도저항</span>
                          <span className="text-[var(--text-main)] font-black">{(c.magic_resistance || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[var(--panel-border)] grid grid-cols-3 gap-1">
                        {HOMEWORK_ITEMS.map((item) => {
                          const done = checkCompleted(c, item.keys);
                          return (
                            <div 
                              key={item.label}
                              className={`py-1 rounded text-[0.62rem] text-center border transition-all ${
                                done 
                                  ? 'bg-[#d4a359] text-black border-[#e0b268] font-black shadow-sm' 
                                  : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] font-bold opacity-60'
                              }`}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세보기 모달 */}
      {selectedCharDetail && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedCharDetail(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCharDetail(null)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">✕</button>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[0.6rem] bg-[var(--accent)] text-[var(--accent-fg)] font-black px-1.5 py-0.2 rounded">{selectedCharDetail.char.job}</span>
                <h3 className="text-lg font-black text-[var(--text-main)]">{selectedCharDetail.char.nickname}</h3>
              </div>
              <p className="text-[0.65rem] font-bold text-[var(--text-sub)] mt-0.5">소유 계정: {selectedCharDetail.char.owner || selectedCharDetail.char.nickname}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)]">
              <div>
                <span className="text-[var(--text-sub)] block text-[0.6rem]">전투력</span>
                <span className="text-red-400 font-black text-sm">{(selectedCharDetail.char.combat_power || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[var(--text-sub)] block text-[0.6rem]">마도저항</span>
                <span className="text-sky-400 font-black text-sm">{(selectedCharDetail.char.magic_resistance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-2">
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
                      className={`p-2 rounded border text-center text-xs font-black ${
                        done 
                          ? 'bg-[#d4a359] text-black border-[#e0b268]' 
                          : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)]'
                      }`}
                    >
                      {item.label} {done ? '✅' : '🔴'}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCharDetail.partyInfo ? (
              <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl space-y-2">
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
                
                {/* 🎯 개선: 파티 ID 파라미터를 들고 파티룸으로 직행 다이렉트 연동 */}
                <button 
                  onClick={() => handleNavigateToParty(selectedCharDetail.partyInfo?.id)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition shadow cursor-pointer mt-1 flex items-center justify-center gap-1.5"
                >
                  <span>⚔️</span>
                  <span>해당 시낙시스 파티룸으로 직행</span>
                </button>
              </div>
            ) : (
              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] text-center text-xs text-[var(--text-sub)] font-bold">
                현재 참여 중인 시낙시스 파티가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}