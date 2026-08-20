"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

// --- 아고라 칭호 연동 데이터 ---
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
  const [allCharacters, setAllCharacters] = useState<any[]>([]);

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [accountContribution, setAccountContribution] = useState<string>("");

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
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [manageList, setManageList] = useState<any[]>([]);
  const dragItemIndex = useRef<number | null>(null);

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

  // 계정 전체 합산 스탯 계산
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
    const [clsRes, taskRes, contRes, tradeRes, allCharsRes] = await Promise.all([
      supabase.from('nexus_classes').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_tasks').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_contents').select('*').eq('is_active', true).order('id'),
      supabase.from('nexus_trades').select('*').order('id'),
      supabase.from('characters').select('*')
    ]);
    
    setDbClasses(clsRes.data || []);
    setDbTasks(taskRes.data || []);
    setDbContents(contRes.data || []);
    setDbTrades(tradeRes.data || []);
    setAllCharacters(allCharsRes.data || []);
    
    await fetchAccountData(loginUserNick);
    await fetchUserCharacters(loginUserNick, contRes.data || [], tradeRes.data || []);
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
        .select('nickname, alias, sort_order, owner, job, is_main')
        .or(`owner.eq.${loginUserNick},nickname.eq.${loginUserNick}`)
        .order('sort_order', { ascending: true });

      if (!res1.error) {
        data = res1.data;
      } else {
        const res2 = await supabase
          .from('characters')
          .select('nickname, sort_order, owner, job, is_main')
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

      const accountWideProgress: Record<number, number> = {};
      const accountWideBuyers: Record<number, string> = {};

      if (allOwnedChars) {
        allOwnedChars.forEach((c: any) => {
          const rawTrade = c.trade_checks || {};
          Object.keys(rawTrade).forEach((kStr) => {
            const id = Number(kStr);
            const val = rawTrade[kStr];
            let count = typeof val === 'object' && val !== null ? Number(val.count || 0) : Number(val || 0);
            let buyer = typeof val === 'object' && val !== null ? String(val.completed_by || c.nickname) : c.nickname;

            if (count > (accountWideProgress[id] || 0)) {
              accountWideProgress[id] = count;
              accountWideBuyers[id] = buyer;
            }
          });
        });
      }

      const data = allOwnedChars?.find((c: any) => c.nickname === charName);

      if (data) {
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

        Object.keys(rawTrade).forEach((k: any) => {
          const val = rawTrade[k];
          if (typeof val === 'object' && val !== null) {
            parsedProgress[Number(k)] = Number(val.count || 0);
            if (val.completed_by) parsedNicknames[Number(k)] = String(val.completed_by);
          } else {
            parsedProgress[Number(k)] = Number(val || 0);
          }
        });

        tradesList.forEach((t: any) => {
          if (t.scope === '계정당' && accountWideProgress[t.id] !== undefined) {
            parsedProgress[t.id] = accountWideProgress[t.id];
            parsedNicknames[t.id] = accountWideBuyers[t.id] || charName;
          }
        });

        setTradeProgress(parsedProgress);
        setTradeCompletedBy(parsedNicknames);
      } else {
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

      const payload = {
        nickname: profile.nickname, alias: profile.alias.slice(0, 3), owner: user.nickname, sort_order: currentSortOrder,
        job: profile.job || "전사", combat_power: Number(profile.combatPower) || 0, magic_resistance: Number(profile.magicResistance) || 0,
        life_energy: Number(profile.lifeEnergy) || 0, charm: Number(profile.charm) || 0, contribution: Number(accountContribution) || 0,
        is_main: profile.isMain, levels: levels, 
        daily_checks: dailyChecks, weekly_checks: { normal: weeklyChecks, repeat: repeatChecks },
        raid_checks: [...abyssChecks, ...raidChecks], trade_checks: tradePayload, updated_at: new Date()
      };
      
      await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      await supabase.from('characters').update({ contribution: Number(accountContribution) || 0 }).eq('owner', user.nickname);

      setAllCharacters(prev => {
        const exists = prev.some(c => c.nickname === profile.nickname);
        if (exists) {
          return prev.map(c => c.nickname === profile.nickname ? { ...c, ...payload } : c);
        }
        return [...prev, payload];
      });

      const accountWidePayload: Record<number, any> = {};
      dbTrades.filter((t: any) => t.scope === '계정당').forEach((t: any) => {
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

  const addManageCharacter = () => {
    setManageList([...manageList, { 
      originalName: "", tempAlias: "", tempNickname: "새캐릭", tempJob: "전사", isMain: false, isDeleted: false, sort_order: manageList.length, isNew: true 
    }]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (dragItemIndex.current === null || dragItemIndex.current === index) return;
    const newList = [...manageList];
    const draggedItem = newList[dragItemIndex.current];
    newList.splice(dragItemIndex.current, 1);
    newList.splice(index, 0, draggedItem);
    dragItemIndex.current = index;
    setManageList(newList.map((item, idx) => ({ ...item, sort_order: idx })));
  };

  const handleSetMain = (index: number) => {
    setManageList(prev => prev.map((item, idx) => ({ ...item, isMain: idx === index })));
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
      await supabase.from('characters').delete().eq('nickname', char.originalName);
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

    const pushIfTop3 = (type: keyof typeof RANKING_INFO, titleArr: string[]) => {
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

  const cleanItemName = (name: string) => name.replace(/^어비스\s*-\s*/, '').replace(/^레이드\s*-\s*/, '');

  const renderTask = (item: any, type: 'daily' | 'weekly' | 'abyss' | 'raid') => {
    const pcName = cleanItemName(item.name);
    const mobileDisplayName = (item.mobile_name && item.mobile_name.trim()) ? item.mobile_name : pcName;

    if (item.type?.startsWith('repeat')) {
      const currentCount = (repeatChecks[item.id] || []).filter(Boolean).length;
      const isMax = currentCount === item.max_count;
      const showBadge = item.type === 'repeat_daily' || item.type === 'repeat_weekend';
      const badgeText = item.type === 'repeat_daily' ? '일간' : '주말';
      
      return (
        <div key={item.id} className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg border transition-all ${isMax ? "bg-[var(--accent-soft)] border-[var(--accent)]" : "bg-[var(--inner-box)] border-[var(--panel-border)]"}`}>
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            {showBadge && <span className={`text-[10px] w-fit px-1 py-0.2 rounded font-bold mb-0.5 ${isMax ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--panel)] text-[var(--text-sub)]'}`}>{badgeText}</span>}
            
            <span className={`md:hidden text-xs sm:text-sm font-black leading-snug break-keep ${isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}>
              {mobileDisplayName}
            </span>
            <span className={`hidden md:block text-xs md:text-sm font-bold leading-snug break-keep ${isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}>
              {pcName}
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
            <button 
              onClick={() => updateRepeatCount(item.id, -1, item.max_count)} 
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-black cursor-pointer border border-[var(--panel-border)]"
            >
              -
            </button>
            <span className={`text-xs font-black min-w-[24px] text-center ${isMax ? "text-[var(--accent)]" : "text-[var(--text-sub)]"}`}>
              {currentCount}/{item.max_count}
            </span>
            <button 
              onClick={() => updateRepeatCount(item.id, 1, item.max_count)} 
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      );
    } 
    
    let checks: number[] = []; let setChecks: any;
    if (type === 'daily') { checks = dailyChecks; setChecks = setDailyChecks; }
    else if (type === 'weekly') { checks = weeklyChecks; setChecks = setWeeklyChecks; }
    else if (type === 'abyss') { checks = abyssChecks; setChecks = setAbyssChecks; }
    else if (type === 'raid') { checks = raidChecks; setChecks = setRaidChecks; }

    const isChecked = checks.includes(item.id);

    const getColorTheme = () => {
      if (!isChecked) return { wrapper: "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]", text: "text-[var(--text-main)]", box: "bg-[var(--panel)] border-[var(--panel-border)]" };
      if (type === 'daily') return { wrapper: "bg-amber-500/10 border-amber-500/50", text: "text-amber-400 font-bold", box: "bg-amber-500 text-white" };
      if (type === 'weekly') return { wrapper: "bg-blue-500/10 border-blue-500/50", text: "text-blue-400 font-bold", box: "bg-blue-500 text-white" };
      if (type === 'abyss' || type === 'raid') return { wrapper: "bg-emerald-500/15 border-emerald-500/60", text: "text-emerald-400 font-bold", box: "bg-emerald-500 text-black font-bold" };
      return { wrapper: "", text: "", box: "" };
    };

    const theme = getColorTheme();

    return (
      <div key={item.id} onClick={() => setChecks(isChecked ? checks.filter((i: number) => i !== item.id) : [...checks, item.id])}
           className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg cursor-pointer border transition-all min-w-0 ${theme.wrapper}`}>
        
        <span className={`md:hidden text-xs sm:text-sm font-black leading-tight break-keep pr-1 min-w-0 ${theme.text}`}>
          {mobileDisplayName}
        </span>
        <span className={`hidden md:block text-xs md:text-sm font-bold leading-tight break-keep pr-1 min-w-0 ${theme.text}`}>
          {pcName}
        </span>

        <div className={`w-4 h-4 md:w-4 md:h-4 rounded flex items-center justify-center transition-all shrink-0 ${theme.box}`}>
          {isChecked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
      </div>
    );
  };

  if (!mounted || !user) return null;

  const earnedTitles = getMyEarnedTitles();

  const filterAndSortTrades = (categoryType: 'barter' | 'shop') => {
    let list = dbTrades.filter(t => {
      const itemCategory = t.category || 'barter';
      return itemCategory === categoryType;
    });

    if (tradeSearch.trim()) {
      const q = tradeSearch.trim().toLowerCase();
      list = list.filter(t => 
        (t.npc && t.npc.toLowerCase().includes(q)) ||
        (t.map && t.map.toLowerCase().includes(q)) ||
        (t.reward && t.reward.toLowerCase().includes(q)) ||
        (t.cost && t.cost.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const aPin = pinnedTrades.includes(a.id) ? 1 : 0;
      const bPin = pinnedTrades.includes(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;

      const mapCompare = (a.map || "").localeCompare(b.map || "", "ko-KR");
      if (mapCompare !== 0) return tradeSortOrder === 'asc' ? mapCompare : -mapCompare;

      const npcCompare = (a.npc || "").localeCompare(b.npc || "", "ko-KR");
      if (npcCompare !== 0) return tradeSortOrder === 'asc' ? npcCompare : -npcCompare;

      const rewardCompare = (a.reward || "").localeCompare(b.reward || "", "ko-KR");
      return tradeSortOrder === 'asc' ? rewardCompare : -rewardCompare;
    });
  };

  const barterTrades = filterAndSortTrades('barter');
  const shopTrades = filterAndSortTrades('shop');

  const isDailyAllChecked = visibleDailyList.filter((t: any) => !t.type?.startsWith('repeat')).every((t: any) => dailyChecks.includes(t.id));
  const isWeeklyAllChecked = visibleWeeklyList.filter((t: any) => !t.type?.startsWith('repeat')).every((t: any) => weeklyChecks.includes(t.id));
  const isAbyssAllChecked = abyssList.every((t: any) => abyssChecks.includes(t.id));
  const isRaidAllChecked = raidList.every((t: any) => raidChecks.includes(t.id));

  const mobileRepeatTasks = [
    ...visibleWeeklyList.filter((t: any) => t.type?.startsWith('repeat')),
    ...visibleDailyList.filter((t: any) => t.type?.startsWith('repeat'))
  ];

  const mobileDailyChecklists = visibleDailyList.filter((t: any) => !t.type?.startsWith('repeat'));
  const mobileWeeklyChecklists = visibleWeeklyList.filter((t: any) => !t.type?.startsWith('repeat'));

  const renderTradeCard = (trade: any) => {
    const currentVal = tradeProgress[trade.id] || 0;
    const limit = trade.limit || trade.max_count || 1;
    const isMax = currentVal >= limit;
    const isPinned = pinnedTrades.includes(trade.id);
    const buyerNick = tradeCompletedBy[trade.id];

    return (
      <div key={trade.id} className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-lg border transition ${isPinned ? 'bg-[var(--accent-soft)]/20 border-[var(--accent)]' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}>
        <div className="flex items-center justify-between mb-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button onClick={() => togglePinTrade(trade.id)} className={`text-xs cursor-pointer ${isPinned ? 'opacity-100' : 'opacity-30'}`}>📌</button>
            <span className="font-bold text-xs sm:text-sm text-[var(--accent)] truncate">
              {trade.npc || "NPC"} <span className="text-[var(--text-main)] font-normal">({trade.map || "맵"})</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {trade.scope === '계정당' && buyerNick && (
              <span className="text-[10px] font-bold text-purple-200 bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-700/80">
                {buyerNick}
              </span>
            )}
            <span className={`text-[11px] sm:text-xs font-black px-2 py-0.5 rounded border ${
              trade.scope === '계정당' 
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs' 
                : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)]'
            }`}>
              {trade.scope || '캐릭당'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-emerald-500 dark:text-emerald-400 leading-snug break-keep">
              보상: {trade.reward} {trade.reward_cnt ? `(${trade.reward_cnt}개)` : ''}
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400 leading-snug break-keep">
              소모: {trade.cost} {trade.cost_cnt ? `(${trade.cost_cnt}개)` : ''}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
            <button 
              onClick={() => updateTradeProgress(trade.id, -1, limit, trade.scope)} 
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--inner-box)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
            >
              -
            </button>
            <span className={`text-xs font-black min-w-[28px] text-center ${isMax ? "text-emerald-500 dark:text-emerald-400" : "text-[var(--text-main)]"}`}>
              {currentVal}/{limit}
            </span>
            <button 
              onClick={() => updateTradeProgress(trade.id, 1, limit, trade.scope)} 
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto text-[var(--text-main)] font-sans pb-16 pt-1 md:pt-4 px-2 md:px-6 relative bg-transparent">
      
      {/* 플로팅 토스트 */}
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

      {/* 캐릭터 관리 모달 */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl w-[98%] max-w-2xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-2.5 md:p-3 border-b border-[var(--panel-border)] flex justify-between items-center bg-[var(--inner-box)]">
              <h2 className="text-xs md:text-base font-black text-[var(--accent)]">⚙️ 캐릭터 등록 및 관리</h2>
              <button onClick={() => setIsManageModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm">✕</button>
            </div>
            
            <div className="p-1.5 md:p-3 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
              <button 
                onClick={() => setIsHowToOpen(!isHowToOpen)}
                className="w-full text-left text-xs text-[var(--accent)] bg-[var(--inner-box)] border border-[var(--panel-border)] px-2 py-1 rounded-lg font-bold hover:bg-[var(--accent-soft)] transition flex justify-between items-center"
              >
                <span>📖 [사용 방법]</span>
                <span className="text-[10px]">{isHowToOpen ? '▲ 닫기' : '▼ 펼치기'}</span>
              </button>

              {isHowToOpen && (
                <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2 rounded-lg text-xs space-y-1 text-[var(--text-sub)]">
                  <p>● :: 핸들을 움직여 순서를 변경 할 수 있습니다!</p>
                  <p>● 애칭은 최대 세글자(3자)까지 입력 가능합니다!</p>
                  <p>● 닉네임은 인게임 닉네임을 정확히 입력해주세요!</p>
                  <p>● 대표 캐릭터는 한 캐릭터만 지정할 수 있습니다!</p>
                </div>
              )}
              
              {manageList.map((char, index) => !char.isDeleted && (
                <div 
                  key={index} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-1 bg-[var(--inner-box)] p-1 rounded-lg border border-[var(--panel-border)] transition hover:border-[var(--accent)]/50 min-w-0"
                >
                  <div className="flex items-center text-[var(--text-sub)] font-mono cursor-grab active:cursor-grabbing shrink-0 select-none text-[10px] leading-none">
                    <span className="font-bold text-[11px] text-[var(--text-sub)]">::</span>
                    <span className="font-bold text-[var(--accent)] min-w-[10px] text-center">{index + 1}</span>
                  </div>

                  <input 
                    value={char.tempAlias} 
                    maxLength={3}
                    placeholder="애칭(3자)"
                    onChange={(e) => { 
                      const nw = [...manageList]; 
                      nw[index].tempAlias = e.target.value.slice(0, 3); 
                      setManageList(nw); 
                    }} 
                    className="w-12 sm:w-14 bg-[var(--panel)] border border-[var(--panel-border)] rounded px-1 py-1 text-[11px] text-[var(--text-main)] focus:border-[var(--accent)] outline-none text-center shrink-0 font-bold" 
                  />

                  <input 
                    value={char.tempNickname} 
                    placeholder="닉네임"
                    onChange={(e) => { const nw = [...manageList]; nw[index].tempNickname = e.target.value; setManageList(nw); }} 
                    className="flex-1 min-w-[48px] bg-[var(--panel)] border border-[var(--panel-border)] rounded px-1 py-1 text-[11px] text-[var(--text-main)] focus:border-[var(--accent)] outline-none" 
                  />

                  <select 
                    value={char.tempJob} 
                    onChange={(e) => { const nw = [...manageList]; nw[index].tempJob = e.target.value; setManageList(nw); }} 
                    className="w-[62px] sm:w-20 bg-[var(--panel)] border border-[var(--panel-border)] rounded px-0.5 py-1 text-[10px] sm:text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none shrink-0"
                  >
                    {dbClasses.length > 0 ? (
                      dbClasses.map((cls: any) => <option key={cls.name} value={cls.name}>{cls.name}</option>)
                    ) : (
                      Object.keys(CLASS_TITLES).map((clsName) => <option key={clsName} value={clsName}>{clsName}</option>)
                    )}
                  </select>

                  <button 
                    type="button"
                    onClick={() => handleSetMain(index)}
                    className={`px-1.5 py-1 rounded text-[10px] sm:text-xs font-bold shrink-0 transition ${
                      char.isMain 
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]' 
                        : 'bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    대표
                  </button>

                  <button 
                    onClick={() => { if(confirm(`정말 [${char.tempAlias || char.tempNickname}] 캐릭터를 삭제하시겠습니까?`)) { const nw = [...manageList]; nw[index].isDeleted = true; setManageList(nw); } }} 
                    className="bg-red-950/40 text-red-400 border border-red-800/50 px-1.5 py-1 rounded text-[10px] sm:text-xs font-bold hover:bg-red-900/60 shrink-0"
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button onClick={addManageCharacter} className="w-full border border-dashed border-[var(--accent)] text-[var(--accent)] py-1.5 rounded-lg hover:bg-[var(--accent-soft)] font-bold text-xs transition">+ 새 캐릭터 추가</button>
            </div>

            <div className="p-2 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex justify-end gap-1.5">
              <button onClick={() => setIsManageModalOpen(false)} className="px-3 py-1 rounded-lg bg-[var(--panel)] text-[var(--text-sub)] text-xs font-bold transition">취소</button>
              <button onClick={saveManageModal} className="px-4 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black transition">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 md:space-y-4">
        
        {/* CHRONOS 헤더 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-1.5 px-3 md:py-2.5 md:px-4 shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              <h1 className="text-base md:text-lg font-black tracking-widest leading-none text-[var(--text-main)]">CHRONOS</h1>
              <span className="text-[var(--accent)] text-xs font-bold tracking-wide leading-none whitespace-nowrap">
                크로노스 : 캐릭터 관리
              </span>
              {/* 모바일 뷰 전용 (i) 툴팁 버튼 */}
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="md:hidden w-4 h-4 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] font-black text-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent-soft)] transition cursor-pointer shrink-0 ml-0.5"
                title="도움말"
              >
                i
              </button>
            </div>

            {/* 모바일 뷰 툴팁 내용 */}
            {showInfo && (
              <div className="md:hidden bg-[var(--inner-box)] border border-[var(--panel-border)] p-2 rounded-lg w-full text-xs font-bold text-[var(--text-sub)] leading-snug animate-in fade-in duration-200">
                <p>⏳ 시간과 기록의 신, 크로노스.</p>
                <p>입력한 능력치는 <span className="text-[var(--accent)]">AGORA 명예의 전당</span>으로 즉시 연결됩니다.</p>
              </div>
            )}
            
            {/* PC 뷰 전용 가로 설명 박스 */}
            <div className="hidden md:block border border-[var(--panel-border)] bg-[var(--inner-box)] px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-sub)] leading-snug ml-auto w-fit">
              <p>⏳ 시간과 기록의 신, 크로노스.</p>
              <p>입력한 능력치는 <span className="text-[var(--accent)]">AGORA 명예의 전당</span>으로 즉시 연결됩니다.</p>
            </div>
          </div>
        </header>
        
        {/* 상단 프로필 카드 */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-2 md:space-y-4">
          
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2 gap-2">
            {/* 좌측 캐릭터 핵심 프로필 */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] flex items-center justify-center text-base shrink-0 shadow-inner">
                🎨
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                  <span className="hidden md:inline text-base font-black text-[var(--text-main)] truncate max-w-[180px]">
                    {profile.nickname}
                  </span>
                  
                  <span className="md:hidden text-sm font-black text-[var(--text-main)] truncate max-w-[100px]">
                    {profile.alias || profile.nickname}
                  </span>

                  <select 
                    value={profile.job || "전사"} 
                    onChange={(e) => updateProfile("job", e.target.value)}
                    className="text-xs bg-[var(--inner-box)] border border-[var(--panel-border)] px-1.5 py-0.5 rounded font-bold text-[var(--accent)] outline-none cursor-pointer hover:border-[var(--accent)]"
                  >
                    {dbClasses.length > 0 ? (
                      dbClasses.map((cls: any) => (
                        <option key={cls.name} value={cls.name} className="bg-[var(--panel)] text-[var(--text-main)]">
                          {cls.name}
                        </option>
                      ))
                    ) : (
                      Object.keys(CLASS_TITLES).map((clsName) => (
                        <option key={clsName} value={clsName} className="bg-[var(--panel)] text-[var(--text-main)]">
                          {clsName}
                        </option>
                      ))
                    )}
                  </select>

                  {profile.isMain && (
                    <span className="text-[10px] sm:text-xs bg-[var(--accent)] text-[var(--accent-fg)] font-black px-1.5 py-0.5 rounded whitespace-nowrap">
                      대표
                    </span>
                  )}
                </div>

                <div className="text-xs text-[var(--text-sub)] font-bold mt-0.5 whitespace-nowrap">
                  누적 레벨 : {totalLevel}
                </div>
              </div>
            </div>

            {/* 우측 상단 버튼 */}
            <div className="flex flex-col gap-2 shrink-0">
              <button 
                onClick={() => router.push(`/character/detail?char=${encodeURIComponent(profile.nickname)}`)}
                className="px-2 py-0.5 md:px-2 md:py-1 text-center bg-[var(--accent)] text-[var(--accent-fg)] text-[15px] md:text-xs font-black rounded-md shadow-xs transition hover:opacity-90 whitespace-nowrap cursor-pointer"
              >
                🔍 장비상세
              </button>
              <button 
                onClick={() => setIsTitleAccordionOpen(!isTitleAccordionOpen)} 
                className="px-2 py-0.5 md:px-2 md:py-1 text-center bg-[var(--inner-box)] border border-[var(--panel-border)] text-[15px] md:text-xs font-bold text-[var(--accent)] rounded-md transition whitespace-nowrap hover:bg-[var(--accent-soft)] cursor-pointer"
              >
                ✨ 칭호보기
              </button>
            </div>
          </div>

          {/* 칭호 아코디언 */}
          {isTitleAccordionOpen && (
            <div className="p-2 border rounded-lg border-[var(--panel-border)] bg-[var(--inner-box)] space-y-1 text-xs">
              {earnedTitles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                  {earnedTitles.map(t => (
                    <div key={t.type} className={`text-xs font-black p-1.5 rounded border text-center truncate ${t.tagClass}`}>{t.name}</div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[var(--text-sub)] text-center py-0.5">아고라 랭킹을 달성해 칭호를 획득해 보세요.</div>
              )}
            </div>
          )}

          {/* 선택 캐릭터 / 계정 총합 토글 버튼 */}
          <div className="grid grid-cols-2 bg-[var(--inner-box)] p-0.5 rounded-lg border border-[var(--panel-border)] gap-0.5 shadow-inner my-2 md:max-w-[300px]">
            <button 
              onClick={() => setStatViewMode('character')} 
              className={`py-1 md:py-1 text-[11px] md:text-[11px] font-black rounded-md md:rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                statViewMode === 'character' 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <span className="text-[13px] md:text-xs">👤</span>
              <span>선택 캐릭터</span>
            </button>
            <button 
              onClick={() => setStatViewMode('account')} 
              className={`py-1 md:py-1 text-[11px] md:text-[11px] font-black rounded-md md:rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                statViewMode === 'account' 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <span className="text-[13px] md:text-xs">📊</span>
              <span>계정 총합</span>
            </button>
          </div>

          {/* 스탯 6칸 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-1.5 md:gap-2">
            
            {/* 1. 전투력 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-red-400 whitespace-nowrap shrink-0">⚔️ 전투력</label>
              {statViewMode === 'character' ? (
                <input 
                  type="number" 
                  value={profile.combatPower} 
                  onChange={e => updateProfile("combatPower", e.target.value)} 
                  placeholder="0" 
                  className="w-full text-right md:text-left bg-transparent text-sm md:text-m font-black font-mono text-[var(--text-main)] outline-none min-w-0 pr-0.5 md:pr-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              ) : (
                <span className="text-sm md:text-[15px] font-black font-mono text-[var(--accent)] text-right md:text-left flex-1 md:flex-none w-full min-w-0 pr-0.5 md:pr-0">
                  {accountTotals.combatPower.toLocaleString()}
                </span>
              )}
            </div>

            {/* 2. 생활력 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-emerald-400 whitespace-nowrap shrink-0">🌿 생활력</label>
              {statViewMode === 'character' ? (
                <input 
                  type="number" 
                  value={profile.lifeEnergy} 
                  onChange={e => updateProfile("lifeEnergy", e.target.value)} 
                  placeholder="0" 
                  className="w-full text-right md:text-left bg-transparent text-sm md:text-m font-black font-mono text-[var(--text-main)] outline-none min-w-0 pr-0.5 md:pr-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              ) : (
                <span className="text-sm md:text-[15px] font-black font-mono text-[var(--accent)] text-right md:text-left flex-1 md:flex-none w-full min-w-0 pr-0.5 md:pr-0">
                  {accountTotals.lifeEnergy.toLocaleString()}
                </span>
              )}
            </div>

            {/* 3. 매력 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-pink-400 whitespace-nowrap shrink-0">✨ 매력</label>
              {statViewMode === 'character' ? (
                <input 
                  type="number" 
                  value={profile.charm} 
                  onChange={e => updateProfile("charm", e.target.value)} 
                  placeholder="0" 
                  className="w-full text-right md:text-left bg-transparent text-sm md:text-m font-black font-mono text-[var(--text-main)] outline-none min-w-0 pr-0.5 md:pr-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              ) : (
                <span className="text-sm md:text-[15px] font-black font-mono text-[var(--accent)] text-right md:text-left flex-1 md:flex-none w-full min-w-0 pr-0.5 md:pr-0">
                  {accountTotals.charm.toLocaleString()}
                </span>
              )}
            </div>

            {/* 4. 종합 점수 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent-soft)]/10 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-[var(--accent)] whitespace-nowrap shrink-0">🏆 종합점수</label>
              <span className="text-sm md:text-m font-black font-mono text-[var(--accent)] text-right md:text-left flex-1 md:flex-none w-full min-w-0 pr-0.5 md:pr-0">
                {statViewMode === 'character' ? charTotalScore.toLocaleString() : accountTotalScore.toLocaleString()}
              </span>
            </div>

            {/* 5. 마도저항 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-purple-400 whitespace-nowrap shrink-0">🔮 마도저항</label>
              {statViewMode === 'character' ? (
                <input 
                  type="number" 
                  value={profile.magicResistance} 
                  onChange={e => updateProfile("magicResistance", e.target.value)} 
                  placeholder="0" 
                  className="w-full text-right md:text-left bg-transparent text-sm md:text-m font-black font-mono text-[var(--text-main)] outline-none min-w-0 pr-0.5 md:pr-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              ) : (
                <span className="text-sm md:text-[15px] font-black font-mono text-[var(--accent)] text-right md:text-left flex-1 md:flex-none w-full min-w-0 pr-0.5 md:pr-0">
                  {accountTotals.magicResistance.toLocaleString()}
                </span>
              )}
            </div>

            {/* 6. 길드 공헌도 */}
            <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:px-2.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 md:gap-1.5 min-w-0">
              <label className="text-[13px] md:text-[15px] font-bold text-amber-400 whitespace-nowrap shrink-0">🛡️ 길드공헌도</label>
              <input 
                type="number" 
                value={accountContribution} 
                onChange={e => setAccountContribution(e.target.value)} 
                placeholder="0" 
                className="w-full text-right md:text-left bg-transparent text-sm md:text-m font-black font-mono text-[var(--text-main)] outline-none min-w-0 pr-0.5 md:pr-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>

          </div>
        </div>

        {/* 캐릭터 선택 바 */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 md:p-2.5 shadow-xs space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-1 text-xs font-bold text-[var(--text-sub)] px-1">
            <span className="flex items-center gap-1 whitespace-nowrap shrink-0 text-xs md:text-sm">
              캐릭터 선택
              <span className="text-[14px] text-[var(--text-sub)] font-normal md:hidden">({myCharacters.length})</span>
            </span>
            <button 
              onClick={openManageModal} 
              className="text-[12px] md:text-[14px] bg-[var(--inner-box)] md:bg-[var(--panel)] text-[var(--text-main)] font-bold px-2 py-1 md:px-2.5 md:py-1.5 rounded-md border border-[var(--panel-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition shadow-xs cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              ⚙️ 캐릭터 등록 및 관리
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 md:gap-2 w-full">
            {myCharacters.map((char: any) => {
              const mobileAlias = (char.alias || char.nickname).slice(0, 3);
              const isSelected = char.nickname === profile.nickname;

              return (
                <button 
                  key={char.nickname} 
                  onClick={() => switchCharacter(char.nickname)} 
                  className={`flex flex-col items-center justify-center p-1.5 md:p-1.5 rounded-lg md:rounded-lg border transition cursor-pointer select-none w-full min-w-0 ${
                    isSelected 
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] shadow-xs' 
                      : 'bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <span className="md:hidden text-xs font-black leading-none text-center truncate w-full">
                    <span className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}>
                      {mobileAlias}
                    </span>
                  </span>

                  <div className="hidden md:flex flex-col items-center justify-center w-full gap-0.5 min-w-0 text-center">
                    <span className={`text-[13px] md:text-xs font-black truncate w-full text-center ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>
                      {char.nickname}
                    </span>
                    <span className="text-[10px] md:text-[10px] text-[var(--text-sub)] font-bold truncate w-full text-center">
                      {char.job || '전사'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2행 3열 필터 버튼 그리드 */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)]">
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 md:py-2 px-1 rounded-lg text-xs md:text-sm font-black text-center transition cursor-pointer whitespace-nowrap leading-tight ${
                activeTab === tab.id 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---------------- 컨텐츠 영역 ---------------- */}
        <div className="space-y-3 md:space-y-4">
          
          {/* 📱 1. 모바일 전용 뷰 */}
          {(activeTab === 'all' || activeTab === 'weekly_daily' || activeTab === 'abyss_raid') && (
            <div className="block md:hidden space-y-2.5">
              
              {(activeTab === 'all' || activeTab === 'weekly_daily') && mobileRepeatTasks.length > 0 && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2 shadow-xs space-y-1.5">
                  <h3 className="font-bold text-[var(--accent)] text-xs border-b border-[var(--panel-border)] pb-1">
                    ⏳ 주간/일일 반복 컨텐츠
                  </h3>
                  <div className="space-y-1">
                    {mobileRepeatTasks.map((item: any) => renderTask(item, item.type?.includes('daily') ? 'daily' : 'weekly'))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'weekly_daily') && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                      <h3 className="font-bold text-amber-400 text-xs">일일 숙제</h3>
                      <button onClick={() => handleSmartToggle('daily')} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)]">{isDailyAllChecked ? '전체 해제' : '전체 완료'}</button>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">{mobileDailyChecklists.map((item: any) => renderTask(item, 'daily'))}</div>
                  </div>

                  <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                      <h3 className="font-bold text-blue-400 text-xs">주간 숙제</h3>
                      <button onClick={() => handleSmartToggle('weekly')} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)]">{isWeeklyAllChecked ? '전체 해제' : '전체 완료'}</button>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">{mobileWeeklyChecklists.map((item: any) => renderTask(item, 'weekly'))}</div>
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'abyss_raid') && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                      <h3 className="font-bold text-emerald-400 text-xs">어비스</h3>
                      <button onClick={() => handleSmartToggle('abyss')} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)]">{isAbyssAllChecked ? '전체 해제' : '전체 완료'}</button>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">{abyssList.map((item: any) => renderTask(item, 'abyss'))}</div>
                  </div>

                  <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                      <h3 className="font-bold text-emerald-400 text-xs">레이드</h3>
                      <button onClick={() => handleSmartToggle('raid')} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)]">{isRaidAllChecked ? '전체 해제' : '전체 완료'}</button>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">{raidList.map((item: any) => renderTask(item, 'raid'))}</div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 💻 2. PC 전용 와이드 뷰 */}
          {(activeTab === 'all' || activeTab === 'weekly_daily' || activeTab === 'abyss_raid') && (
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {(activeTab === 'all' || activeTab === 'weekly_daily') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-amber-400 text-sm whitespace-nowrap">일일 컨텐츠</h3>
                    <button onClick={() => handleSmartToggle('daily')} className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${isDailyAllChecked ? 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>{isDailyAllChecked ? '전체 해제' : '전체 완료'}</button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">{visibleDailyList.map((item: any) => renderTask(item, 'daily'))}</div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'weekly_daily') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-blue-400 text-sm whitespace-nowrap">주간 컨텐츠</h3>
                    <button onClick={() => handleSmartToggle('weekly')} className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${isWeeklyAllChecked ? 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>{isWeeklyAllChecked ? '전체 해제' : '전체 완료'}</button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">{visibleWeeklyList.map((item: any) => renderTask(item, 'weekly'))}</div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'abyss_raid') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-emerald-400 text-sm whitespace-nowrap">어비스 관리</h3>
                    <button onClick={() => handleSmartToggle('abyss')} className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${isAbyssAllChecked ? 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>{isAbyssAllChecked ? '전체 해제' : '전체 완료'}</button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">{abyssList.map((item: any) => renderTask(item, 'abyss'))}</div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'abyss_raid') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-emerald-400 text-sm whitespace-nowrap">레이드 관리</h3>
                    <button onClick={() => handleSmartToggle('raid')} className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${isRaidAllChecked ? 'bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>{isRaidAllChecked ? '전체 해제' : '전체 완료'}</button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">{raidList.map((item: any) => renderTask(item, 'raid'))}</div>
                </div>
              )}

            </div>
          )}

          {/* ⚖️ 물물 교환 카테고리 (💡 items-start 추가로 세로 공백 제거) */}
          {(activeTab === 'all' || activeTab === 'barter') && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--panel-border)] pb-2">
                <h3 className="font-bold text-[var(--accent)] text-xs md:text-sm whitespace-nowrap">⚖️ 물물 교환 목록</h3>
                
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={tradeSearch}
                    onChange={(e) => setTradeSearch(e.target.value)}
                    placeholder="NPC / 맵 / 보상 / 소모품 검색..."
                    className="flex-1 min-w-0 sm:w-64 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={() => setTradeSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    {tradeSortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}
                  </button>
                </div>
              </div>

              {barterTrades.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 items-start">
                  {barterTrades.map(renderTradeCard)}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-[var(--text-sub)]">등록되거나 검색된 물물교환 품목이 없습니다.</div>
              )}
            </div>
          )}

          {/* 🛒 상점 구매 카테고리 (💡 items-start 추가로 세로 공백 제거) */}
          {(activeTab === 'all' || activeTab === 'shop') && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--panel-border)] pb-2">
                <h3 className="font-bold text-amber-400 text-xs md:text-sm whitespace-nowrap">🛒 상점 구매 목록</h3>
                
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={tradeSearch}
                    onChange={(e) => setTradeSearch(e.target.value)}
                    placeholder="NPC / 맵 / 보상 / 소모품 검색..."
                    className="flex-1 min-w-0 sm:w-64 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={() => setTradeSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    {tradeSortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}
                  </button>
                </div>
              </div>

              {shopTrades.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 items-start">
                  {shopTrades.map(renderTradeCard)}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-[var(--text-sub)]">등록되거나 검색된 상점 구매 품목이 없습니다.</div>
              )}
            </div>
          )}

          {/* ⚡ 클래스 레벨 관리 (💡 3열 구조 md:grid-cols-3으로 직업명 복구) */}
          {(activeTab === 'all' || activeTab === 'levels') && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-[var(--accent)] text-xs md:text-sm whitespace-nowrap border-b border-[var(--panel-border)] pb-2">⚡ 클래스 레벨 관리</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {dbClasses.map((cls: any) => {
                  const currentLevel = levels[cls.name] || 1;
                  const isMax = currentLevel === 65;
                  return (
                    <div key={cls.name} className={`flex items-center justify-between p-1.5 md:p-2.5 rounded-lg border transition min-w-0 ${isMax ? 'border-[var(--accent)] bg-[var(--accent-soft)]/20' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}>
                      <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
                        <span className="text-xs md:text-sm shrink-0">{cls.icon || "🛡️"}</span>
                        <span className={`text-xs md:text-sm font-bold truncate ${isMax ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>{cls.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs md:text-sm font-black font-mono text-[var(--accent)] mr-1 whitespace-nowrap">
                          Lv.{currentLevel}
                        </span>
                        
                        <button 
                          onClick={() => updateClassLevel(cls.name, -10)} 
                          className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          -10
                        </button>
                        <button 
                          onClick={() => updateClassLevel(cls.name, -1)} 
                          className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          -1
                        </button>
                        
                        {isMax ? (
                          <button 
                            onClick={() => setMinLevel(cls.name)} 
                            className="px-2 py-0.5 text-[11px] font-black rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition whitespace-nowrap cursor-pointer"
                          >
                            MIN
                          </button>
                        ) : (
                          <button 
                            onClick={() => setMaxLevel(cls.name)} 
                            className="px-2 py-0.5 text-[11px] font-bold rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition whitespace-nowrap cursor-pointer"
                          >
                            MAX
                          </button>
                        )}

                        <button 
                          onClick={() => updateClassLevel(cls.name, 1)} 
                          className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          +1
                        </button>
                        <button 
                          onClick={() => updateClassLevel(cls.name, 10)} 
                          className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}