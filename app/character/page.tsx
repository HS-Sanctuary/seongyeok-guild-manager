"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

interface TradeItem { id: number; map: string; npc: string; receiveItem: string; receiveCount: number; giveItem: string; giveCount: number; limit: number; reset: string; scope: string; }
interface PurchaseItem { id: number; map: string; npc: string; item: string; limit: number; currency: string; currencyCount: number; reset: string; scope: string; }

export default function CharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [dbContents, setDbContents] = useState<any[]>([]);

  const defaultProfile = { nickname: "한설", job: "전사", combatPower: "", magicResistance: "", lifeEnergy: "", charm: "", intro: "" };
  
  const [profile, setProfile] = useState(defaultProfile);
  const [levels, setLevels] = useState<Record<string, number>>({});
  
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<string[]>([]);
  // 🟢 변수명을 범용적인 repeatChecks로 변경 (일간, 주간 반복 모두 수용)
  const [repeatChecks, setRepeatChecks] = useState<Record<string, boolean[]>>({});
  
  const [abyssChecks, setAbyssChecks] = useState<string[]>([]);
  const [raidChecks, setRaidChecks] = useState<string[]>([]);
  
  const [isLevelOpen, setIsLevelOpen] = useState(true);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  // 🟢 데이터 필터링 로직 수정 (일간 반복은 일일에, 주간/주말 반복은 주간에!)
  const abyssList = dbContents.filter(c => c.type === 'abyss');
  const raidList = dbContents.filter(c => c.type === 'raid');

  const blackHoleDaily = dbTasks.find(t => (t.type === 'daily' || t.type === 'repeat_daily') && t.name.includes("검은 구멍"));
  const blackHoleWeekly = dbTasks.find(t => (t.type === 'weekly' || t.type === 'repeat_weekly') && t.name.includes("검은 구멍"));
  
  // 검은 구멍을 제외하고, 소속(일일/주간)에 맞게 정확히 분류
  const visibleDailyList = dbTasks.filter(t => (t.type === 'daily' || t.type === 'repeat_daily') && !t.name.includes("검은 구멍"));
  const visibleWeeklyList = dbTasks.filter(t => (t.type === 'weekly' || t.type === 'repeat_weekly' || t.type === 'repeat_weekend') && !t.name.includes("검은 구멍"));

  const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const fetchMasterData = async () => {
      const [clsRes, taskRes, contRes] = await Promise.all([
        supabase.from('nexus_classes').select('*').eq('is_active', true).order('id'),
        supabase.from('nexus_tasks').select('*').eq('is_active', true).order('id'),
        supabase.from('nexus_contents').select('*').eq('is_active', true).order('id')
      ]);
      if (clsRes.data) setDbClasses(clsRes.data);
      if (taskRes.data) setDbTasks(taskRes.data);
      if (contRes.data) setDbContents(contRes.data);
      loadCharacterData(parsedUser.nickname || "한설");
    };
    fetchMasterData();
  }, [router]);

  const loadCharacterData = async (charName: string) => {
    try {
      const { data } = await supabase.from('characters').select('*').eq('nickname', charName).single();
      if (data) {
        setProfile({
          nickname: data.nickname, job: data.job || "전사",
          combatPower: data.combat_power || "", magicResistance: data.magic_resistance || "",
          lifeEnergy: data.life_energy || "", charm: data.charm || "", intro: data.intro || ""
        });
        setLevels(data.levels || {});
        setDailyChecks(data.daily_checks || []);
        
        if (data.weekly_checks && !Array.isArray(data.weekly_checks)) {
          setWeeklyChecks(data.weekly_checks.normal || []);
          setRepeatChecks(data.weekly_checks.repeat || {});
        } else {
          setWeeklyChecks(Array.isArray(data.weekly_checks) ? data.weekly_checks : []);
          setRepeatChecks({});
        }
        
        const combinedRaids = data.raid_checks || [];
        setAbyssChecks(combinedRaids.filter((item: string) => item.includes('어비스')));
        setRaidChecks(combinedRaids.filter((item: string) => item.includes('레이드')));
      } else {
        setProfile({ ...defaultProfile, nickname: charName });
        setLevels({}); setDailyChecks([]); setWeeklyChecks([]); setRepeatChecks({});
        setAbyssChecks([]); setRaidChecks([]);
      }
    } catch (e) {}
  };

  const saveProgress = async () => {
    try {
      const payload = {
        nickname: profile.nickname, job: profile.job,
        combat_power: profile.combatPower, magic_resistance: profile.magicResistance,
        life_energy: profile.lifeEnergy, charm: profile.charm, intro: profile.intro,
        levels: levels, daily_checks: dailyChecks,
        // DB 스키마 유지를 위해 반복체크는 weekly_checks 내부의 repeat 객체에 통합 저장
        weekly_checks: { normal: weeklyChecks, repeat: repeatChecks },
        raid_checks: [...abyssChecks, ...raidChecks],
        updated_at: new Date()
      };
      await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (error) { alert("저장 실패"); }
  };

  const switchCharacter = async (targetName: string) => { await saveProgress(); loadCharacterData(targetName); };

  const handleSyncNexonAPI = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setAbyssChecks(abyssList.map(c => c.name)); setRaidChecks(raidList.slice(0, 1).map(c => c.name));
      setIsSyncing(false); alert(`[API 동기화 완료] 📡`);
    }, 1500);
  };

  const updateProfile = (field: string, value: string) => setProfile(prev => ({ ...prev, [field]: value }));
  const setMaxLevel = (cls: string) => setLevels(prev => ({ ...prev, [cls]: 65 }));

  const updateRepeatCount = (name: string, delta: number, max: number) => {
    setRepeatChecks(prev => {
      const currentArr = prev[name] || Array(max).fill(false);
      let newCount = currentArr.filter(Boolean).length + delta;
      if (newCount < 0) newCount = 0; if (newCount > max) newCount = max;
      return { ...prev, [name]: Array(max).fill(false).map((_, i) => i < newCount) };
    });
  };

  // 🟢 전체 완료/해제 로직 완벽 수정 (일반 체크박스와 반복 카운터를 모두 제어)
  const handleToggleAll = (type: string, isCheckAll: boolean) => {
    if (type === 'daily') {
      const normals = visibleDailyList.filter(t => !t.type.startsWith('repeat')).map(t => t.name);
      setDailyChecks(isCheckAll ? normals : []);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleDailyList.filter(t => t.type.startsWith('repeat')).forEach(t => {
          next[t.name] = isCheckAll ? Array(t.max_count).fill(true) : [];
        });
        return next;
      });
    }
    if (type === 'weekly') {
      const normals = visibleWeeklyList.filter(t => !t.type.startsWith('repeat')).map(t => t.name);
      setWeeklyChecks(isCheckAll ? normals : []);
      setRepeatChecks(prev => {
        const next = { ...prev };
        visibleWeeklyList.filter(t => t.type.startsWith('repeat')).forEach(t => {
          next[t.name] = isCheckAll ? Array(t.max_count).fill(true) : [];
        });
        return next;
      });
    }
    if (type === 'abyss') setAbyssChecks(isCheckAll ? abyssList.map(t => t.name) : []);
    if (type === 'raid') setRaidChecks(isCheckAll ? raidList.map(t => t.name) : []);
  };

  // 공통 반복 렌더링 컴포넌트
  const renderTask = (item: any, isDaily: boolean) => {
    if (item.type.startsWith('repeat')) {
      const currentCount = (repeatChecks[item.name] || []).filter(Boolean).length;
      const isMax = currentCount === item.max_count;
      const badgeText = item.type === 'repeat_daily' ? '일간' : item.type === 'repeat_weekend' ? '주말' : '주간';
      
      return (
        <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 ${isMax ? "bg-purple-900/10 border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]" : "bg-[#1c1c1e] border-zinc-800"}`}>
          <div className="flex flex-col">
            <span className={`text-[9px] w-fit px-1 rounded mb-0.5 ${isMax ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-500'}`}>{badgeText}</span>
            <span className={`text-sm font-medium ${isMax ? "text-purple-300" : "text-zinc-300"}`}>{item.name}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#121212] px-1.5 py-1 rounded border border-zinc-700">
            {/* 🟢 width를 min-w-[32px]로 주고 줄바꿈 방지(whitespace-nowrap) 적용! */}
            <span className={`text-xs font-bold min-w-[36px] text-center whitespace-nowrap ${isMax ? "text-purple-400" : "text-zinc-400"}`}>
              {currentCount} <span className="text-zinc-600">/</span> {item.max_count}
            </span>
            <div className="flex gap-1 border-l border-zinc-700 pl-1.5">
              <button onClick={() => updateRepeatCount(item.name, -1, item.max_count)} className="w-6 h-6 flex justify-center items-center rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">-</button>
              <button onClick={() => updateRepeatCount(item.name, 1, item.max_count)} className="w-6 h-6 flex justify-center items-center rounded bg-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-700">+</button>
            </div>
          </div>
        </div>
      );
    } else {
      // 일반 체크박스 렌더링
      const checks = isDaily ? dailyChecks : weeklyChecks;
      const setChecks = isDaily ? setDailyChecks : setWeeklyChecks;
      const isChecked = checks.includes(item.name);
      const colorTheme = isDaily ? "amber" : "blue";
      
      return (
        <div key={item.id} onClick={() => setChecks(isChecked ? checks.filter(i => i !== item.name) : [...checks, item.name])}
             className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all duration-300 ${isChecked ? `bg-${colorTheme}-900/20 border-${colorTheme}-500/50` : "bg-[#1c1c1e] border-zinc-800 hover:border-zinc-600"}`}>
          <span className={`text-sm font-medium transition-colors ${isChecked ? `text-${colorTheme}-400` : "text-zinc-300"}`}>{item.name}</span>
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isChecked ? `bg-${colorTheme}-500 text-white scale-110` : "bg-zinc-800 border border-zinc-600"}`}>
            {isChecked && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      );
    }
  };

  if (!mounted || !user) return null;

  // 검은 구멍 총 진척도 계산
  const bhDailyDone = blackHoleDaily && dailyChecks.includes(blackHoleDaily.name);
  const bhWeeklyCount = blackHoleWeekly ? (repeatChecks[blackHoleWeekly.name] || []).filter(Boolean).length : 0;
  const bhTotalCount = (bhDailyDone ? 1 : 0) + bhWeeklyCount;
  const bhMaxCount = (blackHoleDaily ? 1 : 0) + (blackHoleWeekly?.max_count || 0);

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 1. 프로필 영역 */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 bg-[#121212] rounded-xl border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-[#e6c788] transition-colors">
              <span className="text-5xl">{dbClasses.find(c => c.name === profile.job)?.icon || "👤"}</span>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div className="flex justify-between items-end border-b border-zinc-700/50 pb-4">
                <div className="flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">닉네임</label>
                    <input value={profile.nickname} onChange={(e) => updateProfile("nickname", e.target.value)} className="bg-transparent text-2xl font-black text-white border-b border-transparent focus:border-[#e6c788] outline-none w-32" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">주 클래스</label>
                    <select value={profile.job} onChange={(e) => updateProfile("job", e.target.value)} className="bg-[#121212] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-[#e6c788] outline-none">
                      {dbClasses.map(cls => <option key={cls.name} value={cls.name}>{cls.name}</option>)}
                    </select>
                  </div>
                  <div className="ml-2 pl-4 border-l border-zinc-700/50 hidden md:block max-w-[400px]">
                    <div className="flex flex-wrap gap-1.5">
                      {MY_ACCOUNT_CHARACTERS.filter(name => name !== profile.nickname).map(name => (
                        <button key={name} onClick={() => switchCharacter(name)} className="bg-[#1c1c1e] border border-zinc-700 hover:border-zinc-400 hover:text-white text-zinc-400 text-[11px] font-medium px-2.5 py-1 rounded transition">{name}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right bg-[#1c1c1e] px-4 py-2 rounded-lg border border-yellow-600/30">
                  <p className="text-[10px] text-[#e6c788] font-bold tracking-widest">누적 레벨</p>
                  <p className="text-3xl font-black text-white leading-none mt-1">{totalLevel} <span className="text-sm font-normal text-zinc-500">LV</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-red-400 mb-1 block">⚔️ 전투력</label><input type="number" value={profile.combatPower} onChange={e => updateProfile("combatPower", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-purple-400 mb-1 block">🔮 마도저항</label><input type="number" value={profile.magicResistance} onChange={e => updateProfile("magicResistance", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-emerald-400 mb-1 block">🌿 생활력</label><input type="number" value={profile.lifeEnergy} onChange={e => updateProfile("lifeEnergy", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50"><label className="text-[11px] font-bold text-pink-400 mb-1 block">✨ 매력</label><input type="number" value={profile.charm} onChange={e => updateProfile("charm", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" /></div>
              </div>

              <div className="flex gap-3">
                <input value={profile.intro} onChange={(e) => updateProfile("intro", e.target.value)} placeholder="길드원에게 보일 자기소개나 인삿말을 적어주세요!" className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-[#e6c788] outline-none" />
                <button onClick={handleSyncNexonAPI} className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 font-bold px-4 rounded-lg text-sm flex items-center gap-2">🔄 API 갱신</button>
                <button onClick={saveProgress} className="bg-yellow-600 text-white font-bold px-8 rounded-lg text-sm">{saved ? "저장 완료!" : "서버에 저장"}</button>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 1.5 검은 구멍 전용 관제탑 (총량 게이지 UI 추가) */}
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

            {/* 게이지 바 */}
            <div className="w-full bg-[#121212] h-2.5 rounded-full overflow-hidden border border-purple-900/50 relative z-10">
              <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-500" style={{ width: `${(bhTotalCount / bhMaxCount) * 100}%` }}></div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-2 relative z-10">
              {/* 일일 컨트롤 */}
              <div onClick={() => setDailyChecks(bhDailyDone ? dailyChecks.filter(i => i !== blackHoleDaily.name) : [...dailyChecks, blackHoleDaily.name])} 
                   className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${bhDailyDone ? "bg-purple-900/40 border-purple-500/60" : "bg-[#121212] border-zinc-700 hover:border-purple-500/40"}`}>
                <span className={`text-sm font-bold ${bhDailyDone ? "text-purple-300" : "text-zinc-400"}`}>오늘의 기본 탐험 (1회)</span>
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${bhDailyDone ? "bg-purple-500 text-white" : "bg-zinc-800 border border-zinc-600"}`}>
                  {bhDailyDone && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>

              {/* 주간 컨트롤 */}
              <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-zinc-700">
                <span className="text-sm font-bold text-zinc-400">이번주 초과 탐험 ({blackHoleWeekly.max_count}회)</span>
                <div className="flex gap-1 bg-[#1c1c1e] p-1 rounded border border-zinc-800">
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.name, -1, blackHoleWeekly.max_count)} className="w-7 h-7 flex justify-center items-center rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">-</button>
                  <span className="w-8 text-center text-sm font-black text-purple-400 flex items-center justify-center">{bhWeeklyCount}</span>
                  <button onClick={() => updateRepeatCount(blackHoleWeekly.name, 1, blackHoleWeekly.max_count)} className="w-7 h-7 flex justify-center items-center rounded bg-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-700">+</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. 체크보드 영역 */}
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">
          
          {/* ☀️ 일일 (일간 반복 포함) */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-amber-500 text-base">☀️ 일일 컨텐츠</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleAll('daily', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button>
                <button onClick={() => handleToggleAll('daily', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button>
              </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {visibleDailyList.map(item => renderTask(item, true))}
            </div>
          </div>

          {/* 🌙 주간 (주간/주말 반복 포함) */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-blue-400 text-base">🌙 주간 컨텐츠</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleAll('weekly', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button>
                <button onClick={() => handleToggleAll('weekly', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button>
              </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {visibleWeeklyList.map(item => renderTask(item, false))}
            </div>
          </div>

          {/* 🌌 어비스 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-emerald-400 text-base">🌌 어비스 관리</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleAll('abyss', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button>
                <button onClick={() => handleToggleAll('abyss', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button>
              </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {abyssList.map(item => renderTask(item, true))}
            </div>
          </div>

          {/* 🐉 레이드 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-indigo-400 text-base">🐉 레이드 관리</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleAll('raid', true)} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">✓ 전체</button>
                <button onClick={() => handleToggleAll('raid', false)} className="text-[10px] text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition">✗ 해제</button>
              </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {raidList.map(item => renderTask(item, true))}
            </div>
          </div>
        </div>

        {/* 하단 아코디언 메뉴 유지 */}
        <div className="space-y-4">
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsLevelOpen(!isLevelOpen)} className="w-full flex items-center justify-between p-5 hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">⚡ 클래스 레벨관리</h3>
              <span className="text-zinc-500">{isLevelOpen ? "▲" : "▼"}</span>
            </button>
            {isLevelOpen && (
              <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {dbClasses.map(cls => {
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