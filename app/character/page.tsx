"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- 상수 및 데이터 매핑 ---
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

// 마스터님 계정의 실제 캐릭터 목록 (DB 연동 전 임시 배열)
const MY_ACCOUNT_CHARACTERS = ["한설", "영겁", "순월", "쌍월", "먀치", "탄월"];

const DAILY_ITEMS = ["일일 미션", "일일 검은 구멍", "요일 던전", "일일 아르바이트", "심층 던전"];
const WEEKLY_ITEMS = ["심층 던전 (매우 어려움)", "멤버십 주간 아르바이트", "필드 보스"];
const RAID_ABYSS_ITEMS = ["어비스 - 허상의 정박지", "어비스 - 광기의 동굴", "어비스 - 흩어진 물길", "레이드 - 카브락", "레이드 - 화이트 서큐버스", "레이드 - 에이렐", "주말에는 어비스", "주말에는 레이드"];

interface TradeItem { id: number; map: string; npc: string; receiveItem: string; receiveCount: number; giveItem: string; giveCount: number; limit: number; reset: string; scope: string; }
interface PurchaseItem { id: number; map: string; npc: string; item: string; limit: number; currency: string; currencyCount: number; reset: string; scope: string; }

// =====================================================================
// 🏰 캐릭터 관리 전용 페이지 (/character)
// =====================================================================
export default function CharacterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  // 기본 상태 설정
  const defaultLevels = ALL_CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: 1 }), {});
  const defaultProfile = { nickname: "한설", job: "전사", combatPower: "", magicResistance: "", lifeEnergy: "", charm: "", intro: "" };
  const defaultRepeatChecks = { "검은 구멍": Array(7).fill(false), "불길한 소환의 결계": Array(7).fill(false), "뱅가드 브리치": Array(3).fill(false) };

  const [profile, setProfile] = useState(defaultProfile);
  const [levels, setLevels] = useState<Record<string, number>>(defaultLevels);
  
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<string[]>([]);
  const [weeklyRepeatChecks, setWeeklyRepeatChecks] = useState<Record<string, boolean[]>>(defaultRepeatChecks);
  const [raidAbyssChecks, setRaidAbyssChecks] = useState<string[]>([]);
  
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
  const raidAbyssRate = Math.round((raidAbyssChecks.length / RAID_ABYSS_ITEMS.length) * 100);

  // --- 캐릭터 전환 시 데이터 불러오기 함수 ---
  const loadCharacterData = (charName: string) => {
    const stored = localStorage.getItem(`nexus_char_data_${charName}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed.profile || { ...defaultProfile, nickname: charName });
        setLevels(parsed.levels || defaultLevels);
        setDailyChecks(parsed.dailyChecks || []);
        setWeeklyChecks(parsed.weeklyChecks || []);
        setWeeklyRepeatChecks(parsed.weeklyRepeatChecks || defaultRepeatChecks);
        setRaidAbyssChecks(parsed.raidAbyssChecks || []);
      } catch (e) { console.error(e); }
    } else {
      // 저장된 데이터가 없으면 초기화 상태로 세팅
      setProfile({ ...defaultProfile, nickname: charName });
      setLevels(defaultLevels);
      setDailyChecks([]);
      setWeeklyChecks([]);
      setWeeklyRepeatChecks(defaultRepeatChecks);
      setRaidAbyssChecks([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // 최초 로드 시 본인 닉네임 기준 데이터 호출
    loadCharacterData(parsedUser.nickname || "한설");

    const savedTrade = localStorage.getItem("nexus_trade_items");
    const savedPurchase = localStorage.getItem("nexus_purchase_items");
    const savedFavT = localStorage.getItem(`nexus_fav_trades_${parsedUser.nickname}`);
    const savedFavP = localStorage.getItem(`nexus_fav_purchases_${parsedUser.nickname}`);
    
    if (savedTrade) setTradeItems(JSON.parse(savedTrade));
    if (savedPurchase) setPurchaseItems(JSON.parse(savedPurchase));
    if (savedFavT) setFavTrades(JSON.parse(savedFavT));
    if (savedFavP) setFavPurchases(JSON.parse(savedFavP));
  }, [router]);

  // --- 프로필 저장 로직 ---
  const saveProgress = () => {
    const payload = { profile, levels, dailyChecks, weeklyChecks, weeklyRepeatChecks, raidAbyssChecks };
    localStorage.setItem(`nexus_char_data_${profile.nickname}`, JSON.stringify(payload));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // --- 캐릭터 전환 로직 ---
  const switchCharacter = (targetName: string) => {
    // 1. 현재 화면의 데이터 먼저 강제 저장
    const currentPayload = { profile, levels, dailyChecks, weeklyChecks, weeklyRepeatChecks, raidAbyssChecks };
    localStorage.setItem(`nexus_char_data_${profile.nickname}`, JSON.stringify(currentPayload));
    // 2. 타겟 캐릭터 데이터 불러오기
    loadCharacterData(targetName);
  };

  const updateProfile = (field: string, value: string) => setProfile(prev => ({ ...prev, [field]: value }));
  const setMaxLevel = (cls: string) => setLevels(prev => ({ ...prev, [cls]: 65 }));
  
  const toggleFavTrade = (id: number) => {
    const nextFavs = favTrades.includes(id) ? favTrades.filter(fav => fav !== id) : [...favTrades, id];
    setFavTrades(nextFavs);
    localStorage.setItem(`nexus_fav_trades_${user?.nickname}`, JSON.stringify(nextFavs));
  };

  const toggleFavPurchase = (id: number) => {
    const nextFavs = favPurchases.includes(id) ? favPurchases.filter(fav => fav !== id) : [...favPurchases, id];
    setFavPurchases(nextFavs);
    localStorage.setItem(`nexus_fav_purchases_${user?.nickname}`, JSON.stringify(nextFavs));
  };

  const sortedTrades = [...tradeItems].sort((a, b) => (favTrades.includes(b.id) ? 1 : 0) - (favTrades.includes(a.id) ? 1 : 0));
  const sortedPurchases = [...purchaseItems].sort((a, b) => (favPurchases.includes(b.id) ? 1 : 0) - (favPurchases.includes(a.id) ? 1 : 0));

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20">
      
      {/* 🟢 상단 글로벌 네비게이션 바 (GNB) - 일반 창 이동으로 수정 */}
      <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-8">
          {/* 암묵적 룰: 로고 클릭 시 메인 화면으로 */}
          <a href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-7 h-7 bg-[#121212] border border-yellow-600/50 rounded flex items-center justify-center shadow-inner group-hover:border-yellow-400 transition">
              <span className="text-white font-black text-[10px] tracking-tighter">NX</span>
            </div>
            <span className="text-[#e6c788] font-serif font-black text-xl tracking-tight group-hover:text-yellow-400 transition">
              Sanctuary Nexus
            </span>
          </a>

          {/* 상단 메뉴바 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-400">
            <a href="/notice" className="hover:text-white transition cursor-pointer">공지사항</a>
            <a href="/character" className="text-white border-b-2 border-[#e6c788] pb-1 cursor-pointer">캐릭터 관리</a>
            <a href="/party" className="hover:text-white transition cursor-pointer">파티 매칭</a>
            <a href="/ranking" className="hover:text-white transition cursor-pointer">성역 랭킹</a>
            <a href="/support" className="hover:text-white transition cursor-pointer">문의/건의</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-bold">{user.nickname}</span>
          <button onClick={() => { localStorage.removeItem("nexus_user"); router.push("/login"); }} className="text-zinc-500 hover:text-red-400 transition">로그아웃</button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🟦 1. 프로필 & 핵심 스탯 영역 */}
        <div className="bg-[#252528] rounded-2xl border border-zinc-700/80 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            {/* 좌측: 썸네일 */}
            <div className="w-32 h-32 bg-[#121212] rounded-xl border-2 border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#e6c788] flex-shrink-0 group relative overflow-hidden shadow-inner transition-colors">
              <span className="text-5xl group-hover:scale-110 transition-transform">{JOB_ICONS[profile.job] || "👤"}</span>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <span className="text-xs text-white font-bold">이미지 변경</span>
              </div>
            </div>

            {/* 우측: 정보 및 스탯 */}
            <div className="flex-1 w-full space-y-5">
              <div className="flex justify-between items-end border-b border-zinc-700/50 pb-4">
                <div className="flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">닉네임</label>
                    <input value={profile.nickname} onChange={(e) => updateProfile("nickname", e.target.value)} className="bg-transparent text-2xl font-black text-white border-b border-transparent focus:border-[#e6c788] outline-none w-32" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 mb-1 block">주 클래스</label>
                    <select value={profile.job} onChange={(e) => updateProfile("job", e.target.value)} className="bg-[#121212] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-[#e6c788] outline-none custom-select">
                      {ALL_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  
                  {/* 🟢 NEW: 캐릭터 퀵스위치 (현재 캐릭터 제외 나머지 출력, 텍스트 없이 캐릭터명만!) */}
                  <div className="ml-2 pl-4 border-l border-zinc-700/50 hidden md:block max-w-[400px]">
                    <div className="flex flex-wrap gap-1.5">
                      {MY_ACCOUNT_CHARACTERS.filter(name => name !== profile.nickname).map(name => (
                        <button 
                          key={name} 
                          onClick={() => switchCharacter(name)}
                          className="bg-[#1c1c1e] border border-zinc-700 hover:border-zinc-400 hover:text-white text-zinc-400 text-[11px] font-medium px-2.5 py-1 rounded transition"
                        >
                          {name}
                        </button>
                      ))}
                      <button className="bg-transparent border border-dashed border-zinc-600 hover:border-yellow-600 text-zinc-500 hover:text-yellow-500 text-[11px] px-2.5 py-1 rounded transition flex items-center justify-center">
                        + 추가
                      </button>
                    </div>
                  </div>
                </div>

                {/* 누적 레벨 */}
                <div className="text-right bg-[#1c1c1e] px-4 py-2 rounded-lg border border-yellow-600/30 shadow-inner flex-shrink-0">
                  <p className="text-[10px] text-[#e6c788] font-bold tracking-widest">누적 레벨</p>
                  <p className="text-3xl font-black text-white leading-none mt-1">{totalLevel} <span className="text-sm font-normal text-zinc-500">LV</span></p>
                </div>
              </div>

              {/* 4대 스탯 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-red-400 mb-1 flex items-center gap-1">⚔️ 전투력</label>
                  <input type="number" value={profile.combatPower} onChange={(e) => updateProfile("combatPower", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-purple-400 mb-1 flex items-center gap-1">🔮 마도저항</label>
                  <input type="number" value={profile.magicResistance} onChange={(e) => updateProfile("magicResistance", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">🌿 생활력</label>
                  <input type="number" value={profile.lifeEnergy} onChange={(e) => updateProfile("lifeEnergy", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700/50">
                  <label className="text-[11px] font-bold text-pink-400 mb-1 flex items-center gap-1">✨ 매력</label>
                  <input type="number" value={profile.charm} onChange={(e) => updateProfile("charm", e.target.value)} placeholder="0" className="w-full bg-transparent text-lg font-bold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              {/* 자기소개 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <input 
                    value={profile.intro} 
                    onChange={(e) => updateProfile("intro", e.target.value)} 
                    placeholder="길드원에게 보일 자기소개나 인삿말 혹은 길드원과 파티에게 어필하시고 싶은 부분을 적어주세요!" 
                    className="w-full bg-[#1c1c1e] border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-[#e6c788] outline-none transition" 
                  />
                </div>
                <button onClick={saveProgress} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-8 rounded-lg text-sm shadow-lg whitespace-nowrap transition relative overflow-hidden">
                  {saved ? "저장 완료!" : "프로필 저장"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🟦 2. 3단 분할 체크보드 영역 (텍스트 앞, 체크박스 뒤 정렬) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1열: 일일 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-6 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-amber-500 text-lg">☀️ 일일 컨텐츠</h3>
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {dailyRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {DAILY_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-amber-600/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={dailyChecks.includes(item)} onChange={() => {
                    const next = dailyChecks.includes(item) ? dailyChecks.filter(i => i !== item) : [...dailyChecks, item];
                    setDailyChecks(next);
                  }} className="w-5 h-5 accent-amber-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer flex-shrink-0" />
                </label>
              ))}
            </div>
          </div>

          {/* 2열: 주간 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-6 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-blue-400 text-lg">🌙 주간 컨텐츠</h3>
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {weeklyRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">검은 구멍 (7회)</span>
                <div className="flex gap-1 flex-shrink-0">{Array.from({ length: 7 }).map((_, i) => <input key={`bh-${i}`} type="checkbox" checked={weeklyRepeatChecks["검은 구멍"][i]} onChange={() => { const next = [...weeklyRepeatChecks["검은 구멍"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "검은 구멍": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">결계 (7회)</span>
                <div className="flex gap-1 flex-shrink-0">{Array.from({ length: 7 }).map((_, i) => <input key={`om-${i}`} type="checkbox" checked={weeklyRepeatChecks["불길한 소환의 결계"][i]} onChange={() => { const next = [...weeklyRepeatChecks["불길한 소환의 결계"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "불길한 소환의 결계": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-300 font-medium">뱅가드 브리치 (3회)</span>
                <div className="flex gap-1 flex-shrink-0 pr-[72px]">{Array.from({ length: 3 }).map((_, i) => <input key={`vg-${i}`} type="checkbox" checked={weeklyRepeatChecks["뱅가드 브리치"][i]} onChange={() => { const next = [...weeklyRepeatChecks["뱅가드 브리치"]]; next[i] = !next[i]; setWeeklyRepeatChecks(prev => ({...prev, "뱅가드 브리치": next})); }} className="w-4 h-4 accent-blue-500 cursor-pointer" />)}</div>
              </div>
              {WEEKLY_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={weeklyChecks.includes(item)} onChange={() => {
                    const next = weeklyChecks.includes(item) ? weeklyChecks.filter(i => i !== item) : [...weeklyChecks, item];
                    setWeeklyChecks(next);
                  }} className="w-5 h-5 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer flex-shrink-0" />
                </label>
              ))}
            </div>
          </div>

          {/* 3열: 레이드/어비스 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 p-6 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
              <h3 className="font-bold text-rose-500 text-lg">⚔️ 레이드 / 어비스</h3>
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">진행률 {raidAbyssRate}%</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {RAID_ABYSS_ITEMS.map(item => (
                <label key={item} className="flex items-center justify-between gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-rose-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  <input type="checkbox" checked={raidAbyssChecks.includes(item)} onChange={() => {
                    const next = raidAbyssChecks.includes(item) ? raidAbyssChecks.filter(i => i !== item) : [...raidAbyssChecks, item];
                    setRaidAbyssChecks(next);
                  }} className="w-5 h-5 accent-rose-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer flex-shrink-0" />
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* 🟦 3. 하단 통합 아코디언 메뉴 */}
        <div className="space-y-4">
          
          {/* 아코디언 1: 클래스 레벨관리 */}
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

          {/* 아코디언 2: 물물교환 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsTradeOpen(!isTradeOpen)} className="w-full flex items-center justify-between p-5 bg-[#252528] hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-emerald-400 text-lg flex items-center gap-2">🔄 물물교환 목록</h3>
              <span className="text-zinc-500">{isTradeOpen ? "▲" : "▼"}</span>
            </button>
            {isTradeOpen && (
              <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <p className="text-xs text-zinc-400 mb-4">★ 별을 클릭하여 자주 하는 교환을 상단에 고정하세요.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedTrades.map(item => {
                    const isFav = favTrades.includes(item.id);
                    return (
                      <div key={item.id} className={`rounded-lg border p-3 flex gap-3 items-start transition-colors ${isFav ? 'border-yellow-500/50 bg-[#252520]' : 'border-zinc-800 bg-[#252528]'}`}>
                        <button onClick={() => toggleFavTrade(item.id)} className={`text-xl ${isFav ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]' : 'text-zinc-600 hover:text-yellow-600'}`}>
                          {isFav ? '★' : '☆'}
                        </button>
                        <div>
                          <p className="font-bold text-white text-sm">{item.receiveItem} <span className="text-emerald-400">{item.receiveCount}</span>개 ↔ {item.giveItem} <span className="text-red-400">{item.giveCount}</span>개</p>
                          <p className="text-[11px] text-zinc-400 mt-1">{item.map} · {item.npc} · 상한 {item.limit}회 ({item.reset})</p>
                        </div>
                      </div>
                    )
                  })}
                  {sortedTrades.length === 0 && <p className="text-sm text-zinc-500 col-span-full py-4 text-center">등록된 물물교환 목록이 없습니다.</p>}
                </div>
              </div>
            )}
          </div>

          {/* 아코디언 3: 일일/주간 구매 */}
          <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setIsPurchaseOpen(!isPurchaseOpen)} className="w-full flex items-center justify-between p-5 bg-[#252528] hover:bg-[#2a2a2e] transition">
              <h3 className="font-bold text-violet-400 text-lg flex items-center gap-2">🛍️ 일일/주간 구매 목록</h3>
              <span className="text-zinc-500">{isPurchaseOpen ? "▲" : "▼"}</span>
            </button>
            {isPurchaseOpen && (
              <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                <p className="text-xs text-zinc-400 mb-4">★ 별을 클릭하여 자주 사는 품목을 상단에 고정하세요.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedPurchases.map(item => {
                    const isFav = favPurchases.includes(item.id);
                    return (
                      <div key={item.id} className={`rounded-lg border p-3 flex gap-3 items-start transition-colors ${isFav ? 'border-yellow-500/50 bg-[#252520]' : 'border-zinc-800 bg-[#252528]'}`}>
                        <button onClick={() => toggleFavPurchase(item.id)} className={`text-xl ${isFav ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]' : 'text-zinc-600 hover:text-yellow-600'}`}>
                          {isFav ? '★' : '☆'}
                        </button>
                        <div>
                          <p className="font-bold text-white text-sm">{item.item}</p>
                          <p className="text-[11px] text-zinc-400 mt-1">{item.currency} {item.currencyCount}개 소모 · {item.map} · {item.npc} ({item.reset})</p>
                        </div>
                      </div>
                    )
                  })}
                  {sortedPurchases.length === 0 && <p className="text-sm text-zinc-500 col-span-full py-4 text-center">등록된 구매 목록이 없습니다.</p>}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 커스텀 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-select {
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat, repeat;
          background-position: right .7em top 50%, 0 0;
          background-size: .65em auto, 100%;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1c1c1e; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}