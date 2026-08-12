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
const RANKING_INFO = {
  TELOS: { type: 'TELOS', stat: '종합' }, KRATOS: { type: 'KRATOS', stat: '전투력' }, 
  TECHNE: { type: 'TECHNE', stat: '생활력' }, HARMONIA: { type: 'HARMONIA', stat: '매력' }, PIETAS: { type: 'PIETAS', stat: '공헌도' }
};
const TOP_TITLES = { TELOS: ['헬리오스', '셀레네', '에오스'], PIETAS: ['시리우스', '레굴루스', '알데바란'], TECHNE: ['폴리매스', '마이스터', '아르티장'], HARMONIA: ['아글라이아', '카리스', '칼로스'] };
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
  
  // 실시간 자동 저장 상태
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const isInitialLoad = useRef(true);

  // 모비라이프형 탭 메뉴 상태 ('daily' | 'weekly' | 'abyss_raid' | 'trades' | 'levels' | 'all')
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'abyss_raid' | 'trades' | 'levels' | 'all'>('daily');

  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [dbContents, setDbContents] = useState<any[]>([]);
  const [dbTrades, setDbTrades] = useState<any[]>([]); 
  const [allCharacters, setAllCharacters] = useState<any[]>([]);

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [accountContribution, setAccountContribution] = useState<string>("");

  const defaultProfile = { nickname: "", job: "전사", combatPower: "", magicResistance: "", lifeEnergy: "", charm: "", intro: "", isMain: false };
  const [profile, setProfile] = useState(defaultProfile);
  const [levels, setLevels] = useState<Record<string, number>>({});
  
  const [dailyChecks, setDailyChecks] = useState<number[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<number[]>([]);
  const [repeatChecks, setRepeatChecks] = useState<Record<number, boolean[]>>({});
  const [abyssChecks, setAbyssChecks] = useState<number[]>([]);
  const [raidChecks, setRaidChecks] = useState<number[]>([]);
  const [tradeProgress, setTradeProgress] = useState<Record<number, number>>({});
  const [pinnedTrades, setPinnedTrades] = useState<number[]>([]);

  const [isTitleAccordionOpen, setIsTitleAccordionOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageList, setManageList] = useState<any[]>([]);

  const abyssList = dbContents.filter((c: any) => c.type === 'abyss');
  const raidList = dbContents.filter((c: any) => c.type === 'raid');

  const blackHoleDaily = dbTasks.find((t: any) => (t.type === 'daily' || t.type === 'repeat_daily') && t.name.includes("검은 구멍"));
  const blackHoleWeekly = dbTasks.find((t: any) => (t.type === 'weekly' || t.type === 'repeat_weekly') && t.name.includes("검은 구멍"));
  
  const visibleDailyList = dbTasks.filter((t: any) => (t.type === 'daily' || t.type === 'repeat_daily') && !t.name.includes("검은 구멍"));
  const visibleWeeklyList = dbTasks.filter((t: any) => (t.type === 'weekly' || t.type === 'repeat_weekly' || t.type === 'repeat_weekend') && !t.name.includes("검은 구멍"));

  const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);

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

    fetchMasterData(parsedUser.nickname);
  }, [router]);

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
    await fetchUserCharacters(loginUserNick, contRes.data || []);
  };

  const fetchAccountData = async (loginUserNick: string) => {
    try {
      const { data } = await supabase.from('characters').select('contribution').eq('owner', loginUserNick).limit(1);
      if (data && data.length > 0) setAccountContribution(data[0].contribution ?? "");
    } catch (e) {}
  };

  const fetchUserCharacters = async (loginUserNick: string, contentsList: any[]) => {
    try {
      const { data } = await supabase
        .from('characters')
        .select('nickname, sort_order, owner, job')
        .or(`owner.eq.${loginUserNick},nickname.eq.${loginUserNick}`)
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setMyCharacters(data);
        const urlParams = new URLSearchParams(window.location.search);
        const targetChar = urlParams.get('char');
        let target = data[0].nickname; 
        
        if (targetChar && data.some((d: any) => d.nickname === targetChar)) target = targetChar;
        else if (data.some((d: any) => d.nickname === loginUserNick)) target = loginUserNick;
        
        loadCharacterData(target, contentsList);
      } else {
        const initialChar = { nickname: loginUserNick, sort_order: 0, owner: loginUserNick, job: '전사' };
        setMyCharacters([initialChar]);
        loadCharacterData(loginUserNick, contentsList);
      }
    } catch (e) {}
  };

  const loadCharacterData = async (charName: string, contentsList = dbContents) => {
    isInitialLoad.current = true;
    try {
      const { data } = await supabase.from('characters').select('*').eq('nickname', charName).single();
      if (data) {
        setProfile({
          nickname: data.nickname, job: data.job || "전사",
          combatPower: data.combat_power || "", magicResistance: data.magic_resistance || "",
          lifeEnergy: data.life_energy || "", charm: data.charm || "", 
          intro: data.intro || "", isMain: data.is_main || false
        });
        if (data.contribution !== undefined && data.contribution !== null) setAccountContribution(data.contribution);
        setLevels(data.levels || {});
        
        const dChecks = Array.isArray(data.daily_checks) ? data.daily_checks : [];
        setDailyChecks(dChecks.map(Number).filter((n: any) => !isNaN(n)));
        
        if (data.weekly_checks && !Array.isArray(data.weekly_checks)) {
          const wNormals = Array.isArray(data.weekly_checks.normal) ? data.weekly_checks.normal : [];
          setWeeklyChecks(wNormals.map(Number).filter((n: any) => !isNaN(n)));
          setRepeatChecks(data.weekly_checks.repeat || {});
        } else {
          setWeeklyChecks([]); setRepeatChecks({});
        }
        
        const rChecks = Array.isArray(data.raid_checks) ? data.raid_checks.map(Number).filter((n: any) => !isNaN(n)) : [];
        setAbyssChecks(rChecks.filter((id: number) => contentsList.find((c: any) => c.id === id)?.type === 'abyss'));
        setRaidChecks(rChecks.filter((id: number) => contentsList.find((c: any) => c.id === id)?.type === 'raid'));
        setTradeProgress(data.trade_checks || {});
      } else {
        setProfile({ ...defaultProfile, nickname: charName });
        setLevels({}); setDailyChecks([]); setWeeklyChecks([]); setRepeatChecks({});
        setAbyssChecks([]); setRaidChecks([]); setTradeProgress({});
      }
    } catch (e) {} finally {
      setTimeout(() => {
        isInitialLoad.current = false;
        setSaveStatus('saved');
      }, 150);
    }
  };

  // 실시간 오토 세이브
  const saveProgress = async () => {
    if (!profile.nickname.trim() || !user?.nickname) return;
    try {
      setSaveStatus('saving');
      if (profile.isMain) {
        await supabase.from('characters').update({ is_main: false }).eq('owner', user.nickname).neq('nickname', profile.nickname);
      }

      const existingIndex = myCharacters.findIndex((c: any) => c.nickname === profile.nickname);
      const currentSortOrder = existingIndex !== -1 ? (myCharacters[existingIndex].sort_order ?? myCharacters.length) : myCharacters.length;

      const payload = {
        nickname: profile.nickname, owner: user.nickname, sort_order: currentSortOrder,
        job: profile.job, combat_power: Number(profile.combatPower) || 0, magic_resistance: Number(profile.magicResistance) || 0,
        life_energy: Number(profile.lifeEnergy) || 0, charm: Number(profile.charm) || 0, contribution: Number(accountContribution) || 0,
        intro: profile.intro, is_main: profile.isMain, levels: levels, 
        daily_checks: dailyChecks, weekly_checks: { normal: weeklyChecks, repeat: repeatChecks },
        raid_checks: [...abyssChecks, ...raidChecks], trade_checks: tradeProgress, updated_at: new Date()
      };
      
      await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      await supabase.from('characters').update({ contribution: Number(accountContribution) || 0 }).eq('owner', user.nickname);

      if (existingIndex === -1) {
        setMyCharacters((prev: any[]) => [...prev, { nickname: profile.nickname, sort_order: currentSortOrder, job: profile.job }]);
      }

      setSaveStatus('saved');
    } catch (error) { 
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveProgress();
    }, 800);
    return () => clearTimeout(timer);
  }, [profile, accountContribution, levels, dailyChecks, weeklyChecks, repeatChecks, abyssChecks, raidChecks, tradeProgress]);

  const switchCharacter = async (targetName: string) => { 
    if (targetName === profile.nickname) return;
    await saveProgress(); 
    loadCharacterData(targetName, dbContents); 
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

  const updateTradeProgress = (tradeId: number, delta: number, max: number) => {
    setTradeProgress(prev => {
      const current = prev[tradeId] || 0;
      let next = current + delta;
      if (next < 0) next = 0; if (next > max) next = max;
      return { ...prev, [tradeId]: next };
    });
  };

  // 단일 스마트 토글 버튼 (완료 ➔ 해제)
  const handleSmartToggle = (type: string) => {
    if (type === 'daily') {
      const normals = visibleDailyList.filter((t: any) => !t.type.startsWith('repeat')).map((t: any) => t.id);
      const isAllChecked = normals.every(id => dailyChecks.includes(id));
      setDailyChecks(isAllChecked ? [] : normals);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleDailyList.filter((t: any) => t.type.startsWith('repeat')).forEach((t: any) => {
          next[t.id] = isAllChecked ? [] : Array(t.max_count).fill(true);
        });
        return next;
      });
    }
    if (type === 'weekly') {
      const normals = visibleWeeklyList.filter((t: any) => !t.type.startsWith('repeat')).map((t: any) => t.id);
      const isAllChecked = normals.every(id => weeklyChecks.includes(id));
      setWeeklyChecks(isAllChecked ? [] : normals);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleWeeklyList.filter((t: any) => t.type.startsWith('repeat')).forEach((t: any) => {
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
      ...c, originalName: c.nickname, tempNickname: c.nickname, tempJob: c.job, isDeleted: false, sort_order: i
    }));
    setManageList(editList);
    setIsManageModalOpen(true);
  };

  const addManageCharacter = () => {
    setManageList([...manageList, { originalName: "", tempNickname: "새 캐릭터", tempJob: "전사", isDeleted: false, sort_order: manageList.length, isNew: true }]);
  };

  const moveManageCharacter = (index: number, direction: number) => {
    const newList = [...manageList];
    if (index + direction < 0 || index + direction >= newList.length) return;
    const temp = newList[index];
    newList[index] = newList[index + direction];
    newList[index + direction] = temp;
    setManageList(newList.map((item, idx) => ({ ...item, sort_order: idx })));
  };

  const saveManageModal = async () => {
    const activeChars = manageList.filter(c => !c.isDeleted);
    if (activeChars.length === 0) {
      alert("최소 1개의 캐릭터는 유지되어야 합니다."); return;
    }
    
    const toDelete = manageList.filter(c => c.isDeleted && !c.isNew);
    for (const char of toDelete) {
      await supabase.from('characters').delete().eq('nickname', char.originalName);
    }

    for (const char of activeChars) {
      const payload: any = {
        owner: user.nickname, sort_order: char.sort_order, job: char.tempJob,
        contribution: Number(accountContribution) || 0
      };
      
      if (char.isNew) {
        payload.nickname = char.tempNickname;
        await supabase.from('characters').insert([payload]);
      } else {
        if (char.originalName !== char.tempNickname) payload.nickname = char.tempNickname;
        await supabase.from('characters').update(payload).eq('nickname', char.originalName);
      }
    }

    setIsManageModalOpen(false);
    const targetNick = activeChars.find(c => c.originalName === profile.nickname)?.tempNickname || activeChars[0].tempNickname;
    await fetchMasterData(user.nickname); 
    window.history.replaceState(null, '', `?char=${encodeURIComponent(targetNick)}`);
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

  // 접두사("어비스 - ", "레이드 - ") 자동 제거 함수
  const cleanItemName = (name: string) => name.replace(/^어비스\s*-\s*/, '').replace(/^레이드\s*-\s*/, '');

  const renderTask = (item: any, type: 'daily' | 'weekly' | 'abyss' | 'raid') => {
    const displayName = cleanItemName(item.name);

    if (item.type?.startsWith('repeat')) {
      const currentCount = (repeatChecks[item.id] || []).filter(Boolean).length;
      const isMax = currentCount === item.max_count;
      const badgeText = item.type === 'repeat_daily' ? '일간' : item.type === 'repeat_weekend' ? '주말' : '주간';
      
      return (
        <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isMax ? "bg-[var(--accent-soft)] border-[var(--accent)]" : "bg-[var(--inner-box)] border-[var(--panel-border)]"}`}>
          <div className="flex flex-col min-w-0 pr-1.5">
            <span className={`text-[9px] w-fit px-1 py-0.2 rounded font-bold ${isMax ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--panel)] text-[var(--text-sub)]'}`}>{badgeText}</span>
            <span className={`text-xs md:text-sm font-medium truncate ${isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}>{displayName}</span>
          </div>
          <div className="flex items-center gap-1 bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
            <span className={`text-xs font-bold min-w-[28px] text-center ${isMax ? "text-[var(--accent)]" : "text-[var(--text-sub)]"}`}>{currentCount}/{item.max_count}</span>
            <div className="flex gap-0.5 border-l border-[var(--panel-border)] pl-1">
              <button onClick={() => updateRepeatCount(item.id, -1, item.max_count)} className="w-4 h-4 flex justify-center items-center rounded bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] text-[10px]">-</button>
              <button onClick={() => updateRepeatCount(item.id, 1, item.max_count)} className="w-4 h-4 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-[10px]">+</button>
            </div>
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
      if (type === 'abyss') return { wrapper: "bg-emerald-500/10 border-emerald-500/50", text: "text-emerald-400 font-bold", box: "bg-emerald-500 text-white" };
      if (type === 'raid') return { wrapper: "bg-indigo-500/10 border-indigo-500/50", text: "text-indigo-400 font-bold", box: "bg-indigo-500 text-white" };
      return { wrapper: "", text: "", box: "" };
    };

    const theme = getColorTheme();

    return (
      <div key={item.id} onClick={() => setChecks(isChecked ? checks.filter((i: number) => i !== item.id) : [...checks, item.id])}
           className={`flex items-center justify-between p-2 md:p-2.5 rounded-lg cursor-pointer border transition-all min-w-0 ${theme.wrapper}`}>
        <span className={`text-xs md:text-sm truncate pr-1.5 ${theme.text}`}>{displayName}</span>
        <div className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${theme.box}`}>
          {isChecked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
      </div>
    );
  };

  if (!mounted || !user) return null;

  const bhDailyDone = blackHoleDaily && dailyChecks.includes(blackHoleDaily.id);
  const bhWeeklyCount = blackHoleWeekly ? (repeatChecks[blackHoleWeekly.id] || []).filter(Boolean).length : 0;
  const bhTotalCount = (bhDailyDone ? 1 : 0) + bhWeeklyCount;
  const bhMaxCount = (blackHoleDaily ? 1 : 0) + (blackHoleWeekly?.max_count || 0);
  
  const earnedTitles = getMyEarnedTitles();

  // 즐겨찾기(핀) 적용 정렬
  const dailyTrades = [...dbTrades.filter(t => t.reset_type === '일간')].sort((a, b) => {
    const aPin = pinnedTrades.includes(a.id) ? 1 : 0;
    const bPin = pinnedTrades.includes(b.id) ? 1 : 0;
    return bPin - aPin;
  });

  const weeklyTrades = [...dbTrades.filter(t => t.reset_type === '주간')].sort((a, b) => {
    const aPin = pinnedTrades.includes(a.id) ? 1 : 0;
    const bPin = pinnedTrades.includes(b.id) ? 1 : 0;
    return bPin - aPin;
  });

  // 스마트 토글 버튼 텍스트 판단
  const isDailyAllChecked = visibleDailyList.filter((t: any) => !t.type.startsWith('repeat')).every((t: any) => dailyChecks.includes(t.id));
  const isWeeklyAllChecked = visibleWeeklyList.filter((t: any) => !t.type.startsWith('repeat')).every((t: any) => weeklyChecks.includes(t.id));
  const isAbyssAllChecked = abyssList.every((t: any) => abyssChecks.includes(t.id));
  const isRaidAllChecked = raidList.every((t: any) => raidChecks.includes(t.id));

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans pb-16 pt-2 md:pt-4">
      
      {/* 캐릭터 관리 모달 (모바일 A+ 환경 반응형 방어) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2.5">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl w-[96%] max-w-xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 md:p-4 border-b border-[var(--panel-border)] flex justify-between items-center bg-[var(--inner-box)]">
              <h2 className="text-base md:text-lg font-black text-[var(--accent)]">⚙️ 캐릭터 관리</h2>
              <button onClick={() => setIsManageModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm">✕</button>
            </div>
            <div className="p-3 md:p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
              {manageList.map((char, index) => !char.isDeleted && (
                <div key={index} className="flex items-center gap-2 bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)]">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <label className="text-[9px] text-[var(--text-sub)] font-bold">닉네임</label>
                    <input value={char.tempNickname} onChange={(e) => { const nw = [...manageList]; nw[index].tempNickname = e.target.value; setManageList(nw); }} className="bg-[var(--panel)] border border-[var(--panel-border)] rounded px-2 py-1 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none w-full" />
                  </div>
                  <div className="flex flex-col gap-0.5 w-24 shrink-0">
                    <label className="text-[9px] text-[var(--text-sub)] font-bold">주 클래스</label>
                    <select value={char.tempJob} onChange={(e) => { const nw = [...manageList]; nw[index].tempJob = e.target.value; setManageList(nw); }} className="bg-[var(--panel)] border border-[var(--panel-border)] rounded px-1.5 py-1 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none w-full">
                      {dbClasses.map((cls: any) => <option key={cls.name} value={cls.name}>{cls.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1 items-end shrink-0 pt-3">
                    <div className="flex bg-[var(--panel)] border border-[var(--panel-border)] rounded overflow-hidden text-xs">
                      <button onClick={() => moveManageCharacter(index, -1)} disabled={index === 0} className="px-2 py-1 hover:bg-[var(--panel-hover)] disabled:opacity-30">▲</button>
                      <div className="w-px bg-[var(--panel-border)]"></div>
                      <button onClick={() => moveManageCharacter(index, 1)} disabled={index === manageList.filter(c=>!c.isDeleted).length - 1} className="px-2 py-1 hover:bg-[var(--panel-hover)] disabled:opacity-30">▼</button>
                    </div>
                    <button onClick={() => { if(confirm(`정말 [${char.tempNickname}] 캐릭터를 삭제하시겠습니까?`)) { const nw = [...manageList]; nw[index].isDeleted = true; setManageList(nw); } }} className="bg-red-950/40 text-red-400 border border-red-800/50 px-2 py-1 rounded text-xs font-bold">삭제</button>
                  </div>
                </div>
              ))}
              <button onClick={addManageCharacter} className="w-full border border-dashed border-[var(--accent)] text-[var(--accent)] py-2 rounded-lg hover:bg-[var(--accent-soft)] font-bold text-xs transition">+ 새 캐릭터 추가</button>
            </div>
            <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex justify-end gap-2">
              <button onClick={() => setIsManageModalOpen(false)} className="px-3 py-1.5 rounded-lg bg-[var(--panel)] text-[var(--text-sub)] text-xs font-bold transition">취소</button>
              <button onClick={saveManageModal} className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black transition">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto p-2.5 md:p-6 space-y-3 md:space-y-4">
        
        {/* 헤더 & 가독성 최적화 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-2.5 px-3 md:px-5 shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-xl font-black tracking-widest leading-none text-[var(--text-main)]">CHRONOS</h1>
              <span className="text-[var(--accent)] text-xs font-bold tracking-wide whitespace-nowrap">크로노스 : 캐릭터 관리</span>
            </div>
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg w-full md:max-w-[650px] flex items-center gap-2">
              <span className="text-xs shrink-0">⏳</span>
              <p className="text-[10px] md:text-[11px] font-bold leading-tight break-keep text-[var(--text-sub)]">
                시간과 기록의 신, 크로노스. 입력한 능력치는 <span className="text-[var(--accent)]">AGORA 명예의 전당</span>으로 즉시 연결됩니다.
              </p>
            </div>
          </div>
        </header>
        
        {/* 상단 프로필 & 슬림 아바타 바 */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 md:p-4 shadow-xs space-y-3">
          
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2.5 gap-2">
            
            {/* 초상화 & 닉네임 & 주 클래스 */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 md:w-11 md:h-11 bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] flex items-center justify-center text-lg shrink-0 shadow-inner" title="AI 캐리커처 연동 예정">
                🎨
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm md:text-base font-black text-[var(--text-main)] truncate max-w-[130px] md:max-w-[200px]">{profile.nickname}</span>
                  <span className="text-[10px] bg-[var(--inner-box)] border border-[var(--panel-border)] px-1.5 py-0.2 rounded font-bold text-[var(--accent)] whitespace-nowrap">{profile.job}</span>
                </div>
                <div className="text-[10px] text-[var(--text-sub)] font-mono mt-0.5">총 레벨 {totalLevel} LV</div>
              </div>
            </div>

            {/* 자동 저장 상태 & 칭호 토글 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                saveStatus === 'saving' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                saveStatus === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {saveStatus === 'saving' ? '⏳ 저장 중...' : saveStatus === 'error' ? '⚠️ 실패' : '✅ 저장됨'}
              </span>

              <button onClick={() => setIsTitleAccordionOpen(!isTitleAccordionOpen)} className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] font-bold text-[var(--accent)] px-2 py-1 rounded transition whitespace-nowrap">
                ✨ 칭호 {earnedTitles.length}
              </button>
            </div>

          </div>

          {/* 칭호 아코디언 */}
          {isTitleAccordionOpen && (
            <div className="p-2.5 border rounded-lg border-[var(--panel-border)] bg-[var(--inner-box)] space-y-1.5 text-xs">
              {earnedTitles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {earnedTitles.map(t => (
                    <div key={t.type} className={`text-[10px] font-black p-1 rounded border text-center truncate ${t.tagClass}`}>{t.name}</div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-[var(--text-sub)] text-center py-1">아고라 랭킹을 달성해 칭호를 획득해 보세요.</div>
              )}
            </div>
          )}

          {/* 보유 캐릭터 스위처 바 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-[var(--text-sub)]">
              <span>캐릭터 선택</span>
              <button onClick={openManageModal} className="text-[10px] text-[var(--accent)] hover:underline">⚙️ 캐릭터 관리</button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 touch-pan-x">
              {myCharacters.map((char: any) => (
                <button 
                  key={char.nickname} 
                  onClick={() => switchCharacter(char.nickname)} 
                  className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border text-center transition shrink-0 min-w-[70px] ${char.nickname === profile.nickname ? 'bg-[var(--accent-soft)] border-[var(--accent)]' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}
                >
                  <span className={`text-xs font-black truncate max-w-[80px] ${char.nickname === profile.nickname ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>{char.nickname}</span>
                  <span className="text-[9px] text-[var(--text-sub)] truncate">{char.job || '전사'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5대 스탯 (순서: 전투력 ➔ 생활력 ➔ 매력 ➔ 마도저항 ➔ 길드 공헌도) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)]">
              <label className="text-[10px] font-black text-red-400 block whitespace-nowrap">⚔️ 전투력</label>
              <input type="number" value={profile.combatPower} onChange={e => updateProfile("combatPower", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm md:text-base font-black text-[var(--text-main)] outline-none" />
            </div>
            <div className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)]">
              <label className="text-[10px] font-black text-emerald-400 block whitespace-nowrap">🌿 생활력</label>
              <input type="number" value={profile.lifeEnergy} onChange={e => updateProfile("lifeEnergy", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm md:text-base font-black text-[var(--text-main)] outline-none" />
            </div>
            <div className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)]">
              <label className="text-[10px] font-black text-pink-400 block whitespace-nowrap">✨ 매력</label>
              <input type="number" value={profile.charm} onChange={e => updateProfile("charm", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm md:text-base font-black text-[var(--text-main)] outline-none" />
            </div>
            <div className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)]">
              <label className="text-[10px] font-black text-purple-400 block whitespace-nowrap">🔮 마도저항</label>
              <input type="number" value={profile.magicResistance} onChange={e => updateProfile("magicResistance", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm md:text-base font-black text-[var(--text-main)] outline-none" />
            </div>
            <div className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)] col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-amber-400 block whitespace-nowrap">🛡️ 길드 공헌도</label>
              <input type="number" value={accountContribution} onChange={e => setAccountContribution(e.target.value)} placeholder="0" className="w-full bg-transparent text-sm md:text-base font-black text-[var(--text-main)] outline-none" />
            </div>
          </div>
          
          {/* 자기소개 & 대표 캐릭터 체크 */}
          <div className="flex gap-2">
            <input value={profile.intro} onChange={(e) => updateProfile("intro", e.target.value)} placeholder="자기소개나 인삿말을 적어주세요!" className="flex-1 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-2 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none" />
            <label className="flex items-center justify-center gap-1.5 bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 rounded-lg cursor-pointer hover:bg-[var(--panel-hover)] transition shrink-0">
              <input type="checkbox" checked={profile.isMain} onChange={e => updateProfile("isMain", e.target.checked)} className="accent-[var(--accent)] w-3.5 h-3.5" />
              <span className="text-xs font-bold text-[var(--text-main)] whitespace-nowrap">대표</span>
            </label>
          </div>

        </div>

        {/* 검은 구멍 탐험 슬림 상황판 */}
        {blackHoleDaily && blackHoleWeekly && (
          <div className="bg-[var(--panel)] rounded-xl border border-purple-500/40 p-3 shadow-xs flex flex-col gap-2 relative overflow-hidden">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">🕳️</span>
                <span className="text-xs font-black text-purple-300 truncate">검은 구멍 상황판</span>
              </div>
              <div className="text-xs font-black text-[var(--text-main)] shrink-0">
                {bhTotalCount} <span className="text-[10px] text-[var(--text-sub)] font-normal">/ {bhMaxCount}</span>
              </div>
            </div>
            <div className="w-full bg-[var(--inner-box)] h-1.5 rounded-full overflow-hidden border border-purple-900/50">
              <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-500" style={{ width: `${(bhTotalCount / bhMaxCount) * 100}%` }}></div>
            </div>
            <div className="flex gap-2 text-xs">
              <div onClick={() => setDailyChecks(bhDailyDone ? dailyChecks.filter(i => i !== blackHoleDaily.id) : [...dailyChecks, blackHoleDaily.id])} className={`flex-1 flex items-center justify-between p-1.5 rounded-lg border cursor-pointer ${bhDailyDone ? "bg-purple-900/30 border-purple-500/60" : "bg-[var(--inner-box)] border-[var(--panel-border)]"}`}>
                <span className={`text-[11px] font-bold ${bhDailyDone ? "text-purple-300" : "text-[var(--text-sub)]"}`}>기본 (1회)</span>
                <span className={`text-[10px] font-bold ${bhDailyDone ? "text-purple-400" : "text-[var(--text-sub)]"}`}>{bhDailyDone ? "✓" : "미완료"}</span>
              </div>
              <div className="flex-1 flex items-center justify-between p-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)]">
                <span className="text-[11px] font-bold text-[var(--text-sub)]">초과 ({blackHoleWeekly.max_count}회)</span>
                <div className="flex gap-1 items-center">
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.id, -1, blackHoleWeekly.max_count)} className="w-4 h-4 rounded bg-[var(--panel)] text-[10px] font-bold text-[var(--text-sub)]">-</button>
                  <span className="text-xs font-black text-purple-400 min-w-[14px] text-center">{bhWeeklyCount}</span>
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.id, 1, blackHoleWeekly.max_count)} className="w-4 h-4 rounded bg-purple-900/40 text-[10px] font-bold text-purple-400">+</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ⭐️ 모비라이프형 상단 탭 메뉴 (스마트 스크롤 방지) */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-[var(--inner-box)] p-1.5 rounded-xl border border-[var(--panel-border)] touch-pan-x">
          {[
            { id: 'daily', label: '☀️ 일일' },
            { id: 'weekly', label: '🌙 주간' },
            { id: 'abyss_raid', label: '🌌 어비스/레이드' },
            { id: 'trades', label: '⚖️ 물물교환' },
            { id: 'levels', label: '⚡ 클래스' },
            { id: 'all', label: '📋 전체보기' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs' 
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 그리드/탭 레이아웃 */}
        <div className="space-y-4">
          
          {/* 일일 / 주간 / 어비스 / 레이드 관리 */}
          {(activeTab === 'all' || activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'abyss_raid') && (
            <div className={`grid gap-3 ${activeTab === 'all' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
              
              {/* 일일 컨텐츠 */}
              {(activeTab === 'all' || activeTab === 'daily') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-2.5 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-amber-400 text-xs md:text-sm whitespace-nowrap">일일 컨텐츠</h3>
                    <button 
                      onClick={() => handleSmartToggle('daily')} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition shadow-xs whitespace-nowrap ${
                        isDailyAllChecked 
                          ? 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-rose-400 border border-[var(--panel-border)]' 
                          : 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      }`}
                    >
                      {isDailyAllChecked ? '전체 해제' : '전체 완료'}
                    </button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">{visibleDailyList.map((item: any) => renderTask(item, 'daily'))}</div>
                </div>
              )}

              {/* 주간 컨텐츠 */}
              {(activeTab === 'all' || activeTab === 'weekly') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-2.5 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-blue-400 text-xs md:text-sm whitespace-nowrap">주간 컨텐츠</h3>
                    <button 
                      onClick={() => handleSmartToggle('weekly')} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition shadow-xs whitespace-nowrap ${
                        isWeeklyAllChecked 
                          ? 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-rose-400 border border-[var(--panel-border)]' 
                          : 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      }`}
                    >
                      {isWeeklyAllChecked ? '전체 해제' : '전체 완료'}
                    </button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">{visibleWeeklyList.map((item: any) => renderTask(item, 'weekly'))}</div>
                </div>
              )}

              {/* 어비스 관리 */}
              {(activeTab === 'all' || activeTab === 'abyss_raid') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-2.5 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-emerald-400 text-xs md:text-sm whitespace-nowrap">어비스 관리</h3>
                    <button 
                      onClick={() => handleSmartToggle('abyss')} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition shadow-xs whitespace-nowrap ${
                        isAbyssAllChecked 
                          ? 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-rose-400 border border-[var(--panel-border)]' 
                          : 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      }`}
                    >
                      {isAbyssAllChecked ? '전체 해제' : '전체 완료'}
                    </button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">{abyssList.map((item: any) => renderTask(item, 'abyss'))}</div>
                </div>
              )}

              {/* 레이드 관리 */}
              {(activeTab === 'all' || activeTab === 'abyss_raid') && (
                <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-2.5 border-b border-[var(--panel-border)] pb-2 gap-2">
                    <h3 className="font-bold text-indigo-400 text-xs md:text-sm whitespace-nowrap">레이드 관리</h3>
                    <button 
                      onClick={() => handleSmartToggle('raid')} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition shadow-xs whitespace-nowrap ${
                        isRaidAllChecked 
                          ? 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-rose-400 border border-[var(--panel-border)]' 
                          : 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      }`}
                    >
                      {isRaidAllChecked ? '전체 해제' : '전체 완료'}
                    </button>
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">{raidList.map((item: any) => renderTask(item, 'raid'))}</div>
                </div>
              )}

            </div>
          )}

          {/* 물물교환 & 주간상점 (모바일 카드 가로 콤팩트화) */}
          {(activeTab === 'all' || activeTab === 'trades') && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 md:p-4 shadow-xs space-y-4">
              <h3 className="font-bold text-[var(--accent)] text-sm md:text-base whitespace-nowrap border-b border-[var(--panel-border)] pb-2">⚖️ 주간 구매 및 물물 교환 관리</h3>
              
              {/* 일일 갱신 카드 리스트 */}
              <div className="space-y-2">
                <h4 className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 일일 갱신 (Daily)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dailyTrades.map((trade: any) => {
                    const currentVal = tradeProgress[trade.id] || 0;
                    const isMax = currentVal >= trade.limit;
                    const isPinned = pinnedTrades.includes(trade.id);
                    return (
                      <div key={trade.id} className={`flex flex-col justify-between p-2.5 rounded-lg border transition ${isPinned ? 'bg-[var(--accent-soft)]/20 border-[var(--accent)]' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}>
                        <div className="flex items-center justify-between mb-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button onClick={() => togglePinTrade(trade.id)} className={`text-xs ${isPinned ? 'opacity-100' : 'opacity-30'}`}>📌</button>
                            <span className="font-bold text-xs text-[var(--text-main)] truncate">{trade.map || "-"} <span className="text-[10px] text-[var(--text-sub)] font-normal">({trade.npc || "-"})</span></span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--panel)] text-[var(--text-sub)] shrink-0">{trade.scope}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-emerald-400 truncate">보상: {trade.reward} ({trade.reward_cnt}개)</div>
                            <div className="text-[10px] font-bold text-amber-400 truncate">소모: {trade.cost} ({trade.cost_cnt}개)</div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[var(--panel)] px-2 py-1 rounded border border-[var(--panel-border)] shrink-0">
                            <span className={`text-xs font-bold w-8 text-center ${isMax ? "text-emerald-400" : "text-[var(--text-main)]"}`}>{currentVal}/{trade.limit}</span>
                            <div className="flex gap-0.5 border-l border-[var(--panel-border)] pl-1">
                              <button onClick={() => updateTradeProgress(trade.id, -1, trade.limit)} className="w-4 h-4 rounded bg-[var(--inner-box)] text-[10px] font-bold text-[var(--text-sub)]">-</button>
                              <button onClick={() => updateTradeProgress(trade.id, 1, trade.limit)} className="w-4 h-4 rounded bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-[10px]">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 주간 갱신 카드 리스트 */}
              <div className="space-y-2 pt-2 border-t border-[var(--panel-border)]">
                <h4 className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 주간 갱신 (Weekly)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {weeklyTrades.map((trade: any) => {
                    const currentVal = tradeProgress[trade.id] || 0;
                    const isMax = currentVal >= trade.limit;
                    const isPinned = pinnedTrades.includes(trade.id);
                    return (
                      <div key={trade.id} className={`flex flex-col justify-between p-2.5 rounded-lg border transition ${isPinned ? 'bg-[var(--accent-soft)]/20 border-[var(--accent)]' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}>
                        <div className="flex items-center justify-between mb-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button onClick={() => togglePinTrade(trade.id)} className={`text-xs ${isPinned ? 'opacity-100' : 'opacity-30'}`}>📌</button>
                            <span className="font-bold text-xs text-[var(--text-main)] truncate">{trade.map || "-"} <span className="text-[10px] text-[var(--text-sub)] font-normal">({trade.npc || "-"})</span></span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--panel)] text-[var(--text-sub)] shrink-0">{trade.scope}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-emerald-400 truncate">보상: {trade.reward} ({trade.reward_cnt}개)</div>
                            <div className="text-[10px] font-bold text-amber-400 truncate">소모: {trade.cost} ({trade.cost_cnt}개)</div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[var(--panel)] px-2 py-1 rounded border border-[var(--panel-border)] shrink-0">
                            <span className={`text-xs font-bold w-8 text-center ${isMax ? "text-emerald-400" : "text-[var(--text-main)]"}`}>{currentVal}/{trade.limit}</span>
                            <div className="flex gap-0.5 border-l border-[var(--panel-border)] pl-1">
                              <button onClick={() => updateTradeProgress(trade.id, -1, trade.limit)} className="w-4 h-4 rounded bg-[var(--inner-box)] text-[10px] font-bold text-[var(--text-sub)]">-</button>
                              <button onClick={() => updateTradeProgress(trade.id, 1, trade.limit)} className="w-4 h-4 rounded bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-[10px]">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* 클래스 레벨 관리 (가로 1줄 슬림 배치 & MAX/MIN 스위치) */}
          {(activeTab === 'all' || activeTab === 'levels') && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 md:p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-[var(--accent)] text-sm md:text-base whitespace-nowrap border-b border-[var(--panel-border)] pb-2">⚡ 클래스 레벨 관리</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {dbClasses.map((cls: any) => {
                  const currentLevel = levels[cls.name] || 1;
                  const isMax = currentLevel === 65;
                  return (
                    <div key={cls.name} className={`flex items-center justify-between p-2 rounded-lg border transition min-w-0 ${isMax ? 'border-[var(--accent)] bg-[var(--accent-soft)]/20' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'}`}>
                      {/* 직업명 & 아이콘 */}
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-sm shrink-0">{cls.icon || "🛡️"}</span>
                        <span className={`text-xs font-bold truncate ${isMax ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>{cls.name}</span>
                      </div>

                      {/* 레벨 수치 & 컨트롤 버튼 그룹 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-black font-mono text-[var(--accent)] mr-0.5 whitespace-nowrap">Lv.{currentLevel}</span>
                        
                        <button onClick={() => updateClassLevel(cls.name, -10)} className="px-1 py-0.5 text-[9px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">-10</button>
                        <button onClick={() => updateClassLevel(cls.name, -1)} className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">-1</button>
                        
                        {/* MAX / MIN 토글 버튼 */}
                        {isMax ? (
                          <button onClick={() => setMinLevel(cls.name)} className="px-1.5 py-0.5 text-[9px] font-black rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition whitespace-nowrap">MIN</button>
                        ) : (
                          <button onClick={() => setMaxLevel(cls.name)} className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition whitespace-nowrap">MAX</button>
                        )}

                        <button onClick={() => updateClassLevel(cls.name, 1)} className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">+1</button>
                        <button onClick={() => updateClassLevel(cls.name, 10)} className="px-1 py-0.5 text-[9px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">+10</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}