"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import CharacterStats from "@/components/character/CharacterStats";
import ClassLevelManager from "@/components/character/ClassLevelManager";
import ContentChecklist from "@/components/character/ContentChecklist";
import TradeList from "@/components/character/TradeList";
import CharacterSelector from "@/components/character/CharacterSelector";
import CharacterManageModal from "@/components/character/CharacterManageModal";

const CATEGORY_THEMES: Record<string, any> = {
  TELOS: { tags: ['bg-purple-500/30 text-purple-300 border-purple-400', 'bg-purple-800/40 text-purple-400 border-purple-600/80', 'bg-purple-950/50 text-purple-500 border-purple-800/70'] },
  KRATOS: { tags: ['bg-red-500/30 text-red-300 border-red-400', 'bg-red-800/40 text-red-400 border-red-600/80', 'bg-red-950/50 text-red-500 border-red-800/70'] },
  TECHNE: { tags: ['bg-blue-500/30 text-blue-300 border-blue-400', 'bg-blue-800/40 text-blue-400 border-blue-600/80', 'bg-blue-950/50 text-blue-500 border-blue-800/70'] },
  HARMONIA: { tags: ['bg-yellow-500/30 text-yellow-300 border-yellow-400', 'bg-yellow-700/40 text-yellow-400 border-yellow-600/80', 'bg-yellow-900/40 text-yellow-500 border-yellow-800/70'] },
  PIETAS: { tags: ['bg-emerald-500/30 text-emerald-300 border-emerald-400', 'bg-emerald-800/40 text-emerald-400 border-emerald-600/80', 'bg-emerald-950/50 text-emerald-500 border-emerald-800/70'] }
};

const TOP_TITLES = { 
  TELOS: ['헬리오스', '셀레네', '에오스'], 
  PIETAS: ['시리우스', '레굴루스', '알데바란'], 
  TECHNE: ['폴리매스', '마이스터', '아르티장'], 
  HARMONIA: ['아글라이아', '카리스', '칼로스'] 
};

const CLASS_TITLES: Record<string, string[]> = {
  "전사": ["검투신", "검투왕", "검투사", "전사"], "대검전사": ["파괴신", "파괴왕", "광전사", "대검전사"], "검술사": ["검신", "검왕", "검성", "검술사"], "기사": ["수호신", "수호왕", "수호기사", "기사"],
  "마법사": ["마신", "대현자", "현자", "마법사"], "화염술사": ["화신", "염왕", "염마", "화염술사"], "빙결술사": ["빙신", "빙왕", "빙마", "빙결술사"], "전격술사": ["뢰신", "뇌왕", "뇌마", "전격술사"],
  "궁수": ["폭풍신", "폭풍왕", "화랑", "궁수"], "장궁병": ["신궁", "천궁", "명궁", "장궁병"], "석궁사수": ["파천궁신", "파천궁제", "파천사수", "석궁사수"],
  "음유시인": ["셰익스피어", "호메로스", "오르페우스", "음유시인"], "댄서": ["플로라비", "파피에르", "블루에트", "댄서"], "악사": ["마에스트로", "비르투오사", "솔리스트", "악사"],
  "힐러": ["그라시아", "베네딕토", "렐릭스", "힐러"], "사제": ["메시아", "디바인", "프리스트", "사제"], "수도사": ["아라한", "금강", "나한", "수도사"], "암흑술사": ["암제", "암왕", "암마", "암흑술사"],
  "도적": ["독왕", "트릭스터", "땅거미", "도적"], "격투가": ["권신", "권왕", "권호", "격투가"], "듀얼블레이드": ["유성천침", "쌍극난무", "질풍쌍화", "듀얼블레이드"],
};

const getMonday = (d: Date) => {
  const dClone = new Date(d.getTime());
  const day = dClone.getDay();
  const diff = dClone.getDate() - day + (day === 0 ? -6 : 1);
  dClone.setDate(diff);
  dClone.setHours(0, 0, 0, 0);
  return dClone.getTime();
};

export default function CharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [saveToast, setSaveToast] = useState<string>('idle');
  const isInitialLoad = useRef(true);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'weekly_daily' | 'abyss_raid' | 'barter' | 'shop' | 'levels'>('all');
  const [statViewMode, setStatViewMode] = useState<'character' | 'account'>('character');

  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [dbContents, setDbContents] = useState<any[]>([]);
  const [dbTrades, setDbTrades] = useState<any[]>([]); 
  const [dbPurchases, setDbPurchases] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [accountContribution, setAccountContribution] = useState<string>("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const defaultProfile = { nickname: "", alias: "", job: "전사", combatPower: "", magicResistance: "", lifeEnergy: "", charm: "", isMain: false };
  const [profile, setProfile] = useState(defaultProfile);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [levels, setLevels] = useState<Record<string, number>>({});

  const [dailyChecks, setDailyChecks] = useState<number[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<number[]>([]);
  const [repeatChecks, setRepeatChecks] = useState<Record<number, boolean[]>>({});
  const [abyssChecks, setAbyssChecks] = useState<number[]>([]);
  const [raidChecks, setRaidChecks] = useState<number[]>([]);

  const [tradeProgress, setTradeProgress] = useState<Record<number, number>>({});
  const [tradeCompletedBy, setTradeCompletedBy] = useState<Record<number, string>>({});
  const [pinnedTrades, setPinnedTrades] = useState<number[]>([]);

  const [tradeSearch, setTradeSearch] = useState<string>("");
  const [tradeSortOrder, setTradeSortOrder] = useState<'asc' | 'desc'>('asc');

  const [showInfo, setShowInfo] = useState(false);
  const [isTitleAccordionOpen, setIsTitleAccordionOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageList, setManageList] = useState<any[]>([]);

  const abyssList = dbContents.filter((c: any) => c.type === 'abyss');
  const raidList = dbContents.filter((c: any) => c.type === 'raid');

  const getBlackHoleMaxCount = () => {
    const day = new Date().getDay();
    if (day === 1) return 8;
    if (day === 2) return 9;
    if (day === 3) return 10;
    if (day === 4) return 11;
    if (day === 5) return 12;
    if (day === 6) return 13;
    return 14;
  };

  const blackHoleMax = getBlackHoleMaxCount();

  const defaultExtraWeeklyTasks = [
    { id: 9900, name: "검은 구멍", mobile_name: "검은 구멍", type: "repeat_weekly", max_count: blackHoleMax },
    { id: 9901, name: "소환의 결계", mobile_name: "소환의 결계", type: "repeat_weekly", max_count: 7 },
    { id: 9902, name: "뱅가드 브리치", mobile_name: "뱅가드 브리치", type: "repeat_weekly", max_count: 3 }
  ];

  const visibleDailyList = dbTasks.filter((t: any) => (t.type === 'daily' || t.type === 'repeat_daily') && !t.name.includes("검은 구멍"));
  const rawWeeklyList = dbTasks.filter((t: any) => (t.type === 'weekly' || t.type === 'repeat_weekly' || t.type === 'repeat_weekend') && !t.name.includes("검은 구멍"));
  const visibleWeeklyList = [
    ...defaultExtraWeeklyTasks,
    ...rawWeeklyList.filter(r => !defaultExtraWeeklyTasks.some(e => e.name === r.name))
  ];

  const calculateTotalLevel = () => {
    const classList = dbClasses.length > 0 ? dbClasses : Array(21).fill(null);
    return classList.reduce((sum, cls) => {
      const clsName = cls?.name;
      const lvl = clsName && levels[clsName] !== undefined ? levels[clsName] : 1;
      return sum + lvl;
    }, 0);
  };

  const totalLevel = calculateTotalLevel();

  const accountTotals = allCharacters
    .filter((c: any) => c.owner === user?.nickname)
    .reduce(
      (acc, c) => {
        acc.combatPower += Number(c.combat_power || 0);
        acc.lifeEnergy += Number(c.life_energy || 0);
        acc.charm += Number(c.charm || 0);
        acc.magicResistance += Number(c.magic_resistance || 0);
        return acc;
      },
      { combatPower: 0, lifeEnergy: 0, charm: 0, magicResistance: 0 }
    );

  const charTotalScore = (Number(profile.combatPower) || 0) + (Number(profile.lifeEnergy) || 0) + (Number(profile.charm) || 0);
  const accountTotalScore = accountTotals.combatPower + accountTotals.lifeEnergy + accountTotals.charm;

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const savedPins = localStorage.getItem("nexus_pinned_trades");
    if (savedPins) {
      try { setPinnedTrades(JSON.parse(savedPins)); } catch (e) {}
    }

    checkResetNotification();
    fetchMasterData(parsedUser.nickname);
  }, [router]);

  const checkResetNotification = () => {
    const now = new Date();
    const lastCheck = localStorage.getItem("chronos_last_reset_check");
    const todayStr = now.toISOString().split('T')[0];

    if (lastCheck !== todayStr) {
      localStorage.setItem("chronos_last_reset_check", todayStr);
      const isMonday = now.getDay() === 1;
      setSaveToast(isMonday ? 'reset_weekly' : 'reset_daily');
      setTimeout(() => setSaveToast('idle'), 3000);
    }
  };

  const fetchMasterData = async (loginUserNick: string) => {
    const [clsRes, taskRes, contRes, tradeRes, purchRes, allCharsRes] = await Promise.all([
      supabase.from('nexus_classes').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_tasks').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_contents').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_trades').select('*').order('id'),
      supabase.from('nexus_purchases').select('*').order('id'),
      supabase.from('characters').select('*')
    ]);
    
    const loadedTrades = tradeRes.data || [];
    setDbClasses(clsRes.data || []);
    setDbTasks(taskRes.data || []);
    setDbContents(contRes.data || []);
    setDbTrades(loadedTrades);
    setDbPurchases(purchRes.data || []);
    setAllCharacters(allCharsRes.data || []);
    
    await fetchAccountData(loginUserNick);
    await fetchUserCharacters(loginUserNick, contRes.data || [], loadedTrades);
  };

  const fetchAccountData = async (loginUserNick: string) => {
    try {
      const { data } = await supabase.from('characters').select('contribution').eq('owner', loginUserNick).limit(1);
      if (data && data.length > 0) setAccountContribution(data[0].contribution ?? "");
    } catch (e) {}
  };

  const fetchUserCharacters = async (loginUserNick: string, contentsList: any[], tradesList = dbTrades) => {
    try {
      let data = null;
      const res1 = await supabase
        .from('characters')
        .select('nickname, alias, sort_order, owner, job, is_main, updated_at')
        .or(`owner.eq.${loginUserNick},nickname.eq.${loginUserNick}`)
        .order('sort_order', { ascending: true });

      if (!res1.error) {
        data = res1.data;
      } else {
        const res2 = await supabase
          .from('characters')
          .select('nickname, sort_order, owner, job, is_main, updated_at')
          .or(`owner.eq.${loginUserNick},nickname.eq.${loginUserNick}`)
          .order('sort_order', { ascending: true });
        data = res2.data;
      }

      if (data && data.length > 0) {
        setMyCharacters(data);
        const urlParams = new URLSearchParams(window.location.search);
        const targetChar = urlParams.get('char');
        
        let target = data[0].nickname; 
        const currentNick = profileRef.current.nickname;

        if (currentNick && data.some((d: any) => d.nickname === currentNick)) {
          target = currentNick;
        } else if (targetChar && data.some((d: any) => d.nickname === targetChar)) {
          target = targetChar;
        } else if (data.some((d: any) => d.nickname === loginUserNick)) {
          target = loginUserNick;
        }
        
        loadCharacterData(target, contentsList, tradesList);
      } else {
        const initialChar = { nickname: loginUserNick, alias: "", sort_order: 0, owner: loginUserNick, job: '전사', is_main: true };
        setMyCharacters([initialChar]);
        loadCharacterData(loginUserNick, contentsList, tradesList);
      }
    } catch (e) {}
  };

  const loadCharacterData = async (charName: string, contentsList = dbContents, tradesList = dbTrades) => {
    isInitialLoad.current = true;
    try {
      const { data: allOwnedChars } = await supabase
        .from('characters')
        .select('*')
        .or(`owner.eq.${user?.nickname || charName},nickname.eq.${charName}`);

      const now = new Date();
      const mondayNow = getMonday(now);
      const todayStr = now.toDateString();

      const accountWideProgress: Record<number, number> = {};
      const accountWideBuyers: Record<number, string> = {};

      if (allOwnedChars) {
        allOwnedChars.forEach((c: any) => {
          const rawTrade = c.trade_checks || {};
          const charUpdatedAt = c.updated_at ? new Date(c.updated_at) : new Date(0);
          const charMonday = getMonday(charUpdatedAt);
          const charDateStr = charUpdatedAt.toDateString();

          Object.keys(rawTrade).forEach((kStr) => {
            const id = Number(kStr);
            const tradeMeta = (tradesList || []).find((t: any) => t.id === id);
            const resetType = tradeMeta?.reset_type || '주간';

            const val = rawTrade[kStr];
            let count = typeof val === 'object' && val !== null ? Number(val.count || 0) : Number(val || 0);
            let buyer = typeof val === 'object' && val !== null ? String(val.completed_by || c.nickname) : c.nickname;

            let isExpired = false;
            if (resetType === '일간' && charDateStr !== todayStr) {
              isExpired = true;
            } else if (resetType === '주간' && charMonday < mondayNow) {
              isExpired = true;
            }

            if (!isExpired && count > (accountWideProgress[id] || 0)) {
              accountWideProgress[id] = count;
              accountWideBuyers[id] = buyer;
            }
          });
        });
      }

      const data = allOwnedChars?.find((c: any) => c.nickname === charName);

      if (data) {
        setLastUpdatedAt(data.updated_at || null);
        setProfile({
          nickname: data.nickname, 
          alias: data.alias || "", 
          job: data.job || "전사",
          combatPower: data.combat_power || "", 
          magicResistance: data.magic_resistance || "",
          lifeEnergy: data.life_energy || "", 
          charm: data.charm || "", 
          isMain: data.is_main || false
        });
        if (data.contribution !== undefined && data.contribution !== null) setAccountContribution(data.contribution);
        setLevels(data.levels || {});
        
        const dChecks = Array.isArray(data.daily_checks) ? data.daily_checks : [];
        setDailyChecks(dChecks.map(Number).filter((n: any) => !isNaN(n)));
        
        if (data.weekly_checks && !Array.isArray(data.weekly_checks)) {
          setWeeklyChecks((data.weekly_checks.normal || []).map(Number).filter((n: any) => !isNaN(n)));
          setRepeatChecks(data.weekly_checks.repeat || {});
        } else if (Array.isArray(data.weekly_checks)) {
          setWeeklyChecks(data.weekly_checks.map(Number).filter((n: any) => !isNaN(n)));
          setRepeatChecks({});
        } else {
          setWeeklyChecks([]); setRepeatChecks({});
        }
        
        const rChecks = Array.isArray(data.raid_checks) ? data.raid_checks.map(Number).filter((n: any) => !isNaN(n)) : [];
        setAbyssChecks(rChecks.filter((id: number) => contentsList.find((c: any) => c.id === id)?.type === 'abyss'));
        setRaidChecks(rChecks.filter((id: number) => contentsList.find((c: any) => c.id === id)?.type === 'raid'));
        
        const rawTrade = data.trade_checks || {};
        const parsedProgress: Record<number, number> = {};
        const parsedNicknames: Record<number, string> = {};

        const lastUpdated = data.updated_at ? new Date(data.updated_at) : new Date(0);
        const lastMonday = getMonday(lastUpdated);
        const isDifferentDay = now.toDateString() !== lastUpdated.toDateString();
        const isDifferentWeek = lastMonday < mondayNow;

        Object.keys(rawTrade).forEach((k: any) => {
          const tradeId = Number(k);
          const tradeMeta = (tradesList || []).find((t: any) => t.id === tradeId);
          const resetType = tradeMeta?.reset_type || '주간';

          const val = rawTrade[k];
          let count = typeof val === 'object' && val !== null ? Number(val.count || 0) : Number(val || 0);
          let buyer = typeof val === 'object' && val !== null ? String(val.completed_by || charName) : charName;

          if (resetType === '일간' && isDifferentDay) {
            count = 0;
          } else if (resetType === '주간' && isDifferentWeek) {
            count = 0;
          }

          if (count > 0) {
            parsedProgress[tradeId] = count;
            if (buyer) parsedNicknames[tradeId] = buyer;
          }
        });

        (tradesList || []).forEach((t: any) => {
          if (t.scope === '계정당' && accountWideProgress[t.id] !== undefined) {
            parsedProgress[t.id] = accountWideProgress[t.id];
            parsedNicknames[t.id] = accountWideBuyers[t.id] || charName;
          }
        });

        setTradeProgress(parsedProgress);
        setTradeCompletedBy(parsedNicknames);
      } else {
        setLastUpdatedAt(null);
        setProfile({ ...defaultProfile, nickname: charName });
        setLevels({}); setDailyChecks([]); setWeeklyChecks([]); setRepeatChecks({});
        setAbyssChecks([]); setRaidChecks([]); setTradeProgress({}); setTradeCompletedBy({});
      }
    } catch (e) {
    } finally {
      setTimeout(() => {
        isInitialLoad.current = false;
        setSaveToast('idle');
      }, 100);
    }
  };

  const saveProgress = async () => {
    if (!profile.nickname.trim() || !user?.nickname) return;
    try {
      setSaveToast('saving');
      if (profile.isMain) {
        await supabase.from('characters').update({ is_main: false }).eq('owner', user.nickname).neq('nickname', profile.nickname);
      }

      const existingIndex = myCharacters.findIndex((c: any) => c.nickname === profile.nickname);
      const currentSortOrder = existingIndex !== -1 ? (myCharacters[existingIndex].sort_order ?? myCharacters.length) : myCharacters.length;

      const tradePayload: Record<number, any> = {};
      Object.keys(tradeProgress).forEach((kStr) => {
        const id = Number(kStr);
        tradePayload[id] = {
          count: tradeProgress[id] || 0,
          completed_by: tradeCompletedBy[id] || null
        };
      });

      const now = new Date();
      const payload = {
        nickname: profile.nickname, alias: profile.alias.slice(0, 3), owner: user.nickname, sort_order: currentSortOrder,
        job: profile.job || "전사", combat_power: Number(profile.combatPower) || 0, magic_resistance: Number(profile.magicResistance) || 0,
        life_energy: Number(profile.lifeEnergy) || 0, charm: Number(profile.charm) || 0, contribution: Number(accountContribution) || 0,
        is_main: profile.isMain, levels: levels, 
        daily_checks: dailyChecks, weekly_checks: { normal: weeklyChecks, repeat: repeatChecks },
        raid_checks: [...abyssChecks, ...raidChecks], trade_checks: tradePayload, updated_at: now
      };
      
      await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      await supabase.from('characters').update({ contribution: Number(accountContribution) || 0 }).eq('owner', user.nickname);

      setLastUpdatedAt(now.toISOString());

      setAllCharacters(prev => {
        const exists = prev.some(c => c.nickname === profile.nickname);
        if (exists) {
          return prev.map(c => c.nickname === profile.nickname ? { ...c, ...payload } : c);
        }
        return [...prev, payload];
      });

      const accountWidePayload: Record<number, any> = {};
      (dbTrades || []).filter((t: any) => t.scope === '계정당').forEach((t: any) => {
        if (tradeProgress[t.id] !== undefined) {
          accountWidePayload[t.id] = {
            count: tradeProgress[t.id],
            completed_by: tradeCompletedBy[t.id] || profile.nickname
          };
        }
      });

      if (Object.keys(accountWidePayload).length > 0) {
        const { data: myChars } = await supabase.from('characters').select('nickname, trade_checks').eq('owner', user.nickname);
        if (myChars) {
          await Promise.all(
            myChars
              .filter(char => char.nickname !== profile.nickname)
              .map(char => 
                supabase.from('characters').update({
                  trade_checks: { ...(char.trade_checks || {}), ...accountWidePayload }
                }).eq('nickname', char.nickname)
              )
          );
        }
      }

      if (existingIndex === -1) {
        setMyCharacters((prev: any[]) => [...prev, { nickname: profile.nickname, alias: profile.alias, sort_order: currentSortOrder, job: profile.job, is_main: profile.isMain }]);
      } else {
        setMyCharacters((prev: any[]) => prev.map(c => c.nickname === profile.nickname ? { ...c, alias: profile.alias, job: profile.job, is_main: profile.isMain } : c));
      }

      setSaveToast('saved');
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setSaveToast('idle');
      }, 1000);

    } catch (error) { 
      setSaveToast('error');
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    setSaveToast('saving');
    const timer = setTimeout(() => {
      saveProgress();
    }, 800);
    return () => clearTimeout(timer);
  }, [profile, accountContribution, levels, dailyChecks, weeklyChecks, repeatChecks, abyssChecks, raidChecks, tradeProgress, tradeCompletedBy]);

  const switchCharacter = async (targetName: string) => { 
    if (targetName === profile.nickname) return;
    saveProgress(); 
    loadCharacterData(targetName, dbContents, dbTrades); 
    window.history.replaceState(null, '', `?char=${encodeURIComponent(targetName)}`);
  };

  const updateProfile = (field: string, value: any) => setProfile(prev => ({ ...prev, [field]: value }));
  
  const updateClassLevel = (clsName: string, delta: number) => {
    setLevels(prev => {
      const current = prev[clsName] || 1;
      let next = current + delta;
      if (next < 1) next = 1;
      if (next > 65) next = 65;
      return { ...prev, [clsName]: next };
    });
  };

  const setMaxLevel = (clsName: string) => setLevels(prev => ({ ...prev, [clsName]: 65 }));
  const setMinLevel = (clsName: string) => setLevels(prev => ({ ...prev, [clsName]: 1 }));

  const togglePinTrade = (id: number) => {
    setPinnedTrades(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem("nexus_pinned_trades", JSON.stringify(next));
      return next;
    });
  };

  const updateRepeatCount = (id: number, delta: number, max: number) => {
    setRepeatChecks(prev => {
      const currentArr = prev[id] || Array(max).fill(false);
      let newCount = currentArr.filter(Boolean).length + delta;
      if (newCount < 0) newCount = 0; if (newCount > max) newCount = max;
      return { ...prev, [id]: Array(max).fill(false).map((_, i) => i < newCount) };
    });
  };

  const updateTradeProgress = (tradeId: number, delta: number, max: number, scope: string) => {
    setTradeProgress(prev => {
      const current = prev[tradeId] || 0;
      let next = current + delta;
      if (next < 0) next = 0; if (next > max) next = max;

      if (next > 0 && scope === '계정당') {
        setTradeCompletedBy(nicks => ({ ...nicks, [tradeId]: profile.nickname }));
      } else if (next === 0 && scope === '계정당') {
        setTradeCompletedBy(nicks => {
          const nw = { ...nicks };
          delete nw[tradeId];
          return nw;
        });
      }

      return { ...prev, [tradeId]: next };
    });
  };

  const handleSmartToggle = (type: string) => {
    if (type === 'daily') {
      const normals = visibleDailyList.filter((t: any) => !t.type?.startsWith('repeat')).map((t: any) => t.id);
      const isAllChecked = normals.every(id => dailyChecks.includes(id));
      setDailyChecks(isAllChecked ? [] : normals);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleDailyList.filter((t: any) => t.type?.startsWith('repeat')).forEach((t: any) => {
          next[t.id] = isAllChecked ? [] : Array(t.max_count).fill(true);
        });
        return next;
      });
    }
    if (type === 'weekly') {
      const normals = visibleWeeklyList.filter((t: any) => !t.type?.startsWith('repeat')).map((t: any) => t.id);
      const isAllChecked = normals.every(id => weeklyChecks.includes(id));
      setWeeklyChecks(isAllChecked ? [] : normals);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleWeeklyList.filter((t: any) => t.type?.startsWith('repeat')).forEach((t: any) => {
          next[t.id] = isAllChecked ? [] : Array(t.max_count).fill(true);
        });
        return next;
      });
    }
    if (type === 'abyss') {
      const allIds = abyssList.map((t: any) => t.id);
      const isAllChecked = allIds.every(id => abyssChecks.includes(id));
      setAbyssChecks(isAllChecked ? [] : allIds);
    }
    if (type === 'raid') {
      const allIds = raidList.map((t: any) => t.id);
      const isAllChecked = allIds.every(id => raidChecks.includes(id));
      setRaidChecks(isAllChecked ? [] : allIds);
    }
  };

  const openManageModal = () => {
    const editList = myCharacters.map((c, i) => ({
      ...c, 
      originalName: c.nickname, 
      tempAlias: (c.alias || "").slice(0, 3),
      tempNickname: c.nickname, 
      tempJob: c.job || "전사", 
      isMain: c.is_main || false,
      isDeleted: false, 
      sort_order: i
    }));
    setManageList(editList);
    setIsManageModalOpen(true);
  };

  const saveManageModal = async () => {
    const activeChars = manageList.filter(c => !c.isDeleted);
    if (activeChars.length === 0) {
      alert("최소 1개의 캐릭터는 유지되어야 합니다."); return;
    }

    for (const char of activeChars) {
      if (!char.tempNickname || !char.tempNickname.trim()) {
        alert("캐릭터 닉네임은 빈 칸일 수 없습니다."); return;
      }
    }
    
    isInitialLoad.current = true;

    const toDelete = manageList.filter(c => c.isDeleted && !c.isNew);
    for (const char of toDelete) {
      await supabase.from('characters').delete().eq('originalName', char.originalName);
    }

    for (const char of activeChars) {
      const payload: any = {
        owner: user.nickname, 
        sort_order: char.sort_order, 
        job: char.tempJob,
        alias: char.tempAlias.slice(0, 3),
        is_main: char.isMain,
        contribution: Number(accountContribution) || 0
      };
      
      if (char.isNew) {
        payload.nickname = char.tempNickname.trim();
        await supabase.from('characters').insert([payload]);
      } else {
        if (char.originalName !== char.tempNickname.trim()) payload.nickname = char.tempNickname.trim();
        await supabase.from('characters').update(payload).eq('nickname', char.originalName);
      }
    }

    setIsManageModalOpen(false);

    const targetNick = activeChars.find(c => c.originalName === profile.nickname)?.tempNickname.trim() || activeChars[0].tempNickname.trim();
    const updatedCurrentChar = activeChars.find(c => c.originalName === profile.nickname || c.tempNickname.trim() === targetNick);

    if (updatedCurrentChar) {
      setProfile(prev => ({
        ...prev,
        nickname: updatedCurrentChar.tempNickname.trim(),
        alias: updatedCurrentChar.tempAlias.slice(0, 3),
        job: updatedCurrentChar.tempJob,
        isMain: updatedCurrentChar.isMain
      }));
    }

    setMyCharacters(activeChars.map(c => ({
      nickname: c.tempNickname.trim(),
      alias: c.tempAlias.slice(0, 3),
      job: c.tempJob,
      is_main: c.isMain,
      sort_order: c.sort_order
    })));

    await fetchMasterData(user.nickname); 
    window.history.replaceState(null, '', `?char=${encodeURIComponent(targetNick)}`);

    setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);
  };

  const getScore = (c: any, type: string) => {
    switch(type) {
      case 'KRATOS': return Number(c.combat_power || 0); 
      case 'TECHNE': return Number(c.life_energy || 0);
      case 'HARMONIA': return Number(c.charm || 0);
      case 'TELOS': return Number(c.combat_power || 0) + Number(c.life_energy || 0) + Number(c.charm || 0);
      case 'PIETAS': return Number(c.contribution || 0);
      default: return 0;
    }
  };

  const getMyEarnedTitles = () => {
    if (!profile.nickname || allCharacters.length === 0) return [];
    
    const titles: { type: string, name: string, rank: number, tagClass: string }[] = [];
    const myData = allCharacters.find(c => c.nickname === profile.nickname);
    if (!myData) return [];

    const pushIfTop3 = (type: any, titleArr: string[]) => {
      const rank = [...allCharacters].sort((a,b) => getScore(b, type) - getScore(a, type)).findIndex(c => c.nickname === profile.nickname);
      if(rank >= 0 && rank < 3) titles.push({ type, name: titleArr[rank], rank: rank + 1, tagClass: CATEGORY_THEMES[type].tags[rank] });
    };

    pushIfTop3('TELOS', TOP_TITLES.TELOS);
    pushIfTop3('PIETAS', TOP_TITLES.PIETAS);

    const kratosRank = [...allCharacters].filter(c => c.job === profile.job).sort((a,b) => (b.combat_power||0) - (a.combat_power||0)).findIndex(c => c.nickname === profile.nickname);
    const kTitles = CLASS_TITLES[profile.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) {
        titles.push({ type: 'KRATOS', name: kTitles[kratosRank], rank: kratosRank + 1, tagClass: CATEGORY_THEMES.KRATOS.tags[kratosRank] });
      }
    }
    pushIfTop3('TECHNE', TOP_TITLES.TECHNE);
    pushIfTop3('HARMONIA', TOP_TITLES.HARMONIA);

    return titles;
  };

  if (!mounted || !user) return null;

  const earnedTitles = getMyEarnedTitles();

  const isDailyAllChecked = visibleDailyList.filter((t: any) => !t.type?.startsWith('repeat')).every((t: any) => dailyChecks.includes(t.id));
  const isWeeklyAllChecked = visibleWeeklyList.filter((t: any) => !t.type?.startsWith('repeat')).every((t: any) => weeklyChecks.includes(t.id));
  const isAbyssAllChecked = abyssList.every((t: any) => abyssChecks.includes(t.id));
  const isRaidAllChecked = raidList.every((t: any) => raidChecks.includes(t.id));

  return (
    <div className="max-w-[1400px] mx-auto text-[var(--text-main)] font-sans pb-28 md:pb-16 pt-1 md:pt-4 px-2 md:px-6 relative bg-transparent [-webkit-text-size-adjust:100%]">
      
      {/* 토스트 알림 */}
      {saveToast !== 'idle' && (
        <div className={`fixed top-4 right-4 z-[110] px-3.5 py-1.5 rounded-full border shadow-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 backdrop-blur-md ${
          saveToast === 'saving' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse' :
          saveToast === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' :
          saveToast === 'reset_daily' ? 'bg-blue-500/30 text-blue-300 border-blue-400' :
          saveToast === 'reset_weekly' ? 'bg-purple-500/30 text-purple-300 border-purple-400' :
          'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
        }`}>
          {saveToast === 'saving' ? '⏳ 저장 중...' : 
           saveToast === 'error' ? '⚠️ 저장 실패' : 
           saveToast === 'reset_daily' ? '☀️ 일일 컨텐츠 정보가 초기화 됐습니다.' :
           saveToast === 'reset_weekly' ? '🌙 모든 컨텐츠 정보가 초기화 되었습니다.' :
           '✅ 저장 완료'}
        </div>
      )}

      {/* 캐릭터 등록 및 관리 모달 */}
      <CharacterManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        manageList={manageList}
        setManageList={setManageList}
        dbClasses={dbClasses}
        CLASS_TITLES={CLASS_TITLES}
        saveManageModal={saveManageModal}
      />

      <div className="space-y-3 md:space-y-4">
        
        {/* 상단 헤더: lg(1024px) 이상에서만 1~2줄 표시, 미만에서는 (i) 버튼으로 자동 전환 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-2.5 px-3 md:py-3.5 md:px-5 shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
            
            {/* 타이틀 및 모바일/태블릿 전용 (i) 버튼 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
              <h1 className="text-sm sm:text-base md:text-xl font-black tracking-widest leading-none text-[var(--text-main)] shrink-0">CHRONOS</h1>
              <span className="text-[var(--accent)] text-xs sm:text-sm font-bold tracking-wide leading-none whitespace-nowrap shrink-0">
                크로노스 : 캐릭터 관리
              </span>
              <button 
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="lg:hidden w-4.5 h-4.5 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[11px] font-black text-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent-soft)] transition cursor-pointer shrink-0 ml-0.5"
                title="도움말"
              >
                i
              </button>
            </div>

            {/* lg(1024px) 미만에서 (i) 클릭 시 출력되는 안내 창 */}
            {showInfo && (
              <div className="lg:hidden bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-lg w-full text-xs font-bold text-[var(--text-sub)] leading-relaxed animate-in fade-in duration-200">
                <p>⏳ 시간과 기록의 신, 크로노스.</p>
                <p>성역과 함께 성장하는 모든 별들의 기록을 관리하는 곳입니다.</p>
              </div>
            )}
            
            {/* 데스크톱 안내 박스: lg(1024px) 이상 완벽한 1~2줄 보장, 3줄 불가 구조 */}
            <div className="hidden lg:flex flex-1 max-w-2xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-4 py-2 rounded-lg text-xs font-bold text-[var(--text-sub)] flex-col justify-center gap-0.5 shadow-xs shrink-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span>⏳</span>
                <span>시간과 기록의 신, 크로노스.</span>
              </div>
              <div className="pl-5 text-[var(--text-main)]/90 font-medium whitespace-nowrap">
                성역과 함께 성장하는 모든 별들의 기록을 관리하는 곳입니다.
              </div>
            </div>

          </div>
        </header>
        
        {/* 수치 스탯 및 캐릭터 선택 영역 */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-3 md:space-y-4">
          
          <CharacterStats
            statViewMode={statViewMode}
            setStatViewMode={setStatViewMode}
            profile={profile}
            accountTotals={accountTotals}
            charTotalScore={charTotalScore}
            accountTotalScore={accountTotalScore}
            accountContribution={accountContribution}
            updateProfile={updateProfile}
            setAccountContribution={setAccountContribution}
            lastUpdatedAt={lastUpdatedAt}
          />

          <CharacterSelector
            profile={profile}
            myCharacters={myCharacters}
            switchCharacter={switchCharacter}
            openManageModal={openManageModal}
            dbClasses={dbClasses}
            CLASS_TITLES={CLASS_TITLES}
            updateProfile={updateProfile}
            totalLevel={totalLevel}
            isTitleAccordionOpen={isTitleAccordionOpen}
            setIsTitleAccordionOpen={setIsTitleAccordionOpen}
            earnedTitles={earnedTitles}
          />

        </div>

        {/* 🟡 탭 메뉴: 모서리 라운딩(rounded-lg) 적용 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-1.5 bg-[var(--inner-box)] p-1 md:p-1.5 rounded-xl border border-[var(--panel-border)]">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'weekly_daily', label: '주간/일일' },
            { id: 'abyss_raid', label: '어비스/레이드' },
            { id: 'barter', label: '물물 교환' },
            { id: 'shop', label: '상점 구매' },
            { id: 'levels', label: '클래스' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 text-[10.5px] sm:text-xs md:text-sm font-black text-center transition cursor-pointer whitespace-nowrap leading-none truncate rounded-lg ${
                activeTab === tab.id 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="space-y-3 md:space-y-4">
          
          {(activeTab === 'all' || activeTab === 'weekly_daily' || activeTab === 'abyss_raid') && (
            <ContentChecklist
              activeTab={activeTab}
              visibleDailyList={visibleDailyList}
              visibleWeeklyList={visibleWeeklyList}
              abyssList={abyssList}
              raidList={raidList}
              dailyChecks={dailyChecks}
              setDailyChecks={setDailyChecks}
              weeklyChecks={weeklyChecks}
              setWeeklyChecks={setWeeklyChecks}
              repeatChecks={repeatChecks}
              updateRepeatCount={updateRepeatCount}
              abyssChecks={abyssChecks}
              setAbyssChecks={setAbyssChecks}
              raidChecks={raidChecks}
              setRaidChecks={setRaidChecks}
              handleSmartToggle={handleSmartToggle}
              isDailyAllChecked={isDailyAllChecked}
              isWeeklyAllChecked={isWeeklyAllChecked}
              isAbyssAllChecked={isAbyssAllChecked}
              isRaidAllChecked={isRaidAllChecked}
            />
          )}

          {(activeTab === 'all' || activeTab === 'barter') && (
            <TradeList
              categoryType="barter"
              title="⚖️ 물물 교환 목록"
              items={Array.isArray(dbTrades) ? dbTrades : []}
              tradeProgress={tradeProgress}
              tradeCompletedBy={tradeCompletedBy}
              pinnedTrades={pinnedTrades}
              togglePinTrade={togglePinTrade}
              updateTradeProgress={updateTradeProgress}
              tradeSearch={tradeSearch}
              setTradeSearch={setTradeSearch}
              tradeSortOrder={tradeSortOrder}
              setTradeSortOrder={setTradeSortOrder}
            />
          )}

          {(activeTab === 'all' || activeTab === 'shop') && (
            <TradeList
              categoryType="shop"
              title="🛒 주간 상점 구매 목록"
              items={
                Array.isArray(dbPurchases) && dbPurchases.length > 0
                  ? dbPurchases
                  : (Array.isArray(dbTrades) ? dbTrades : []).filter((t: any) => t.category === 'shop')
              }
              tradeProgress={tradeProgress}
              tradeCompletedBy={tradeCompletedBy}
              pinnedTrades={pinnedTrades}
              togglePinTrade={togglePinTrade}
              updateTradeProgress={updateTradeProgress}
              tradeSearch={tradeSearch}
              setTradeSearch={setTradeSearch}
              tradeSortOrder={tradeSortOrder}
              setTradeSortOrder={setTradeSortOrder}
            />
          )}

          {(activeTab === 'all' || activeTab === 'levels') && (
            <ClassLevelManager
              dbClasses={dbClasses}
              levels={levels}
              updateClassLevel={updateClassLevel}
              setMaxLevel={setMaxLevel}
              setMinLevel={setMinLevel}
            />
          )}

        </div>

      </div>
    </div>
  );
}