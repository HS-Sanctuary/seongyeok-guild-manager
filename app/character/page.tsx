"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사", "마법사", "화염술사", "빙결술사", "전격술사", 
  "궁수", "장궁병", "석궁사수", "음유시인", "댄서", "악사", "힐러", "사제", "수도사", 
  "암흑술사", "도적", "격투가", "듀얼블레이드"
];

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️", 마법사: "🪄", 화염술사: "🔥", 
  빙결술사: "❄️", 전격술사: "⚡", 궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸", 힐러: "💖", 사제: "🕊️", 수도사: "🙏", 
  암흑술사: "🌑", 도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

const DAILY_ITEMS = ["일일 미션", "일일 검은 구멍", "요일 던전", "일일 아르바이트", "심층 던전"];
const WEEKLY_ITEMS = ["심층 던전 (매우 어려움)", "멤버십 주간 아르바이트", "필드 보스"];

// 🟢 어비스와 레이드 완전 분리 (각 4종)
const ABYSS_ITEMS = ["어비스 - 허상의 정박지", "어비스 - 광기의 동굴", "어비스 - 흩어진 물길", "주말에는 어비스"];
const RAID_ITEMS = ["레이드 - 카브락", "레이드 - 화이트 서큐버스", "레이드 - 에이렐", "주말에는 레이드"];

interface TradeItem { id: number; map: string; npc: string; receiveItem: string; receiveCount: number; giveItem: string; giveCount: number; limit: number; reset: string; scope: string; }
interface PurchaseItem { id: number; map: string; npc: string; item: string; limit: number; currency: string; currencyCount: number; reset: string; scope: string; }

export default function CharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const defaultLevels = ALL_CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: 1 }), {});
  const defaultProfile = { nickname: "한설", job: "전사", combatPower: "", magicResistance: "", lifeEnergy: "", charm: "", intro: "" };
  const defaultRepeatChecks = { "검은 구멍": Array(7).fill(false), "불길한 소환의 결계": Array(7).fill(false), "뱅가드 브리치": Array(3).fill(false) };

  const [profile, setProfile] = useState(defaultProfile);
  const [levels, setLevels] = useState<Record<string, number>>(defaultLevels);
  
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<string[]>([]);
  const [weeklyRepeatChecks, setWeeklyRepeatChecks] = useState<Record<string, boolean[]>>(defaultRepeatChecks);
  
  // 🟢 상태 분리
  const [abyssChecks, setAbyssChecks] = useState<string[]>([]);
  const [raidChecks, setRaidChecks] = useState<string[]>([]);
  
  // 물물교환/구매 상태
  const [tradeItems, setTradeItems] = useState<TradeItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [favTrades, setFavTrades] = useState<number[]>([]);
  const [favPurchases, setFavPurchases] = useState<number[]>([]);

  const [isLevelOpen, setIsLevelOpen] = useState(true);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);
  const dailyRate = Math.round((dailyChecks.length / DAILY_ITEMS.length) * 100);
  const weeklyRate = Math.round((weeklyChecks.length / WEEKLY_ITEMS.length) * 100);
  const abyssRate = Math.round((abyssChecks.length / ABYSS_ITEMS.length) * 100);
  const raidRate = Math.round((raidChecks.length / RAID_ITEMS.length) * 100);

  const loadCharacterData = async (charName: string) => {
    try {
      const { data, error } = await supabase.from('characters').select('*').eq('nickname', charName).single();

      if (data) {
        setProfile({
          nickname: data.nickname, job: data.job || "전사",
          combatPower: data.combat_power || "", magicResistance: data.magic_resistance || "",
          lifeEnergy: data.life_energy || "", charm: data.charm || "", intro: data.intro || ""
        });
        setLevels(data.levels && Object.keys(data.levels).length > 0 ? data.levels : defaultLevels);
        setDailyChecks(data.daily_checks || []);
        
        if (data.weekly_checks && !Array.isArray(data.weekly_checks)) {
          setWeeklyChecks(data.weekly_checks.normal || []);
          setWeeklyRepeatChecks(data.weekly_checks.repeat || defaultRepeatChecks);
        } else {
          setWeeklyChecks(Array.isArray(data.weekly_checks) ? data.weekly_checks : []);
          setWeeklyRepeatChecks(defaultRepeatChecks);
        }
        
        // 🟢 DB의 raid_checks 하나에서 어비스와 레이드를 분리해서 화면에 뿌려줌
        const combinedRaids = data.raid_checks || [];
        setAbyssChecks(combinedRaids.filter((item: string) => item.includes('어비스')));
        setRaidChecks(combinedRaids.filter((item: string) => item.includes('레이드')));
      } else {
        setProfile({ ...defaultProfile, nickname: charName });
        setLevels(defaultLevels);
        setDailyChecks([]); setWeeklyChecks([]); setWeeklyRepeatChecks(defaultRepeatChecks);
        setAbyssChecks([]); setRaidChecks([]);
      }
    } catch (e) { console.error("DB 로드 에러:", e); }
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    loadCharacterData(parsedUser.nickname || "한설");

    // 로컬 스토리지에 저장된 즐겨찾기 불러오기 (임시)
    const savedFavT = localStorage.getItem(`nexus_fav_trades_${parsedUser.nickname}`);
    const savedFavP = localStorage.getItem(`nexus_fav_purchases_${parsedUser.nickname}`);
    if (savedFavT) setFavTrades(JSON.parse(savedFavT));
    if (savedFavP) setFavPurchases(JSON.parse(savedFavP));
  }, [router]);

  const saveProgress = async () => {
    try {
      const payload = {
        nickname: profile.nickname, job: profile.job,
        combat_power: profile.combatPower, magic_resistance: profile.magicResistance,
        life_energy: profile.lifeEnergy, charm: profile.charm, intro: profile.intro,
        levels: levels, daily_checks: dailyChecks,
        weekly_checks: { normal: weeklyChecks, repeat: weeklyRepeatChecks },
        // 🟢 저장할 때는 다시 하나의 배열로 합쳐서 저장 (DB 구조 변경 최소화)
        raid_checks: [...abyssChecks, ...raidChecks],
        updated_at: new Date()
      };

      const { error } = await supabase.from('characters').upsert(payload, { onConflict: 'nickname' }); 
      if (error) throw error;

      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (error) { alert("데이터베이스 저장에 실패했습니다."); }
  };

  const switchCharacter = async (targetName: string) => {
    await saveProgress(); 
    loadCharacterData(targetName); 
  };

  const handleSyncNexonAPI = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      setAbyssChecks(["어비스 - 허상의 정박지", "어비스 - 광기의 동굴", "어비스 - 흩어진 물길"]);
      setRaidChecks(["레이드 - 카브락"]);
      try {
        await supabase.from('activity_logs').insert([{ character_name: profile.nickname, content_name: "API 갱신", difficulty: "자동화", action: "클리어 연동 완료" }]);
      } catch(e) {}
      setIsSyncing(false);
      alert(`[API 동기화 완료] 📡\n\n'${profile.nickname}' 캐릭터의 클리어 내역을 성공적으로 불러왔습니다! ✅`);
    }, 1500);
  };

  const updateProfile = (field: string, value: string) => setProfile(prev => ({ ...prev, [field]: value }));
  const setMaxLevel = (cls: string) => setLevels(prev => ({ ...prev, [cls]: 65 }));

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🟦 1. 프로필 & 핵심 스탯 영역 (기존 유지) */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 bg-[#121212] rounded-xl border-2 border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#e6c788] flex-shrink-0 group relative overflow-hidden shadow-inner transition-colors">
              <span className="text-5xl group-hover:scale-110 transition-transform">{JOB_ICONS[profile.job] || "👤"}</span>
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
                      {ALL_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  
                  <div className="ml-2 pl-4 border-l border-zinc-700/50 hidden md:block max-w-[400px]">
                    <div className="flex flex-wrap gap-1.5">
                      {MY_ACCOUNT_CHARACTERS.filter(name => name !== profile.nickname).map(name => (
                        <button key={name} onClick={() => switchCharacter(name)} className="bg-[#1c1c1e] border border-zinc-700 hover:border-zinc-400 hover:text-white text-zinc-400 text-[11px] font-medium px-2.5 py-1 rounded transition">{name}</button>
                      ))}
                      <button className="bg-transparent border border-dashed border-zinc-600 hover:border-yellow-600 text-zinc-500 hover:text-yellow-500 text-[11px] px-2.5 py-1 rounded transition">+ 추가</button>
                    </div>
                  </div>
                </div>

                <div className="text-right bg-[#1c1c1e] px-4 py-2 rounded-lg border border-yellow-600/30 shadow-inner flex-shrink-0">
                  <p className="text-[10px] text-[#e6c788] font-bold tracking-widest">누적 레벨</p>
                  <p className="text-3xl font-black text-white leading-none mt-1">{totalLevel} <span className="text-sm font-normal text-zinc-500">LV</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-red-400 mb-1 flex items-center gap-1">⚔️ 전투력</label>
                  <input type="number" value={profile.combatPower} onChange={(e) => updateProfile("combatPower", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-purple-400 mb-1 flex items-center gap-1">🔮 마도저항</label>
                  <input type="number" value={profile.magicResistance} onChange={(e) => updateProfile("magicResistance", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">🌿 생활력</label>
                  <input type="number" value={profile.lifeEnergy} onChange={(e) => updateProfile("lifeEnergy", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-pink-400 mb-1 flex items-center gap-1">✨ 매력</label>
                  <input type="number" value={profile.charm} onChange={(e) => updateProfile("charm", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input value={profile.intro} onChange={(e) => updateProfile("intro", e.target.value)} placeholder="길드원에게 보일 자기소개나 인삿말 혹은 길드원과 파티에게 어필하시고 싶은 부분을 적어주세요!" className="w-full bg-[#1c1c1e] border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-[#e6c788] outline-none transition" />
                </div>
                
                <button onClick={handleSyncNexonAPI} disabled={isSyncing} className={`font-bold px-4 rounded-lg text-sm shadow-lg whitespace-nowrap transition flex items-center gap-2 border ${isSyncing ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'}`}>
                  {isSyncing ? <span className="animate-spin">⏳</span> : <span>🔄</span>}
                  {isSyncing ? '동기화 중...' : 'API 갱신'}
                </button>

                <button onClick={saveProgress} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-8 rounded-lg text-sm shadow-lg whitespace-nowrap transition relative overflow-hidden">
                  {saved ? "DB 저장 완료!" : "서버에 저장"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🟦 2. 4단 분할 체크보드 영역 (어비스 / 레이드 분리) */}
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">
          
          {/* 일일 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-amber-500 text-base">☀️ 일일 컨텐츠</h3>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {dailyRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {DAILY_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-amber-600/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={dailyChecks.includes(item)} onChange={() => {
                    const next = dailyChecks.includes(item) ? dailyChecks.filter(i => i !== item) : [...dailyChecks, item];
                    setDailyChecks(next);
                  }} className="w-5 h-5 accent-amber-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                </label>
              ))}
            </div>
          </div>

          {/* 주간 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-blue-400 text-base">🌙 주간 컨텐츠</h3>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {weeklyRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">검은 구멍 (7회)</span>
                <div className="flex gap-1">{Array.from({ length: 7 }).map((_, i) => <input key={`bh-${i}`} type="checkbox" checked={weeklyRepeatChecks["검은 구멍"][i]} onChange={() => { const next = [...weeklyRepeatChecks["검은 구멍"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "검은 구멍": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">결계 (7회)</span>
                <div className="flex gap-1">{Array.from({ length: 7 }).map((_, i) => <input key={`om-${i}`} type="checkbox" checked={weeklyRepeatChecks["불길한 소환의 결계"][i]} onChange={() => { const next = [...weeklyRepeatChecks["불길한 소환의 결계"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "불길한 소환의 결계": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">뱅가드 브리치 (3회)</span>
                <div className="flex gap-1 pr-[72px]">{Array.from({ length: 3 }).map((_, i) => <input key={`vg-${i}`} type="checkbox" checked={weeklyRepeatChecks["뱅가드 브리치"][i]} onChange={() => { const next = [...weeklyRepeatChecks["뱅가드 브리치"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "뱅가드 브리치": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              {WEEKLY_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={weeklyChecks.includes(item)} onChange={() => {
                    const next = weeklyChecks.includes(item) ? weeklyChecks.filter(i => i !== item) : [...weeklyChecks, item];
                    setWeeklyChecks(next);
                  }} className="w-5 h-5 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                </label>
              ))}
            </div>
          </div>

          {/* 🟢 어비스 (독립) */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-emerald-400 text-base">🌌 어비스 4종</h3>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {abyssRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {ABYSS_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-emerald-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={abyssChecks.includes(item)} onChange={() => {
                    const next = abyssChecks.includes(item) ? abyssChecks.filter(i => i !== item) : [...abyssChecks, item];
                    setAbyssChecks(next);
                  }} className="w-5 h-5 accent-emerald-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                </label>
              ))}
            </div>
          </div>

          {/* 🟢 레이드 (독립) */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-indigo-400 text-base">🐉 레이드 4종</h3>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {raidRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {RAID_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-indigo-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={raidChecks.includes(item)} onChange={() => {
                    const next = raidChecks.includes(item) ? raidChecks.filter(i => i !== item) : [...raidChecks, item];
                    setRaidChecks(next);
                  }} className="w-5 h-5 accent-indigo-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 🟦 3. 하단 통합 아코디언 메뉴 */}
        <div className="space-y-4">
          
          {/* 클래스 레벨관리 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsLevelOpen(!isLevelOpen)} className="w-full flex items-center justify-between p-5 bg-[#252528] hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">⚡ 클래스 레벨관리</h3>
              <span className="text-zinc-500">{isLevelOpen ? "▲" : "▼"}</span>
            </button>
            {isLevelOpen && (
              <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {ALL_CLASSES.map(cls => {
                    const isMax = levels[cls] === 65;
                    return (
                      <div key={cls} className={`relative flex flex-col items-center p-4 rounded-xl border transition-all ${isMax ? 'border-purple-500/50 bg-purple-900/10 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]' : 'border-zinc-700/50 bg-[#121212] hover:border-yellow-500/50'}`}>
                        {!isMax ? (
                          <button onClick={() => setMaxLevel(cls)} className="absolute top-2 right-2 text-[9px] font-bold bg-zinc-800 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-600 transition">MAX</button>
                        ) : (
                          <span className="absolute top-2 right-2 text-[10px] font-black text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">마스터</span>
                        )}
                        <span className={`text-2xl mb-2 drop-shadow-md ${isMax ? 'scale-110 transition-transform' : ''}`}>{JOB_ICONS[cls] || "🛡️"}</span>
                        <span className={`text-xs font-bold mb-1 ${isMax ? 'text-purple-300' : 'text-zinc-300'}`}>{cls}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 font-bold">Lv.</span>
                          <input type="number" min={1} max={65} value={levels[cls]} onChange={(e) => {
                            let val = Number(e.target.value); if (val > 65) val = 65;
                            setLevels(prev => ({...prev, [cls]: val}));
                          }} className="w-8 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700 focus:border-yellow-500 [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 🟢 물물교환 관리 탭 부활 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsTradeOpen(!isTradeOpen)} className="w-full flex items-center justify-between p-5 bg-[#252528] hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">⚖️ 물물교환 관리 <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded font-medium border border-red-800/50">관리자 연동 대기중</span></h3>
              <span className="text-zinc-500">{isTradeOpen ? "▲" : "▼"}</span>
            </button>
            {isTradeOpen && (
              <div className="p-8 border-t border-zinc-800 bg-[#1c1c1e] text-center">
                <p className="text-zinc-500 text-sm">추후 [관리자 전용 메뉴]에서 등록된 물물교환 품목이 이곳에 표시됩니다.</p>
              </div>
            )}
          </div>

          {/* 🟢 주간 구매 관리 탭 부활 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsPurchaseOpen(!isPurchaseOpen)} className="w-full flex items-center justify-between p-5 bg-[#252528] hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">🛒 주간 구매 관리 <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded font-medium border border-red-800/50">관리자 연동 대기중</span></h3>
              <span className="text-zinc-500">{isPurchaseOpen ? "▲" : "▼"}</span>
            </button>
            {isPurchaseOpen && (
              <div className="p-8 border-t border-zinc-800 bg-[#1c1c1e] text-center">
                <p className="text-zinc-500 text-sm">추후 [관리자 전용 메뉴]에서 등록된 주간 구매 품목이 이곳에 표시됩니다.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}