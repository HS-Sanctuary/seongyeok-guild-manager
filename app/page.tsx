"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// 1. 전체 21개 직업 리스트 및 아이콘 매핑
const ALL_CLASSES = [
  "전사", "대검전사", "검술사", "기사", "마법사", "화염술사", "빙결술사", "전격술사", 
  "궁수", "장궁병", "석궁사수", "음유시인", "댄서", "악사", "힐러", "사제", "수도사", 
  "암흑술사", "도적", "격투가", "듀얼블레이드"
];

const JOB_ICONS: { [key: string]: string } = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

interface Character {
  id: number;
  name: string;
  job: string;
  daily: boolean;
  weekly: boolean;
  donate: boolean;
}

interface TradeItem {
  id: number;
  map: string;
  npc: string;
  receiveItem: string;
  receiveCount: number;
  giveItem: string;
  giveCount: number;
  limit: number;
  reset: string;
  scope: string;
}

interface PurchaseItem {
  id: number;
  map: string;
  npc: string;
  item: string;
  limit: number;
  currency: string;
  currencyCount: number;
  reset: string;
  scope: string;
}

interface PartyMatch {
  id: number;
  title: string;
  description: string;
  leader: string;
  members: string[];
  maxMembers: number;
  requiredRole: string;
}

interface TitleBadge {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

interface JournalEntry {
  id: number;
  type: "party" | "title";
  message: string;
  createdAt: string;
}

interface GuildNotice {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface ComplaintsItem {
  id: number;
  author: string;
  content: string;
  status: "대기" | "처리중" | "완료";
  createdAt: string;
}

interface TitleDetailModalProps {
  title: TitleBadge | null;
  onClose: () => void;
}

interface ComplaintModalProps {
  complaint: ComplaintsItem | null;
  onClose: () => void;
}

const INITIAL_TRADE_ITEMS: TradeItem[] = [
  { id: 1, map: "세이렌의 숲", npc: "로랑", receiveItem: "강화석", receiveCount: 20, giveItem: "다이아", giveCount: 3, limit: 5, reset: "일일", scope: "캐릭터당" },
  { id: 2, map: "나이트포트", npc: "마르코", receiveItem: "회복제", receiveCount: 10, giveItem: "성장 재료", giveCount: 5, limit: 3, reset: "주간", scope: "서버당" },
];

const INITIAL_PURCHASE_ITEMS: PurchaseItem[] = [
  { id: 1, map: "로렌스 항구", npc: "비아", item: "소형 체력 포션", limit: 5, currency: "골드", currencyCount: 5000, reset: "일일", scope: "캐릭터당" },
  { id: 2, map: "대도시 상점", npc: "기린", item: "희귀 장신구", limit: 2, currency: "다이아", currencyCount: 2, reset: "월간", scope: "서버당" },
];

const INITIAL_PARTY_MATCHES: PartyMatch[] = [
  { id: 1, title: "[4종] 어비스 매칭", description: "초보자도 환영! 함께 공략해요.", leader: "앤히크", members: ["민아", "태훈"], maxMembers: 4, requiredRole: "딜러/힐러" },
  { id: 2, title: "주말 레이드 지원", description: "레벨업과 파밍을 같이해요.", leader: "신파랑", members: ["네오", "한설"], maxMembers: 5, requiredRole: "탱커" },
];

const INITIAL_NOTICES: GuildNotice[] = [
  { id: 1, title: "이번 주 공략 일정", content: "금요일 저녁 8시부터 레이드 공략 진행", author: "길드장", createdAt: "오늘" },
  { id: 2, title: "파티원 모집", content: "어비스 4종 공략 인원 추가 모집", author: "운영진", createdAt: "어제" },
];

const INITIAL_COMPLAINTS: ComplaintsItem[] = [
  { id: 1, author: "한설", content: "파티 매칭 공지창이 더 잘 보이면 좋겠습니다.", status: "대기", createdAt: "오늘" },
  { id: 2, author: "민아", content: "보상 안내가 조금 더 명확했으면 좋겠습니다.", status: "처리중", createdAt: "어제" },
];

const TITLE_DEFINITIONS = [
  { id: "helper", name: "이번달 도우미", description: "파티 매칭 3회 참여", threshold: 3 },
  { id: "party-maker", name: "파티 메이커", description: "파티 매칭 10회 참여", threshold: 10 },
];

const DAILY_ITEMS = ["일일 미션", "일일 검은 구멍", "요일 던전", "일일 아르바이트", "심층 던전"];
const WEEKLY_ITEMS = ["심층 던전 (매우 어려움)", "주말에는 어비스", "주말에는 레이드", "멤버십 주간 아르바이트", "필드 보스", "어비스 3종 (허상/광기/물길)", "레이드 - 에이렐", "레이드 - 화이트 서큐버스", "레이드 - 타바르타스", "레이드 - 카브락"];

interface CharacterProgress {
  dailyRate: number;
  weeklyRate: number;
  tradeRate: number;
  purchaseRate: number;
}

const getCharacterProgressSnapshot = (characterId: number): CharacterProgress => {
  if (typeof window === "undefined") {
    return { dailyRate: 0, weeklyRate: 0, tradeRate: 0, purchaseRate: 0 };
  }

  const stored = window.localStorage.getItem(`nexus_character_${characterId}`);
  let dailyChecks: string[] = [];
  let weeklyChecks: string[] = [];

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      dailyChecks = parsed.dailyChecks || [];
      weeklyChecks = parsed.weeklyChecks || [];
    } catch (error) {
      console.error("진행률을 불러오지 못했습니다.", error);
    }
  }

  const tradeItems = JSON.parse(window.localStorage.getItem("nexus_trade_items") || "[]") as TradeItem[];
  const purchaseItems = JSON.parse(window.localStorage.getItem("nexus_purchase_items") || "[]") as PurchaseItem[];

  return {
    dailyRate: Math.round((dailyChecks.length / DAILY_ITEMS.length) * 100),
    weeklyRate: Math.round((weeklyChecks.length / WEEKLY_ITEMS.length) * 100),
    tradeRate: Math.min(100, Math.round((tradeItems.length / Math.max(1, INITIAL_TRADE_ITEMS.length)) * 100)),
    purchaseRate: Math.min(100, Math.round((purchaseItems.length / Math.max(1, INITIAL_PURCHASE_ITEMS.length)) * 100)),
  };
};

// =====================================================================
// 🎯 [신규 모듈] 캐릭터 상세 정보 & 일일/주간 체크보드 & 올라운더 계산기 모달
// =====================================================================
function TitleDetailModal({ title, onClose }: TitleDetailModalProps) {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#1c1c1e] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">칭호 상세</p>
            <h3 className="mt-1 text-lg font-black text-[#e6c788]">{title.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="mt-4 rounded-lg border border-zinc-800 bg-[#171719] p-3 text-sm text-zinc-300">
          <p>{title.description}</p>
          <p className="mt-2 text-[11px] text-zinc-500">획득일: {title.unlockedAt}</p>
        </div>
      </div>
    </div>
  );
}

function ComplaintModal({ complaint, onClose }: ComplaintModalProps) {
  if (!complaint) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#1c1c1e] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">길드마스터 확인</p>
            <h3 className="mt-1 text-lg font-black text-white">불만/건의 상세</h3>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="mt-4 rounded-lg border border-zinc-800 bg-[#171719] p-3 text-sm text-zinc-300">
          <p className="text-white">{complaint.content}</p>
          <p className="mt-2 text-[11px] text-zinc-500">작성자 {complaint.author} · {complaint.createdAt} · 상태 {complaint.status}</p>
        </div>
      </div>
    </div>
  );
}

function CharacterModal({ char, onClose, userRole }: { char: Character; onClose: () => void; userRole: string }) {
  const defaultLevels = ALL_CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: 1 }), {});
  const defaultProfile = {
    nickname: char.name,
    job: char.job,
    combatPower: "",
    lifeEnergy: "",
    charm: "",
    intro: "",
  };
  const defaultRepeatChecks = {
    "검은 구멍": Array(7).fill(false),
    "불길한 소환의 결계": Array(7).fill(false),
    "뱅가드 브리치": Array(3).fill(false),
  };

  const [levels, setLevels] = useState<Record<string, number>>(defaultLevels);
  const [isAllRounderOpen, setIsAllRounderOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [weeklyChecks, setWeeklyChecks] = useState<string[]>([]);
  const [weeklyRepeatChecks, setWeeklyRepeatChecks] = useState<Record<string, boolean[]>>(defaultRepeatChecks);
  const [tradeItems, setTradeItems] = useState<TradeItem[]>(INITIAL_TRADE_ITEMS);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(INITIAL_PURCHASE_ITEMS);
  const [tradeForm, setTradeForm] = useState({
    map: "",
    npc: "",
    receiveItem: "",
    receiveCount: "",
    giveItem: "",
    giveCount: "",
    limit: "",
    reset: "일일",
    scope: "캐릭터당",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    map: "",
    npc: "",
    item: "",
    limit: "",
    currency: "골드",
    currencyCount: "",
    reset: "일일",
    scope: "캐릭터당",
  });

  const isAdmin = /마스터|관리자|길드장/i.test(userRole || "");

  useEffect(() => {
    const stored = localStorage.getItem(`nexus_character_${char.id}`);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setProfile(parsed.profile || defaultProfile);
      setLevels(parsed.levels || defaultLevels);
      setDailyChecks(parsed.dailyChecks || []);
      setWeeklyChecks(parsed.weeklyChecks || []);
      setWeeklyRepeatChecks(parsed.weeklyRepeatChecks || defaultRepeatChecks);
    } catch (error) {
      console.error("저장된 캐릭터 상태를 불러오지 못했습니다.", error);
    }
  }, [char.id]);

  useEffect(() => {
    try {
      const savedTrade = localStorage.getItem("nexus_trade_items");
      const savedPurchase = localStorage.getItem("nexus_purchase_items");
      if (savedTrade) setTradeItems(JSON.parse(savedTrade));
      if (savedPurchase) setPurchaseItems(JSON.parse(savedPurchase));
    } catch (error) {
      console.error("저장된 교환/구매 목록을 불러오지 못했습니다.", error);
    }
  }, []);

  const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);
  const dailyItems = DAILY_ITEMS;
  const weeklyItems = WEEKLY_ITEMS;
  const dailyRate = Math.round((dailyChecks.length / dailyItems.length) * 100);
  const weeklyRate = Math.round((weeklyChecks.length / weeklyItems.length) * 100);

  const persistProgress = (
    nextProfile = profile,
    nextLevels = levels,
    nextDailyChecks = dailyChecks,
    nextWeeklyChecks = weeklyChecks,
    nextWeeklyRepeatChecks = weeklyRepeatChecks,
  ) => {
    const payload = {
      profile: nextProfile,
      levels: nextLevels,
      dailyChecks: nextDailyChecks,
      weeklyChecks: nextWeeklyChecks,
      weeklyRepeatChecks: nextWeeklyRepeatChecks,
    };
    localStorage.setItem(`nexus_character_${char.id}`, JSON.stringify(payload));
    window.dispatchEvent(new Event("nexus-progress-updated"));
  };

  const updateProfileField = (field: "nickname" | "job" | "combatPower" | "lifeEnergy" | "charm" | "intro", value: string) => {
    const nextProfile = { ...profile, [field]: value };
    setProfile(nextProfile);
    persistProgress(nextProfile, levels, dailyChecks, weeklyChecks, weeklyRepeatChecks);
  };

  const setMaxLevel = (cls: string) => {
    const nextLevels = { ...levels, [cls]: 65 };
    setLevels(nextLevels);
    persistProgress(profile, nextLevels, dailyChecks, weeklyChecks, weeklyRepeatChecks);
  };

  const persistLists = (nextTradeItems: TradeItem[], nextPurchaseItems: PurchaseItem[]) => {
    setTradeItems(nextTradeItems);
    setPurchaseItems(nextPurchaseItems);
    localStorage.setItem("nexus_trade_items", JSON.stringify(nextTradeItems));
    localStorage.setItem("nexus_purchase_items", JSON.stringify(nextPurchaseItems));
    window.dispatchEvent(new Event("nexus-progress-updated"));
  };

  const handleTradeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tradeForm.map || !tradeForm.receiveItem || !tradeForm.giveItem) return;

    const newItem: TradeItem = {
      id: Date.now(),
      map: tradeForm.map,
      npc: tradeForm.npc || "미정",
      receiveItem: tradeForm.receiveItem,
      receiveCount: Number(tradeForm.receiveCount) || 1,
      giveItem: tradeForm.giveItem,
      giveCount: Number(tradeForm.giveCount) || 1,
      limit: Number(tradeForm.limit) || 1,
      reset: tradeForm.reset,
      scope: tradeForm.scope,
    };

    persistLists([newItem, ...tradeItems], purchaseItems);
    setTradeForm({
      map: "",
      npc: "",
      receiveItem: "",
      receiveCount: "",
      giveItem: "",
      giveCount: "",
      limit: "",
      reset: "일일",
      scope: "캐릭터당",
    });
  };

  const handlePurchaseSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!purchaseForm.map || !purchaseForm.item) return;

    const newItem: PurchaseItem = {
      id: Date.now(),
      map: purchaseForm.map,
      npc: purchaseForm.npc || "미정",
      item: purchaseForm.item,
      limit: Number(purchaseForm.limit) || 1,
      currency: purchaseForm.currency,
      currencyCount: Number(purchaseForm.currencyCount) || 1,
      reset: purchaseForm.reset,
      scope: purchaseForm.scope,
    };

    persistLists(tradeItems, [newItem, ...purchaseItems]);
    setPurchaseForm({
      map: "",
      npc: "",
      item: "",
      limit: "",
      currency: "골드",
      currencyCount: "",
      reset: "일일",
      scope: "캐릭터당",
    });
  };

  const removeTradeItem = (id: number) => {
    persistLists(tradeItems.filter((item) => item.id !== id), purchaseItems);
  };

  const removePurchaseItem = (id: number) => {
    persistLists(tradeItems, purchaseItems.filter((item) => item.id !== id));
  };

  const toggleDaily = (item: string) => {
    const nextChecks = dailyChecks.includes(item) ? dailyChecks.filter(i => i !== item) : [...dailyChecks, item];
    setDailyChecks(nextChecks);
    persistProgress(profile, levels, nextChecks, weeklyChecks, weeklyRepeatChecks);
  };

  const toggleWeekly = (item: string) => {
    const nextChecks = weeklyChecks.includes(item) ? weeklyChecks.filter(i => i !== item) : [...weeklyChecks, item];
    setWeeklyChecks(nextChecks);
    persistProgress(profile, levels, dailyChecks, nextChecks, weeklyRepeatChecks);
  };

  const toggleRepeatCheck = (name: string, index: number) => {
    const nextRepeatChecks = {
      ...weeklyRepeatChecks,
      [name]: weeklyRepeatChecks[name].map((value, i) => (i === index ? !value : value)),
    };
    setWeeklyRepeatChecks(nextRepeatChecks);
    persistProgress(profile, levels, dailyChecks, weeklyChecks, nextRepeatChecks);
  };

  const saveProfile = () => {
    persistProgress(profile, levels, dailyChecks, weeklyChecks, weeklyRepeatChecks);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1c1c1e] border border-yellow-600/50 rounded-xl w-full max-w-6xl my-8 flex flex-col shadow-2xl relative max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-5 text-zinc-400 hover:text-white font-black text-xl z-20">✕</button>

        <div className="overflow-y-auto custom-scrollbar">
          <div className="bg-[#252528] p-6 border-b border-zinc-800 rounded-t-xl">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-28 h-28 bg-[#121212] rounded-lg border border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 flex-shrink-0 group relative overflow-hidden shadow-inner">
                <span className="text-4xl group-hover:hidden">👤</span>
                <div className="hidden group-hover:flex bg-black/70 w-full h-full absolute flex-col items-center justify-center">
                  <span className="text-[10px] text-white font-bold">이미지 변경</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">닉네임</label>
                  <input value={profile.nickname} onChange={(e) => updateProfileField("nickname", e.target.value)} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">주 클래스</label>
                  <select value={profile.job} onChange={(e) => updateProfileField("job", e.target.value)} className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none custom-select">
                    {ALL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">전투력</label>
                  <input type="number" value={profile.combatPower} onChange={(e) => updateProfileField("combatPower", e.target.value)} placeholder="예: 35000" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">생활력</label>
                  <input type="number" value={profile.lifeEnergy} onChange={(e) => updateProfileField("lifeEnergy", e.target.value)} placeholder="입력" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">매력</label>
                  <input type="number" value={profile.charm} onChange={(e) => updateProfileField("charm", e.target.value)} placeholder="입력" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">자기소개 / 인삿말</label>
                  <input value={profile.intro} onChange={(e) => updateProfileField("intro", e.target.value)} placeholder="길드원들에게 한마디!" className="w-full bg-[#121212] border border-zinc-700 rounded p-2.5 text-sm text-white focus:border-yellow-600 outline-none" />
                </div>
              </div>

              <div className="flex flex-col justify-end h-full mt-4 md:mt-0 w-full md:w-auto gap-2">
                <button type="button" onClick={saveProfile} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg text-sm w-full shadow-lg whitespace-nowrap">프로필 저장</button>
                {saved && <span className="text-[11px] text-emerald-400 text-center">저장 완료</span>}
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#1c1c1e]">
            <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
                <h3 className="font-bold text-amber-500 text-lg flex items-center gap-2">☀️ 일일 컨텐츠</h3>
                <span className="text-[11px] text-zinc-400">완료율 {dailyRate}%</span>
              </div>
              <div className="space-y-1.5 flex-1 pr-2">
                {dailyItems.map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-amber-600/50 transition">
                    <input type="checkbox" checked={dailyChecks.includes(item)} onChange={() => toggleDaily(item)} className="w-5 h-5 accent-amber-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-[#252528] rounded-xl border border-zinc-800 p-5 shadow-md flex flex-col">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-700 pb-3">
                <h3 className="font-bold text-blue-400 text-lg flex items-center gap-2">🌙 주간 컨텐츠</h3>
                <span className="text-[11px] text-zinc-400">완료율 {weeklyRate}%</span>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">검은 구멍 (주 7회)</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <input key={`bh-${i}`} type="checkbox" checked={weeklyRepeatChecks["검은 구멍"][i]} onChange={() => toggleRepeatCheck("검은 구멍", i)} className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">불길한 소환의 결계 (주 7회)</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <input key={`om-${i}`} type="checkbox" checked={weeklyRepeatChecks["불길한 소환의 결계"][i]} onChange={() => toggleRepeatCheck("불길한 소환의 결계", i)} className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg border border-zinc-800 hover:border-blue-500/50 transition">
                  <span className="text-sm text-zinc-300 font-medium">뱅가드 브리치 (주 3회)</span>
                  <div className="flex gap-1.5 pr-20">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <input key={`vg-${i}`} type="checkbox" checked={weeklyRepeatChecks["뱅가드 브리치"][i]} onChange={() => toggleRepeatCheck("뱅가드 브리치", i)} className="w-4 h-4 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    ))}
                  </div>
                </div>

                {weeklyItems.map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-[#1c1c1e] hover:bg-[#202023] rounded-lg cursor-pointer border border-zinc-800 hover:border-blue-500/50 transition">
                    <input type="checkbox" checked={weeklyChecks.includes(item)} onChange={() => toggleWeekly(item)} className="w-5 h-5 accent-blue-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                    <span className="text-sm text-zinc-300 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#252528] p-6 border-t border-zinc-800 rounded-b-xl space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-zinc-800/40 p-3 -mx-3 rounded-xl transition-colors duration-200"
              onClick={() => setIsAllRounderOpen(!isAllRounderOpen)}
            >
              <div>
                <h3 className="font-bold text-[#e6c788] text-lg flex items-center gap-2">
                  ⚡ 올라운더 클래스 레벨 관리 
                  <span className="text-sm text-zinc-500">{isAllRounderOpen ? "▲" : "▼"}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">캐릭터의 모든 클래스 레벨을 관리하세요. MAX(65) 달성 시 마스터 칭호가 부여됩니다.</p>
              </div>
              <div className="bg-[#121212] border border-zinc-700 px-4 py-2 rounded-lg flex flex-col items-end shadow-inner">
                <span className="text-[10px] text-zinc-500 font-bold">합산된 총 레벨</span>
                <span className="text-xl font-black text-white">{totalLevel} <span className="text-xs text-zinc-500 font-normal">LV</span></span>
              </div>
            </div>

            {isAllRounderOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-6 pt-6 border-t border-zinc-700/50">
                {ALL_CLASSES.map(cls => {
                  const isMax = levels[cls] === 65;
                  return (
                    <div key={cls} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${isMax ? 'border-purple-500/50 bg-purple-900/10' : 'border-zinc-700/50 bg-[#121212] hover:border-yellow-500/50'}`}>
                      {!isMax ? (
                        <button onClick={() => setMaxLevel(cls)} className="absolute top-2 right-2 text-[9px] font-bold bg-zinc-800 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-600 transition">MAX</button>
                      ) : (
                        <span className="absolute top-2 right-2 text-[10px] font-black text-purple-400 tracking-tighter">마스터</span>
                      )}

                      <div className={`w-12 h-12 rounded-full border-[2.5px] flex items-center justify-center mb-2 transition-colors ${isMax ? 'border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-zinc-700 text-zinc-500'}`}>
                        <span className="text-xl drop-shadow-md">{JOB_ICONS[cls] || "🛡️"}</span>
                      </div>

                      <span className={`text-xs font-bold mb-1 ${isMax ? 'text-purple-300' : 'text-zinc-300'}`}>{cls}</span>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 font-bold">Lv.</span>
                        <input 
                          type="number" min={1} max={65} 
                          value={levels[cls]} 
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 65) val = 65;
                            setLevels(prev => ({...prev, [cls]: val}));
                          }} 
                          className="w-8 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-transparent focus:border-yellow-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <button type="button" onClick={() => setIsTradeOpen(!isTradeOpen)} className="w-full flex items-center justify-between rounded-lg border border-zinc-700 bg-[#1c1c1e] px-3 py-2 text-sm text-zinc-200">
                <span>🔄 물물교환</span>
                <span>{isTradeOpen ? "▲" : "▼"}</span>
              </button>
              {isTradeOpen && (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#1c1c1e] p-3">
                  {isAdmin && (
                    <form onSubmit={handleTradeSubmit} className="space-y-2 rounded-lg border border-zinc-700 bg-[#171719] p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={tradeForm.map} onChange={(e) => setTradeForm(prev => ({ ...prev, map: e.target.value }))} placeholder="맵" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <input value={tradeForm.npc} onChange={(e) => setTradeForm(prev => ({ ...prev, npc: e.target.value }))} placeholder="NPC" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={tradeForm.receiveItem} onChange={(e) => setTradeForm(prev => ({ ...prev, receiveItem: e.target.value }))} placeholder="받는 품목" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <input value={tradeForm.receiveCount} onChange={(e) => setTradeForm(prev => ({ ...prev, receiveCount: e.target.value }))} placeholder="받는 수" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={tradeForm.giveItem} onChange={(e) => setTradeForm(prev => ({ ...prev, giveItem: e.target.value }))} placeholder="주는 품목" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <input value={tradeForm.giveCount} onChange={(e) => setTradeForm(prev => ({ ...prev, giveCount: e.target.value }))} placeholder="주는 수" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input value={tradeForm.limit} onChange={(e) => setTradeForm(prev => ({ ...prev, limit: e.target.value }))} placeholder="상한" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <select value={tradeForm.reset} onChange={(e) => setTradeForm(prev => ({ ...prev, reset: e.target.value }))} className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white">
                          <option value="일일">일일</option>
                          <option value="주간">주간</option>
                          <option value="월간">월간</option>
                        </select>
                        <select value={tradeForm.scope} onChange={(e) => setTradeForm(prev => ({ ...prev, scope: e.target.value }))} className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white">
                          <option value="캐릭터당">캐릭터당</option>
                          <option value="서버당">서버당</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded">추가하기</button>
                    </form>
                  )}

                  {tradeItems.map((item) => (
                    <div key={item.id} className="rounded-md border border-zinc-800 bg-[#252528] p-2.5 text-sm text-zinc-300">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{item.receiveItem} {item.receiveCount}개 ↔ {item.giveItem} {item.giveCount}개</p>
                          <p className="text-[11px] text-zinc-400 mt-1">{item.map} · {item.npc}</p>
                        </div>
                        {isAdmin && (
                          <button type="button" onClick={() => removeTradeItem(item.id)} className="text-[11px] text-red-400 hover:text-red-300">삭제</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setIsPurchaseOpen(!isPurchaseOpen)} className="w-full flex items-center justify-between rounded-lg border border-zinc-700 bg-[#1c1c1e] px-3 py-2 text-sm text-zinc-200">
                <span>🛍️ 일일/주간 구매</span>
                <span>{isPurchaseOpen ? "▲" : "▼"}</span>
              </button>
              {isPurchaseOpen && (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#1c1c1e] p-3">
                  {isAdmin && (
                    <form onSubmit={handlePurchaseSubmit} className="space-y-2 rounded-lg border border-zinc-700 bg-[#171719] p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={purchaseForm.map} onChange={(e) => setPurchaseForm(prev => ({ ...prev, map: e.target.value }))} placeholder="맵" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <input value={purchaseForm.npc} onChange={(e) => setPurchaseForm(prev => ({ ...prev, npc: e.target.value }))} placeholder="NPC" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={purchaseForm.item} onChange={(e) => setPurchaseForm(prev => ({ ...prev, item: e.target.value }))} placeholder="구매 품목" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <input value={purchaseForm.limit} onChange={(e) => setPurchaseForm(prev => ({ ...prev, limit: e.target.value }))} placeholder="상한" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input value={purchaseForm.currencyCount} onChange={(e) => setPurchaseForm(prev => ({ ...prev, currencyCount: e.target.value }))} placeholder="재화 수" className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white" />
                        <select value={purchaseForm.currency} onChange={(e) => setPurchaseForm(prev => ({ ...prev, currency: e.target.value }))} className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white">
                          <option value="골드">골드</option>
                          <option value="다이아">다이아</option>
                          <option value="우편 코인">우편 코인</option>
                        </select>
                        <select value={purchaseForm.reset} onChange={(e) => setPurchaseForm(prev => ({ ...prev, reset: e.target.value }))} className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white">
                          <option value="일일">일일</option>
                          <option value="주간">주간</option>
                          <option value="월간">월간</option>
                        </select>
                      </div>
                      <select value={purchaseForm.scope} onChange={(e) => setPurchaseForm(prev => ({ ...prev, scope: e.target.value }))} className="w-full bg-[#121212] border border-zinc-700 rounded p-2 text-sm text-white">
                        <option value="캐릭터당">캐릭터당</option>
                        <option value="서버당">서버당</option>
                      </select>
                      <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2 rounded">추가하기</button>
                    </form>
                  )}

                  {purchaseItems.map((item) => (
                    <div key={item.id} className="rounded-md border border-zinc-800 bg-[#252528] p-2.5 text-sm text-zinc-300">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{item.item}</p>
                          <p className="text-[11px] text-zinc-400 mt-1">{item.map} · {item.npc}</p>
                        </div>
                        {isAdmin && (
                          <button type="button" onClick={() => removePurchaseItem(item.id)} className="text-[11px] text-red-400 hover:text-red-300">삭제</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 🏰 메인 대시보드 (Home)
// =====================================================================
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [characterGrid, setCharacterGrid] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, CharacterProgress>>({});
  const [tradeItemCount, setTradeItemCount] = useState(INITIAL_TRADE_ITEMS.length);
  const [purchaseItemCount, setPurchaseItemCount] = useState(INITIAL_PURCHASE_ITEMS.length);
  const [partyMatches, setPartyMatches] = useState<PartyMatch[]>(INITIAL_PARTY_MATCHES);
  const [earnedTitles, setEarnedTitles] = useState<TitleBadge[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [partyJoinCount, setPartyJoinCount] = useState(0);
  const [selectedTitle, setSelectedTitle] = useState<TitleBadge | null>(null);
  const [todayGoal, setTodayGoal] = useState("파티 1회 참여하기");
  const [notices, setNotices] = useState<GuildNotice[]>(INITIAL_NOTICES);
  const [complaints, setComplaints] = useState<ComplaintsItem[]>(INITIAL_COMPLAINTS);
  const [newNotice, setNewNotice] = useState({ title: "", content: "" });
  const [newComplaint, setNewComplaint] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintsItem | null>(null);

  const refreshProgressMap = useCallback(() => {
    const nextProgress: Record<number, CharacterProgress> = {};
    characterGrid.forEach((char) => {
      nextProgress[char.id] = getCharacterProgressSnapshot(char.id);
    });
    setProgressMap(nextProgress);
  }, [characterGrid]);

  const fetchCharacters = async () => {
    try {
      const { data } = await supabase.from("characters").select("*").order("id", { ascending: true });
      if (data && data.length > 0) {
        setCharacterGrid(data);
      } else {
        setCharacterGrid([
          { id: 1, name: "한설", job: "전사", daily: false, weekly: false, donate: false },
          { id: 2, name: "제스", job: "마법사", daily: false, weekly: false, donate: false },
          { id: 3, name: "신파랑", job: "궁수", daily: false, weekly: false, donate: false },
          { id: 4, name: "화연", job: "힐러", daily: false, weekly: false, donate: false },
          { id: 5, name: "오십쇼", job: "도적", daily: false, weekly: false, donate: false },
          { id: 6, name: "별콩", job: "기사", daily: false, weekly: false, donate: false },
        ]);
      }
    } catch (e) {
      console.error("DB 오류");
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) router.push("/login");
    else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchCharacters();

      try {
        const savedGoal = localStorage.getItem("nexus_today_goal");
        if (savedGoal) setTodayGoal(savedGoal);

        const savedMatches = localStorage.getItem("nexus_party_matches");
        if (savedMatches) setPartyMatches(JSON.parse(savedMatches));

        const savedNotices = localStorage.getItem("nexus_notices");
        if (savedNotices) setNotices(JSON.parse(savedNotices));

        const savedComplaints = localStorage.getItem("nexus_complaints");
        if (savedComplaints) setComplaints(JSON.parse(savedComplaints));

        const savedTitles = localStorage.getItem("nexus_earned_titles");
        if (savedTitles) setEarnedTitles(JSON.parse(savedTitles));

        const savedJournal = localStorage.getItem("nexus_journal_entries");
        if (savedJournal) setJournalEntries(JSON.parse(savedJournal));

        const savedCount = localStorage.getItem(`nexus_party_count_${parsedUser.nickname || "guest"}`);
        if (savedCount) setPartyJoinCount(Number(savedCount));
      } catch (error) {
        console.error("파티/칭호 기록을 불러오지 못했습니다.", error);
      }
    }
  }, [router]);

  useEffect(() => {
    refreshProgressMap();
  }, [refreshProgressMap]);

  useEffect(() => {
    const handleProgressRefresh = () => {
      refreshProgressMap();
      try {
        const tradeItems = JSON.parse(window.localStorage.getItem("nexus_trade_items") || "[]") as TradeItem[];
        const purchaseItems = JSON.parse(window.localStorage.getItem("nexus_purchase_items") || "[]") as PurchaseItem[];
        setTradeItemCount(tradeItems.length);
        setPurchaseItemCount(purchaseItems.length);
      } catch (error) {
        console.error("목록 카운트를 갱신하지 못했습니다.", error);
      }
    };

    handleProgressRefresh();
    window.addEventListener("nexus-progress-updated", handleProgressRefresh);
    window.addEventListener("storage", handleProgressRefresh);
    return () => {
      window.removeEventListener("nexus-progress-updated", handleProgressRefresh);
      window.removeEventListener("storage", handleProgressRefresh);
    };
  }, [refreshProgressMap]);

  const updateTodayGoal = (goal: string) => {
    setTodayGoal(goal);
    localStorage.setItem("nexus_today_goal", goal);
  };

  const addNotice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    const nextNotice = {
      id: Date.now(),
      title: newNotice.title,
      content: newNotice.content,
      author: user?.nickname || "운영진",
      createdAt: "방금",
    };
    const nextNotices = [nextNotice, ...notices];
    setNotices(nextNotices);
    localStorage.setItem("nexus_notices", JSON.stringify(nextNotices));
    setNewNotice({ title: "", content: "" });
  };

  const addComplaint = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;
    const nextComplaint = {
      id: Date.now(),
      author: user?.nickname || "익명",
      content: newComplaint,
      status: "대기" as const,
      createdAt: "방금",
    };
    const nextComplaints = [nextComplaint, ...complaints];
    setComplaints(nextComplaints);
    localStorage.setItem("nexus_complaints", JSON.stringify(nextComplaints));
    setNewComplaint("");
  };

  const joinParty = (matchId: number) => {
    const currentUserName = user?.nickname || "익명";
    const nextCount = partyJoinCount + 1;
    const nextMatches = partyMatches.map((match) => match.id === matchId ? { ...match, members: [...match.members, currentUserName] } : match);
    const newTitle = nextCount >= 10 ? TITLE_DEFINITIONS[1] : nextCount >= 3 ? TITLE_DEFINITIONS[0] : null;

    const nextTitles = newTitle && !earnedTitles.some((title) => title.id === newTitle.id)
      ? [...earnedTitles, { ...newTitle, unlockedAt: new Date().toLocaleString("ko-KR") }]
      : earnedTitles;

    const nextJournal = [
      {
        id: Date.now(),
        type: "party" as const,
        message: `${currentUserName}님이 파티 매칭에 참여했습니다.`,
        createdAt: new Date().toLocaleString("ko-KR"),
      },
      ...(newTitle ? [{ id: Date.now() + 1, type: "title" as const, message: `${newTitle.name} 칭호를 획득했습니다.`, createdAt: new Date().toLocaleString("ko-KR") }] : []),
      ...journalEntries,
    ].slice(0, 8);

    setPartyJoinCount(nextCount);
    setPartyMatches(nextMatches);
    setEarnedTitles(nextTitles);
    setJournalEntries(nextJournal);

    localStorage.setItem("nexus_party_matches", JSON.stringify(nextMatches));
    localStorage.setItem("nexus_earned_titles", JSON.stringify(nextTitles));
    localStorage.setItem("nexus_journal_entries", JSON.stringify(nextJournal));
    localStorage.setItem(`nexus_party_count_${currentUserName}`, String(nextCount));
  };

  if (!mounted || !user) return null;

  const totalCharacters = characterGrid.length;
  const latestNotices = notices.slice(0, 3);
  const isGuildMaster = /마스터|관리자|길드장/i.test(user.role || "");
  const averageDailyRate = totalCharacters > 0 ? Math.round(Object.values(progressMap).reduce((sum, item) => sum + item.dailyRate, 0) / totalCharacters) : 0;
  const averageWeeklyRate = totalCharacters > 0 ? Math.round(Object.values(progressMap).reduce((sum, item) => sum + item.weeklyRate, 0) / totalCharacters) : 0;
  const averageTradeRate = totalCharacters > 0 ? Math.round(Object.values(progressMap).reduce((sum, item) => sum + item.tradeRate, 0) / totalCharacters) : 0;
  const averagePurchaseRate = totalCharacters > 0 ? Math.round(Object.values(progressMap).reduce((sum, item) => sum + item.purchaseRate, 0) / totalCharacters) : 0;
  const overallCompletion = Math.round((averageDailyRate + averageWeeklyRate + averageTradeRate + averagePurchaseRate) / 4);

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-10">
      <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide"><span>🏰 Sanctuary Nexus</span></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-lg overflow-hidden border border-zinc-500">👦🏻</div>
          <div className="flex flex-col leading-tight"><span className="font-bold text-white text-sm">{user.nickname || "한설"}</span><span className="text-[10px] text-zinc-400">{user.role || "마스터"}</span></div>
          <button onClick={() => { localStorage.removeItem("nexus_user"); router.push("/login"); }} className="ml-2 border border-red-900/50 text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/20 transition">로그아웃</button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <header className="flex items-center gap-6 mb-8">
          <div className="w-36 h-36 bg-[#121212] border border-yellow-600/30 rounded-lg flex items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent"></div>
            <div className="z-10 text-white font-black border-2 border-white px-2 py-1 tracking-widest text-xs">Nexus</div>
          </div>
          <div>
            <h1 className="text-5xl font-serif font-black tracking-tight text-[#e6c788] drop-shadow-md">Sanctuary Nexus</h1>
            <p className="text-zinc-400 text-sm mt-2 tracking-wide">마비노기 모바일 <span className="text-zinc-600 mx-1">|</span> 데이안 서버 길드 매니저</p>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">총 캐릭터</p>
            <p className="mt-2 text-3xl font-black text-white">{totalCharacters}</p>
            <p className="mt-1 text-xs text-zinc-400">등록된 길드원 수</p>
          </div>
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">평균 일일</p>
            <p className="mt-2 text-3xl font-black text-amber-400">{averageDailyRate}%</p>
            <p className="mt-1 text-xs text-zinc-400">일일 컨텐츠 달성률</p>
          </div>
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">평균 주간</p>
            <p className="mt-2 text-3xl font-black text-blue-400">{averageWeeklyRate}%</p>
            <p className="mt-1 text-xs text-zinc-400">주간 컨텐츠 달성률</p>
          </div>
          <div className="rounded-xl border border-zinc-700/50 bg-[#252528] p-4 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">전체 진행도</p>
            <p className="mt-2 text-3xl font-black text-emerald-400">{overallCompletion}%</p>
            <p className="mt-1 text-xs text-zinc-400">교환 {tradeItemCount}개 · 구매 {purchaseItemCount}개</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4"><h2 className="text-white font-bold text-sm">🔥 체크 보드 (최대 6캐릭)</h2><span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">MAIN_BOARD</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characterGrid.slice(0, 6).map((char) => {
                    const progress = progressMap[char.id] || { dailyRate: 0, weeklyRate: 0, tradeRate: 0, purchaseRate: 0 };
                    return (
                      <div key={char.id} onClick={() => setSelectedChar(char)} className="bg-[#1c1c1e] border border-zinc-700/50 rounded-lg p-3 cursor-pointer hover:border-yellow-600/60 hover:bg-[#202023] transition shadow-md">
                        <div className="flex justify-between items-center border-b border-zinc-700/50 pb-2 mb-2.5">
                          <span className="font-bold text-white text-sm truncate">{char.name}</span><span className="text-xs text-zinc-400">{JOB_ICONS[char.job] || "🛡️"}</span>
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                          <div>
                            <div className="flex justify-between text-zinc-400 mb-0.5"><span>일일 컨텐츠</span><span className="text-zinc-300 font-mono">{progress.dailyRate}%</span></div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${progress.dailyRate}%` }}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-zinc-400 mb-0.5"><span>주간 컨텐츠</span><span className="text-zinc-300 font-mono">{progress.weeklyRate}%</span></div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${progress.weeklyRate}%` }}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-zinc-400 mb-0.5"><span>물물 교환</span><span className="text-zinc-300 font-mono">{progress.tradeRate}%</span></div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${progress.tradeRate}%` }}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-zinc-400 mb-0.5"><span>일일/주간 구매</span><span className="text-zinc-300 font-mono">{progress.purchaseRate}%</span></div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-purple-500 h-full" style={{ width: `${progress.purchaseRate}%` }}></div></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-[#252528] border border-yellow-600/20 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-2"><h2 className="text-[#e6c788] font-bold text-sm flex items-center gap-1.5">⚡ 올라운더 통합 진행률</h2><span className="text-[10px] text-zinc-500 font-mono">ALL-ROUNDER</span></div>
                <div className="w-full bg-[#1c1c1e] h-3 rounded-full overflow-hidden border border-zinc-700/50"><div className="bg-gradient-to-r from-yellow-600 to-amber-500 h-full" style={{ width: "70.5%" }}></div></div>
                <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-2"><span>길드원 중복제외 합산 목표</span><span className="text-white font-mono font-bold">850 / 1205 LV</span></div>
              </section>

              <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
                <h2 className="text-[#e6c788] font-bold text-sm mb-1">👑 길드원 종합 진행률</h2><p className="text-xs text-zinc-400 mb-4">[이번달 점수 랭킹]</p>
                <div className="space-y-3">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#1c1c1e] border border-zinc-700 rounded flex items-center justify-center text-xs font-bold text-[#e6c788]">{rank}</div><div className="w-8 h-8 rounded-full bg-zinc-600"></div>
                      <div className="flex-1"><div className="flex justify-between text-xs text-white mb-1"><span>{rank}위 유저</span></div><div className="w-full bg-[#1c1c1e] h-1.5 rounded-full overflow-hidden"><div className="bg-[#e6c788] h-full" style={{ width: `${100 - (rank * 15)}%` }}></div></div></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-white font-bold text-sm">⚔️ 파티 매칭 & 저널</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">활동이 많아질수록 칭호가 쌓입니다.</p>
                  </div>
                  <div className="rounded-lg border border-zinc-700 bg-[#1c1c1e] px-3 py-2 text-right">
                    <div className="text-[10px] text-zinc-500">이번달 참여</div>
                    <div className="text-sm font-black text-white">{partyJoinCount}회</div>
                  </div>
                </div>

                <div className="rounded-lg border border-yellow-700/30 bg-[#19191b] p-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-zinc-500">현재 칭호</p>
                      <p className="text-sm font-semibold text-[#e6c788]">{earnedTitles[0]?.name || "아직 없음"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">다음 목표</p>
                      <p className="text-xs text-zinc-300">{partyJoinCount >= 10 ? "모든 칭호 달성" : `파티 참여 ${Math.max(0, 3 - partyJoinCount)}회 더`}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-300">🎯 오늘의 목표</p>
                      <p className="text-xs text-zinc-400">{todayGoal}</p>
                    </div>
                    <button type="button" onClick={() => updateTodayGoal("파티 2회 참여하기")} className="rounded bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-700">바로 바꾸기</button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {partyMatches.map((match) => (
                    <div key={match.id} className="rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{match.title}</p>
                          <p className="text-[11px] text-zinc-400 mt-1">{match.description}</p>
                          <p className="text-[10px] text-zinc-500 mt-2">파티장 {match.leader} · {match.members.length}/{match.maxMembers}명 · 필요 역할 {match.requiredRole}</p>
                        </div>
                        <button type="button" onClick={() => joinParty(match.id)} className="text-[11px] rounded bg-yellow-600 px-2.5 py-1 font-semibold text-white hover:bg-yellow-500">참여</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-zinc-300">🏅 칭호 목록</p>
                    <span className="text-[10px] text-zinc-500">{earnedTitles.length}/{TITLE_DEFINITIONS.length} 획득</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TITLE_DEFINITIONS.map((title) => {
                      const unlocked = earnedTitles.some((entry) => entry.id === title.id);
                      return (
                        <button key={title.id} type="button" onClick={() => setSelectedTitle(earnedTitles.find((entry) => entry.id === title.id) || null)} className={`rounded-full px-2.5 py-1 text-[11px] ${unlocked ? "bg-yellow-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                      {title.name}
                    </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                  <p className="text-[11px] font-semibold text-zinc-300 mb-2">📒 넥서스 저널</p>
                  <div className="space-y-2">
                    {journalEntries.length > 0 ? journalEntries.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-zinc-800 bg-[#171719] p-2 text-[11px] text-zinc-300">
                        <div className="flex items-center justify-between gap-2">
                          <span>{entry.message}</span>
                          <span className="text-[10px] text-zinc-500">{entry.createdAt}</span>
                        </div>
                      </div>
                    )) : <p className="text-[11px] text-zinc-500">아직 기록이 없습니다.</p>}
                  </div>
                </div>
              </section>

              <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-sm">📢 공지사항</h2>
                  <span className="text-[10px] text-zinc-500">{notices.length}개</span>
                </div>
                <form onSubmit={addNotice} className="mb-3 space-y-2 rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                  <input value={newNotice.title} onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))} placeholder="제목" className="w-full rounded border border-zinc-700 bg-[#121212] p-2 text-sm text-white" />
                  <textarea value={newNotice.content} onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))} placeholder="내용" className="w-full rounded border border-zinc-700 bg-[#121212] p-2 text-sm text-white" rows={2} />
                  <button type="submit" className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">공지 등록</button>
                </form>
                <div className="space-y-2">
                  {latestNotices.map((notice) => (
                    <div key={notice.id} className="rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{notice.title}</p>
                        <span className="text-[10px] text-zinc-500">{notice.createdAt}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">{notice.content}</p>
                      <p className="mt-2 text-[10px] text-zinc-500">작성자 {notice.author}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#252528] border border-zinc-700/50 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-sm">📝 불만/건의</h2>
                  <span className="text-[10px] text-zinc-500">{complaints.length}개</span>
                </div>
                <form onSubmit={addComplaint} className="mb-3 space-y-2 rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3">
                  <textarea value={newComplaint} onChange={(e) => setNewComplaint(e.target.value)} placeholder="불만이나 건의 내용을 적어주세요." className="w-full rounded border border-zinc-700 bg-[#121212] p-2 text-sm text-white" rows={2} />
                  <button type="submit" className="w-full rounded bg-violet-600 px-3 py-2 text-sm font-semibold text-white">의견 등록</button>
                </form>
                <div className="space-y-2">
                  {complaints.map((item) => (
                    <button key={item.id} type="button" onClick={() => isGuildMaster && setSelectedComplaint(item)} className="w-full rounded-lg border border-zinc-700 bg-[#1c1c1e] p-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-zinc-200">{item.content}</p>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{item.status}</span>
                      </div>
                      <p className="mt-2 text-[10px] text-zinc-500">{item.author} · {item.createdAt}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
      </div>

      {selectedChar && <CharacterModal char={selectedChar} onClose={() => setSelectedChar(null)} userRole={user.role} />}
      <TitleDetailModal title={selectedTitle} onClose={() => setSelectedTitle(null)} />
      <ComplaintModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-select {
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat, repeat;
          background-position: right .7em top 50%, 0 0;
          background-size: .65em auto, 100%;
        }
      `}} />
    </main>
  );
}