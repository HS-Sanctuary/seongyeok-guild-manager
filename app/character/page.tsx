"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

export default function CharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [dbContents, setDbContents] = useState<any[]>([]);
  const [dbTrades, setDbTrades] = useState<any[]>([]); 

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

  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(true);

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

    const fetchMasterData = async () => {
      const [clsRes, taskRes, contRes, tradeRes] = await Promise.all([
        supabase.from('nexus_classes').select('*').eq('is_active', true).order('id'),
        supabase.from('nexus_tasks').select('*').eq('is_active', true).order('id'),
        supabase.from('nexus_contents').select('*').eq('is_active', true).order('id'),
        supabase.from('nexus_trades').select('*').order('id')
      ]);
      
      setDbClasses(clsRes.data || []);
      setDbTasks(taskRes.data || []);
      setDbContents(contRes.data || []);
      setDbTrades(tradeRes.data || []);
      
      await fetchAccountData(parsedUser.nickname);
      await fetchUserCharacters(parsedUser.nickname, contRes.data || []);
    };
    fetchMasterData();
  }, [router]);

  const fetchAccountData = async (loginUserNick: string) => {
    try {
      const { data } = await supabase
        .from('characters')
        .select('contribution')
        .eq('owner', loginUserNick)
        .limit(1);
      if (data && data.length > 0) {
        setAccountContribution(data[0].contribution ?? "");
      }
    } catch (e) {}
  };

  const fetchUserCharacters = async (loginUserNick: string, contentsList: any[]) => {
    try {
      const { data } = await supabase
        .from('characters')
        .select('nickname, sort_order, owner')
        .or(`owner.eq.${loginUserNick},nickname.eq.${loginUserNick}`)
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setMyCharacters(data);
        
        // URL에서 클릭한 캐릭터 닉네임 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const targetChar = urlParams.get('char');
        
        let target = data[0].nickname; // 기본값: 첫 번째 캐릭터
        
        if (targetChar && data.some((d: any) => d.nickname === targetChar)) {
          target = targetChar; // 클릭한 캐릭터가 내 캐릭터 목록에 있으면 해당 캐릭터 로드
        } else if (data.some((d: any) => d.nickname === loginUserNick)) {
          target = loginUserNick; // 없으면 대표 닉네임 로드
        }
        
        loadCharacterData(target, contentsList);
      } else {
        const initialChar = { nickname: loginUserNick, sort_order: 0, owner: loginUserNick };
        setMyCharacters([initialChar]);
        loadCharacterData(loginUserNick, contentsList);
      }
    } catch (e) {
      setMyCharacters([{ nickname: loginUserNick, sort_order: 0 }]);
      loadCharacterData(loginUserNick, contentsList);
    }
  };

  const loadCharacterData = async (charName: string, contentsList = dbContents) => {
    try {
      const { data } = await supabase.from('characters').select('*').eq('nickname', charName).single();
      if (data) {
        setProfile({
          nickname: data.nickname, job: data.job || "전사",
          combatPower: data.combat_power || "", magicResistance: data.magic_resistance || "",
          lifeEnergy: data.life_energy || "", charm: data.charm || "", 
          intro: data.intro || "",
          isMain: data.is_main || false
        });
        if (data.contribution !== undefined && data.contribution !== null) {
          setAccountContribution(data.contribution);
        }
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
    } catch (e) {}
  };

  const saveProgress = async () => {
    if (!profile.nickname.trim()) {
      alert("캐릭터 닉네임을 입력해주세요!");
      return;
    }
    try {
      if (profile.isMain) {
        await supabase.from('characters')
          .update({ is_main: false })
          .eq('owner', user.nickname)
          .neq('nickname', profile.nickname);
      }

      const existingIndex = myCharacters.findIndex((c: any) => c.nickname === profile.nickname);
      const currentSortOrder = existingIndex !== -1 ? (myCharacters[existingIndex].sort_order ?? myCharacters.length) : myCharacters.length;

      const payload = {
        nickname: profile.nickname, 
        owner: user.nickname, 
        sort_order: currentSortOrder,
        job: profile.job,
        combat_power: Number(profile.combatPower) || 0, 
        magic_resistance: Number(profile.magicResistance) || 0,
        life_energy: Number(profile.lifeEnergy) || 0, 
        charm: Number(profile.charm) || 0, 
        contribution: Number(accountContribution) || 0,
        intro: profile.intro,
        is_main: profile.isMain, 
        levels: levels, 
        daily_checks: dailyChecks,
        weekly_checks: { normal: weeklyChecks, repeat: repeatChecks },
        raid_checks: [...abyssChecks, ...raidChecks],
        trade_checks: tradeProgress,
        updated_at: new Date()
      };
      
      await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      
      await supabase.from('characters')
        .update({ contribution: Number(accountContribution) || 0 })
        .eq('owner', user.nickname);

      if (existingIndex === -1) {
        setMyCharacters((prev: any[]) => [...prev, { nickname: profile.nickname, sort_order: currentSortOrder }]);
      }

      setSaved(true); 
      setTimeout(() => setSaved(false), 1500);
    } catch (error) { 
      alert("저장 실패"); 
    }
  };

  const switchCharacter = async (targetName: string) => { 
    await saveProgress(); 
    loadCharacterData(targetName, dbContents); 
    // 주소창의 파라미터도 업데이트 해주는 센스 (선택 사항)
    window.history.replaceState(null, '', `?char=${encodeURIComponent(targetName)}`);
  };

  const handleCreateNewCharacter = async () => {
    const newName = prompt("생성할 부캐릭터(또는 캐릭터)의 닉네임을 입력하세요:");
    if (!newName || !newName.trim()) return;
    
    const trimmedName = newName.trim();
    if (myCharacters.some((c: any) => c.nickname === trimmedName)) {
      alert("이미 존재하는 캐릭터 이름입니다.");
      return;
    }
    
    const newSortOrder = myCharacters.length;
    const newCharObj = { nickname: trimmedName, sort_order: newSortOrder, owner: user.nickname, contribution: Number(accountContribution) || 0 };

    await supabase.from('characters').upsert([newCharObj], { onConflict: 'nickname' });

    setMyCharacters((prev: any[]) => [...prev, newCharObj]);
    setProfile({ ...defaultProfile, nickname: trimmedName });
    setLevels({});
    setDailyChecks([]);
    setWeeklyChecks([]);
    setRepeatChecks({});
    setAbyssChecks([]);
    setRaidChecks([]);
    setTradeProgress({});
  };

  const handleMoveOrder = async (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= myCharacters.length) return;

    const updated = [...myCharacters];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((item: any, idx: number) => ({ ...item, sort_order: idx }));
    setMyCharacters(reordered);

    for (const item of reordered) {
      await supabase.from('characters').update({ sort_order: item.sort_order }).eq('nickname', item.nickname);
    }
  };

  const handleDeleteCharacter = async () => {
    if (myCharacters.length <= 1) {
      alert("최소 1개의 캐릭터는 유지되어야 합니다.");
      return;
    }
    if (!confirm(`정말로 [${profile.nickname}] 캐릭터를 삭제하시겠습니까?`)) return;

    await supabase.from('characters').delete().eq('nickname', profile.nickname);

    const remaining = myCharacters.filter((c: any) => c.nickname !== profile.nickname);
    setMyCharacters(remaining);
    loadCharacterData(remaining[0].nickname, dbContents);
  };

  const handleSyncNexonAPI = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setAbyssChecks(abyssList.map((c: any) => c.id)); 
      setRaidChecks(raidList.slice(0, 1).map((c: any) => c.id));
      setIsSyncing(false); 
      alert(`[API 동기화 완료] 📡`);
    }, 1500);
  };

  const updateProfile = (field: string, value: any) => setProfile(prev => ({ ...prev, [field]: value }));
  const setMaxLevel = (cls: string) => setLevels(prev => ({ ...prev, [cls]: 65 }));

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

  const handleToggleAll = (type: string, isCheckAll: boolean) => {
    if (type === 'daily') {
      const normals = visibleDailyList.filter((t: any) => !t.type.startsWith('repeat')).map((t: any) => t.id);
      setDailyChecks(isCheckAll ? normals : []);
      setRepeatChecks(prev => { const next = { ...prev }; visibleDailyList.filter((t: any) => t.type.startsWith('repeat')).forEach((t: any) => { next[t.id] = isCheckAll ? Array(t.max_count).fill(true) : []; }); return next; });
    }
    if (type === 'weekly') {
      const normals = visibleWeeklyList.filter((t: any) => !t.type.startsWith('repeat')).map((t: any) => t.id);
      setWeeklyChecks(isCheckAll ? normals : []);
      setRepeatChecks(prev => { const next = { ...prev }; visibleWeeklyList.filter((t: any) => t.type.startsWith('repeat')).forEach((t: any) => { next[t.id] = isCheckAll ? Array(t.max_count).fill(true) : []; }); return next; });
    }
    if (type === 'abyss') setAbyssChecks(isCheckAll ? abyssList.map((t: any) => t.id) : []);
    if (type === 'raid') setRaidChecks(isCheckAll ? raidList.map((t: any) => t.id) : []);
  };

  const renderTask = (item: any, type: 'daily' | 'weekly' | 'abyss' | 'raid') => {
    if (item.type?.startsWith('repeat')) {
      const currentCount = (repeatChecks[item.id] || []).filter(Boolean).length;
      const isMax = currentCount === item.max_count;
      const badgeText = item.type === 'repeat_daily' ? '일간' : item.type === 'repeat_weekend' ? '주말' : '주간';
      
      return (
        <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 ${isMax ? "bg-purple-900/10 border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]" : "bg-[#1c1c1e] border-zinc-800"}`}>
          <div className="flex flex-col">
            <span className={`text-[9px] w-fit px-1 rounded mb-0.5 ${isMax ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-500'}`}>{badgeText}</span>
            <span className={`text-sm font-medium ${isMax ? "text-purple-300" : "text-zinc-300"}`}>{item.name}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#121212] px-1.5 py-1 rounded border border-zinc-700">
            <span className={`text-xs font-bold min-w-[36px] text-center whitespace-nowrap ${isMax ? "text-purple-400" : "text-zinc-400"}`}>{currentCount} <span className="text-zinc-600">/</span> {item.max_count}</span>
            <div className="flex gap-1 border-l border-zinc-700 pl-1.5">
              <button onClick={() => updateRepeatCount(item.id, -1, item.max_count)} className="w-6 h-6 flex justify-center items-center rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">-</button>
              <button onClick={() => updateRepeatCount(item.id, 1, item.max_count)} className="w-6 h-6 flex justify-center items-center rounded bg-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-700">+</button>
            </div>
          </div>
        </div>
      );
    } 
    
    let checks: number[] = [];
    let setChecks: any;
    
    if (type === 'daily') { checks = dailyChecks; setChecks = setDailyChecks; }
    else if (type === 'weekly') { checks = weeklyChecks; setChecks = setWeeklyChecks; }
    else if (type === 'abyss') { checks = abyssChecks; setChecks = setAbyssChecks; }
    else if (type === 'raid') { checks = raidChecks; setChecks = setRaidChecks; }

    const isChecked = checks.includes(item.id);
    
    const getColorTheme = () => {
      if (!isChecked) return { wrapper: "bg-[#1c1c1e] border-zinc-800 hover:border-zinc-600", text: "text-zinc-300", box: "bg-zinc-800 border-zinc-600" };
      if (type === 'daily') return { wrapper: "bg-amber-900/20 border-amber-500/50", text: "text-amber-400", box: "bg-amber-500 border-amber-500 text-white scale-110" };
      if (type === 'weekly') return { wrapper: "bg-blue-900/20 border-blue-500/50", text: "text-blue-400", box: "bg-blue-500 border-blue-500 text-white scale-110" };
      if (type === 'abyss') return { wrapper: "bg-emerald-900/20 border-emerald-500/50", text: "text-emerald-400", box: "bg-emerald-500 border-emerald-500 text-white scale-110" };
      if (type === 'raid') return { wrapper: "bg-indigo-900/20 border-indigo-500/50", text: "text-indigo-400", box: "bg-indigo-500 border-indigo-500 text-white scale-110" };
      return { wrapper: "", text: "", box: "" };
    };

    const theme = getColorTheme();

    return (
      <div key={item.id} onClick={() => setChecks(isChecked ? checks.filter((i: number) => i !== item.id) : [...checks, item.id])}
           className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all duration-300 ${theme.wrapper}`}>
        <span className={`text-sm font-medium transition-colors ${theme.text}`}>{item.name}</span>
        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${theme.box}`}>
          {isChecked && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
      </div>
    );
  };

  if (!mounted || !user) return null;

  const bhDailyDone = blackHoleDaily && dailyChecks.includes(blackHoleDaily.id);
  const bhWeeklyCount = blackHoleWeekly ? (repeatChecks[blackHoleWeekly.id] || []).filter(Boolean).length : 0;
  const bhTotalCount = (bhDailyDone ? 1 : 0) + bhWeeklyCount;
  const bhMaxCount = (blackHoleDaily ? 1 : 0) + (blackHoleWeekly?.max_count || 0);

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">

        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-3 px-6 shadow-xl mb-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788] shadow-[0_0_15px_#e6c788]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#e6c788] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col items-start min-w-[200px]">
              <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md leading-none">CHRONOS</h1>
              <span className="text-[#e6c788] text-[13px] font-bold tracking-wide mt-1.5 leading-none">크 로 노 스 : 캐 릭 터 관 리</span>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-700/50 px-4 py-2 rounded-lg w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">⏳</span>
              <div className="flex flex-col text-[11px] md:text-[12px] font-bold leading-tight w-full">
                <span className="text-zinc-300 w-full truncate md:whitespace-normal">시간과 기록의 신, 크로노스. 이곳은 성역을 거쳐간 당신의 발자취와 땀방울이 기록되는 공간입니다.</span>
                <span className="text-[#e6c788] mt-0.5">입력한 능력치는 AGORA(아고라) 명예의 전당으로 즉시 연결됩니다.</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* 상단 프로필 */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 bg-[#121212] rounded-xl border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-[#e6c788] transition-colors shrink-0">
              <span className="text-5xl">{dbClasses.find((c: any) => c.name === profile.job)?.icon || "👤"}</span>
            </div>
            <div className="flex-1 w-full space-y-5">
              <div className="flex justify-between items-end border-b border-zinc-700/50 pb-4">
                <div className="flex gap-4 items-end flex-wrap w-full">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">닉네임</label>
                    <input value={profile.nickname} onChange={(e) => updateProfile("nickname", e.target.value)} className="bg-transparent text-2xl font-black text-white border-b border-transparent focus:border-[#e6c788] outline-none w-36" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">주 클래스</label>
                    <select value={profile.job} onChange={(e) => updateProfile("job", e.target.value)} className="bg-[#121212] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-[#e6c788] outline-none">
                      {dbClasses.map((cls: any) => <option key={cls.name} value={cls.name}>{cls.name}</option>)}
                    </select>
                  </div>

                  {/* 원래 위치(주 클래스 우측)에 세로 배치형 캐릭터 카드 리스트 적용 */}
                  <div className="ml-2 pl-4 border-l border-zinc-700/50 hidden md:flex items-center gap-2 flex-wrap max-w-[650px]">
                    <div className="flex flex-wrap gap-2 items-center">
                      {myCharacters.map((char: any, idx: number) => (
                        <div key={char.nickname} className={`flex flex-col items-center border text-[12px] font-medium px-3 py-1.5 rounded-lg transition ${char.nickname === profile.nickname ? 'bg-[#e6c788]/20 text-[#e6c788] border-[#e6c788] font-bold shadow-md' : 'bg-[#1c1c1e] border-zinc-700 text-zinc-300'}`}>
                          {/* 닉네임 (클릭시 전환) */}
                          <button onClick={() => switchCharacter(char.nickname)} className="truncate max-w-[90px] text-center">{char.nickname}</button>
                          {/* 화살표 버튼 (닉네임 아래 세로 배치) */}
                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-zinc-700/50 w-full justify-center">
                            {idx > 0 && <button onClick={() => handleMoveOrder(idx, -1)} className="text-[10px] text-zinc-400 hover:text-white px-1">◀</button>}
                            {idx < myCharacters.length - 1 && <button onClick={() => handleMoveOrder(idx, 1)} className="text-[10px] text-zinc-400 hover:text-white px-1">▶</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleCreateNewCharacter} className="bg-zinc-800 hover:bg-zinc-700 text-[#e6c788] border border-dashed border-[#e6c788]/50 text-[11px] font-bold px-3 py-2 rounded-lg transition h-fit">+ 캐릭터 추가</button>
                  </div>
                </div>

                <div className="flex gap-2 items-center shrink-0">
                  <button onClick={handleDeleteCharacter} className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 text-xs font-bold px-3 py-2 rounded-lg transition">🗑️ 삭제</button>
                  <div className="text-right bg-[#1c1c1e] px-4 py-2 rounded-lg border border-yellow-600/30">
                    <p className="text-[10px] text-[#e6c788] font-bold tracking-widest">누적 레벨</p>
                    <p className="text-3xl font-black text-white leading-none mt-1">{totalLevel} <span className="text-sm font-normal text-zinc-500">LV</span></p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-red-400 mb-1 block">⚔️ 전투력 (KRATOS)</label><input type="number" value={profile.combatPower} onChange={e => updateProfile("combatPower", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-purple-400 mb-1 block">🔮 마도저항</label><input type="number" value={profile.magicResistance} onChange={e => updateProfile("magicResistance", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-emerald-400 mb-1 block">🌿 생활력 (TECHNĒ)</label><input type="number" value={profile.lifeEnergy} onChange={e => updateProfile("lifeEnergy", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-pink-400 mb-1 block">✨ 매력 (HARMONIA)</label><input type="number" value={profile.charm} onChange={e => updateProfile("charm", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-amber-500 mb-1 block">🛡️ 누적 길드 공헌도 (PIETAS)</label>
                  <input type="number" value={accountContribution} onChange={e => setAccountContribution(e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
              </div>
              
              <div className="flex flex-col xl:flex-row gap-3">
                <input value={profile.intro} onChange={(e) => updateProfile("intro", e.target.value)} placeholder="길드원에게 보일 자기소개나 인삿말을 적어주세요!" className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-[#e6c788] outline-none" />
                
                <div className="flex gap-3">
                  <label className="flex items-center justify-center gap-2 bg-[#1c1c1e] border border-zinc-700 px-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition min-w-[140px]">
                    <input type="checkbox" checked={profile.isMain} onChange={e => updateProfile("isMain", e.target.checked)} className="accent-[#e6c788] w-4 h-4" />
                    <span className="text-sm font-bold text-zinc-300">대표 캐릭터</span>
                  </label>
                  <button onClick={handleSyncNexonAPI} className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 font-bold px-4 rounded-lg text-sm flex items-center gap-2 whitespace-nowrap">🔄 API 갱신</button>
                  <button onClick={saveProgress} className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 rounded-lg text-sm transition-colors whitespace-nowrap min-w-[120px]">{saved ? "저장 완료!" : "서버에 저장"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 검은 구멍 탐험 상황판 */}
        {blackHoleDaily && blackHoleWeekly && (
          <div className="bg-[#1f1a29] rounded-xl border border-purple-500/40 p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-full bg-purple-600/10 blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-end relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#121212] rounded-full border border-purple-500 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(168,85,247,0.3)]">🕳️</div>
                <div>
                  <h3 className="text-lg font-black text-purple-300 tracking-tight">검은 구멍 탐험 상황판</h3>
                  <p className="text-xs text-purple-200/60 mt-0.5">매일 기본 1회를 우선 차감하며, 부족 시 초과 탐험(최대 7회)이 차감됩니다.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-400/80 font-bold tracking-widest block mb-1">총 클리어 횟수</span>
                <div className="text-white font-black text-2xl leading-none">{bhTotalCount} <span className="text-sm text-zinc-500 font-normal">/ {bhMaxCount}</span></div>
              </div>
            </div>
            <div className="w-full bg-[#121212] h-2.5 rounded-full overflow-hidden border border-purple-900/50 relative z-10">
              <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-500" style={{ width: `${(bhTotalCount / bhMaxCount) * 100}%` }}></div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 pt-2 relative z-10">
              <div onClick={() => setDailyChecks(bhDailyDone ? dailyChecks.filter(i => i !== blackHoleDaily.id) : [...dailyChecks, blackHoleDaily.id])} className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${bhDailyDone ? "bg-purple-900/40 border-purple-500/60" : "bg-[#121212] border-zinc-700 hover:border-purple-500/40"}`}>
                <span className={`text-sm font-bold ${bhDailyDone ? "text-purple-300" : "text-zinc-400"}`}>오늘의 기본 탐험 (1회)</span>
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${bhDailyDone ? "bg-purple-500 text-white" : "bg-zinc-800 border border-zinc-600"}`}>
                  {bhDailyDone && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-zinc-700">
                <span className="text-sm font-bold text-zinc-400">이번주 초과 탐험 ({blackHoleWeekly.max_count}회)</span>
                <div className="flex gap-1 bg-[#1c1c1e] p-1 rounded border border-zinc-800">
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.id, -1, blackHoleWeekly.max_count)} className="w-7 h-7 flex justify-center items-center rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">-</button>
                  <span className="w-8 text-center text-sm font-black text-purple-400 flex items-center justify-center">{bhWeeklyCount}</span>
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.id, 1, blackHoleWeekly.max_count)} className="w-7 h-7 flex justify-center items-center rounded bg-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-700">+</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3"><h3 className="font-bold text-amber-500 text-base">☀️ 일일 컨텐츠</h3><div className="flex items-center gap-2"><button onClick={() => handleToggleAll('daily', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button><button onClick={() => handleToggleAll('daily', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button></div></div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">{visibleDailyList.map((item: any) => renderTask(item, 'daily'))}</div>
          </div>
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3"><h3 className="font-bold text-blue-400 text-base">🌙 주간 컨텐츠</h3><div className="flex items-center gap-2"><button onClick={() => handleToggleAll('weekly', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button><button onClick={() => handleToggleAll('weekly', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button></div></div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">{visibleWeeklyList.map((item: any) => renderTask(item, 'weekly'))}</div>
          </div>
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3"><h3 className="font-bold text-emerald-400 text-base">🌌 어비스 관리</h3><div className="flex items-center gap-2"><button onClick={() => handleToggleAll('abyss', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button><button onClick={() => handleToggleAll('abyss', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button></div></div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">{abyssList.map((item: any) => renderTask(item, 'abyss'))}</div>
          </div>
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3"><h3 className="font-bold text-indigo-400 text-base">🐉 레이드 관리</h3><div className="flex items-center gap-2"><button onClick={() => handleToggleAll('raid', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button><button onClick={() => handleToggleAll('raid', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button></div></div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">{raidList.map((item: any) => renderTask(item, 'raid'))}</div>
          </div>
        </div>

        {/* 하단 아코디언 메뉴 */}
        <div className="space-y-4">
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
            <button onClick={() => setIsTradeOpen(!isTradeOpen)} className="w-full flex items-center justify-between p-5 hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">⚖️ 캐릭터 교환/구매 진행도</h3>
              <span className="text-zinc-500">{isTradeOpen ? "▲" : "▼"}</span>
            </button>
            {isTradeOpen && (
              <div className="p-0 sm:p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#252528] text-zinc-400 border-b border-zinc-700">
                      <tr>
                        <th className="p-3 font-bold text-xs w-[15%]">맵 / NPC</th>
                        <th className="p-3 font-bold text-xs w-[25%]">획득 보상</th>
                        <th className="p-3 font-bold text-xs w-[25%]">소모 재화</th>
                        <th className="p-3 font-bold text-xs text-center w-[15%]">초기화/범위</th>
                        <th className="p-3 font-bold text-xs text-center w-[20%]">목표 달성 진척도</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {dbTrades.map((trade: any) => {
                        const currentVal = tradeProgress[trade.id] || 0;
                        const isMax = currentVal >= trade.limit;
                        return (
                          <tr key={trade.id} className={`transition-colors ${isMax ? 'bg-[#252528]/50' : 'hover:bg-[#202023]'}`}>
                            <td className="p-3">
                              <div className={`font-bold ${isMax ? 'text-zinc-500' : 'text-zinc-300'}`}>{trade.map || "-"}</div>
                              <div className="text-[10px] text-zinc-500">{trade.npc || "-"}</div>
                            </td>
                            <td className="p-3">
                              <div className={`font-bold ${isMax ? 'text-emerald-900' : 'text-emerald-400'}`}>{trade.reward}</div>
                              <div className="text-[10px] text-zinc-500">{trade.reward_cnt}개 획득</div>
                            </td>
                            <td className="p-3">
                              <div className={`font-bold ${isMax ? 'text-amber-900' : 'text-amber-400'}`}>{trade.cost}</div>
                              <div className="text-[10px] text-zinc-500">{trade.cost_cnt}개 소모</div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col gap-1 items-center">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isMax ? 'bg-zinc-800 text-zinc-600' : trade.reset_type === '일간' ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'}`}>{trade.reset_type}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isMax ? 'bg-zinc-800 text-zinc-600' : trade.scope === '캐릭당' ? 'bg-zinc-800 text-zinc-300' : 'bg-rose-900/30 text-rose-400'}`}>{trade.scope}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-3 bg-[#121212] px-2 py-1.5 rounded-lg border border-zinc-700/50 mx-auto w-fit">
                                <span className={`text-xs font-bold w-8 text-center tracking-wider ${isMax ? "text-emerald-500" : "text-zinc-300"}`}>{currentVal} <span className="text-zinc-600 font-normal">/</span> {trade.limit}</span>
                                <div className="flex gap-1 border-l border-zinc-700 pl-2">
                                  <button onClick={() => updateTradeProgress(trade.id, -1, trade.limit)} className="w-7 h-7 flex justify-center items-center rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors">-</button>
                                  <button onClick={() => updateTradeProgress(trade.id, 1, trade.limit)} className={`w-7 h-7 flex justify-center items-center rounded transition-colors ${isMax ? 'bg-emerald-900/20 text-emerald-500/50 cursor-not-allowed' : 'bg-[#e6c788]/20 text-[#e6c788] hover:bg-[#e6c788] hover:text-black'}`}>+</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {dbTrades.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-zinc-500">등록된 카탈로그가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsLevelOpen(!isLevelOpen)} className="w-full flex items-center justify-between p-5 hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">⚡ 클래스 레벨관리</h3>
              <span className="text-zinc-500">{isLevelOpen ? "▲" : "▼"}</span>
            </button>
            {isLevelOpen && (
              <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {dbClasses.map((cls: any) => {
                    const currentLevel = levels[cls.name] || 1;
                    const isMax = currentLevel === 65;
                    return (
                      <div key={cls.name} className={`relative flex flex-col items-center p-4 rounded-xl border transition-all ${isMax ? 'border-purple-500/50 bg-purple-900/10' : 'border-zinc-700/50 bg-[#121212]'}`}>
                        {!isMax ? <button onClick={() => setMaxLevel(cls.name)} className="absolute top-2 right-2 text-[9px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-600">MAX</button> : <span className="absolute top-2 right-2 text-[10px] font-black text-purple-400">마스터</span>}
                        <span className="text-2xl mb-2">{cls.icon || "🛡️"}</span>
                        <span className={`text-xs font-bold mb-1 ${isMax ? 'text-purple-300' : 'text-zinc-300'}`}>{cls.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 font-bold">Lv.</span>
                          <input type="number" min={1} max={65} value={currentLevel} onChange={(e) => {
                            let val = Number(e.target.value); if (val > 65) val = 65;
                            setLevels(prev => ({...prev, [cls.name]: val}));
                          }} className="w-8 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700 focus:border-yellow-500 [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}