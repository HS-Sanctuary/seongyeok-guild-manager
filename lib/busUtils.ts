import { supabase } from "@/lib/supabase";
import { memberMutation } from "@/lib/memberMutationClient";
import { NexusContent, ContentPowerReq, NexusClassItem } from "@/components/party/types";
import { setTaskChecked } from '@/lib/matchingUtils';
import {resolvePartyRole,parsePartyStat} from '@/lib/partyRosterValues';

// 🎯 ts(2459) 에러 차단 및 외부 사용을 위한 Re-export 선언
export type { NexusContent, ContentPowerReq, NexusClassItem };

export type JobRole = "근딜" | "원딜" | "힐러" | "탱커" | "서포터";

export interface CharacterCandidate {
  id?: number;
  name?: string;
  character_id?: number;
  character_name?: string;
  job: string;
  combat_power: number;
  magic_resistance?: number;
  owner_account?: string;
  owner?: string;
  raid_checks?: Record<string, boolean>;
  daily_checks?: Record<string, boolean>;
  weekly_checks?: Record<string, boolean>;
}

export interface BusCandidate {
  character_id?: number;
  character_name: string;
  owner_account?: string;
  job: string;
  combat_power: number;
  magic_resistance?: number;
  allow_repeat?: boolean;
  is_completed?: boolean;
  time_start?: string;
  time_end?: string;
  raid_checks?: Record<string, boolean>;
  selection_order?: number;
}

export interface BusMember {
  character_id: number;
  character_name: string;
  job: string;
  role: JobRole;
  combat_power: number;
  magic_resistance: number;
  owner_account: string;
  is_driver?: boolean;
  is_passenger?: boolean;
}

export interface AssemblePartyResult {
  selected: BusMember[];
  remaining: BusCandidate[];
  hasHealer: boolean;
  hasTanker: boolean;
}

export interface StatValidationResult {
  isMinPassed: boolean;
  isRecPassed: boolean;
  isOpPassed: boolean;
  cpDeficit: number;
  mrDeficit: number;
  badgeLabel: string;
  badgeColorClass: string;
}

export interface AbyssDungeonInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  keywords: string[];
}

// 🌐 [Single Source of Truth] nexus_classes 전역 캐시 인스턴스
let nexusClassesCache: NexusClassItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5분 캐시 타임아웃

/**
 * 🎯 Supabase `nexus_classes` DB에서 전체 활성 클래스 목록 동적 수집 (인메모리 캐싱 지원)
 */
export async function fetchNexusClasses(forceRefresh: boolean = false): Promise<NexusClassItem[]> {
  const now = Date.now();
  if (!forceRefresh && nexusClassesCache && now - lastFetchTime < CACHE_TTL_MS) {
    return nexusClassesCache;
  }

  try {
    const { data, error } = await supabase
      .from("nexus_classes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("nexus_classes DB 조회 실패:", error);
      return nexusClassesCache || [];
    }

    if (data) {
      nexusClassesCache = data as NexusClassItem[];
      lastFetchTime = now;
      return nexusClassesCache;
    }
  } catch (err) {
    console.error("fetchNexusClasses 예외 발생:", err);
  }

  return nexusClassesCache || [];
}

/**
 * 🎯 DB 카탈로그(`nexus_contents`) 기반 동적 어비스 던전 매핑 리스트 추출
 */
export function getAbyssSubDungeonsFromCatalog(contentsCatalog?: NexusContent[]): AbyssDungeonInfo[] {
  if (!contentsCatalog || contentsCatalog.length === 0) {
    return [
      { id: "abyss_1", code: "abyss_1", name: "허상의 정박지", shortName: "허상", keywords: ["abyss_1", "허상의 정박지", "허상", "정박지"] },
      { id: "abyss_2", code: "abyss_2", name: "광기의 동굴", shortName: "동굴", keywords: ["abyss_2", "광기의 동굴", "광기", "동굴"] },
      { id: "abyss_3", code: "abyss_3", name: "흩어진 물길", shortName: "물길", keywords: ["abyss_3", "흩어진 물길", "흩어진", "물길"] },
    ];
  }

  const abyssList = contentsCatalog.filter((c) => c.type === "abyss" && c.is_active && !c.is_weekend);

  return abyssList.map((c, index) => {
    const code = c.code || `abyss_${index + 1}`;
    
    // 🎯 '1던전 (허상의 정박지)' 형태나 괄호를 DB 정제하여 '허상의 정박지'만 자동 추출
    const cleanName = c.name
      .replace(/^어비스\s*-\s*/, "")
      .replace(/^\d+던전\s*/, "")
      .replace(/[\(\)]/g, "")
      .trim();

    const shortName = c.short_name || cleanName.slice(0, 2);

    return {
      id: code,
      code: code,
      name: cleanName,
      shortName: shortName,
      keywords: [code, c.name, cleanName, shortName].filter(Boolean),
    };
  });
}

/**
 * 🎯 난이도 표기 숏네임 변환 유틸
 */
export function getShortDifficulty(diff?: string): string {
  if (!diff) return "";
  const trimmed = diff.trim();
  if (trimmed === "어려움") return "어렴";
  if (trimmed === "매우 어려움" || trimmed === "매우어려움") return "매어";
  return trimmed;
}

/**
 * 🎯 PostgreSQL 배열("{a,b}"), JSON 배열("['a','b']"), 쉼표 구분자 방어 추출기
 */
export function extractSubContentKeys(rawSub: any): string[] {
  if (!rawSub) return [];

  let items: string[] = [];

  if (Array.isArray(rawSub)) {
    items = rawSub.map(String);
  } else if (typeof rawSub === "string") {
    const trimmed = rawSub.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) items = parsed.map(String);
      } catch {
        items = trimmed.replace(/^\[|\]$/g, "").split(",");
      }
    } else if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      items = trimmed
        .replace(/^\{|\}$/g, "")
        .split(",")
        .map((s) => s.replace(/^["']|["']$/g, "").trim());
    } else {
      items = trimmed.split(",").map((s) => s.trim());
    }
  }

  return items
    .map((s) => s.replace(/[\{\}\[\]"']/g, "").trim())
    .filter(Boolean);
}

/**
 * 🎯 어비스 중앙 100% DB 동적 분석 파서 (부분 선택 무조건 완벽 지원)
 */
export function parseAbyssInfo(partyOrContent: any, subContentsOverride?: any, contentsCatalog?: NexusContent[]) {
  if (!partyOrContent) {
    return {
      isAbyss: false,
      title: "",
      selectedDungeons: [] as AbyssDungeonInfo[],
      isPartial: false,
    };
  }

  const contentName = partyOrContent.content_name || partyOrContent.name || "";
  const partyType = partyOrContent.party_type || partyOrContent.category || "";
  const subContentMemo = partyOrContent.sub_content || partyOrContent.memo || "";

  const isAbyss =
    partyType === "어비스" ||
    contentName.includes("어비스") ||
    subContentMemo.includes("어비스");

  if (!isAbyss) {
    return {
      isAbyss: false,
      title: contentName.replace(/^(레이드|어비스)\s*-\s*/, "").replace(/\s*\(통합\)/g, "").trim(),
      selectedDungeons: [] as AbyssDungeonInfo[],
      isPartial: false,
    };
  }

  const abyssDungeons = getAbyssSubDungeonsFromCatalog(contentsCatalog);
  const rawSub = subContentsOverride ?? partyOrContent.selected_sub_contents ?? partyOrContent.sub_contents ?? null;
  const keys = extractSubContentKeys(rawSub);

  // 🎯 던전 ID, 코드, 던전명, 숏네임, 키워드 완벽 매칭 로직
  let matchedDungeons = abyssDungeons.filter((dungeon) =>
    keys.some((k) => {
      const targetKey = k.toLowerCase().trim();
      return (
        dungeon.id.toLowerCase() === targetKey ||
        dungeon.code.toLowerCase() === targetKey ||
        dungeon.name.toLowerCase() === targetKey ||
        dungeon.shortName.toLowerCase() === targetKey ||
        dungeon.keywords.some((kw) => kw.toLowerCase() === targetKey)
      );
    })
  );

  // 1. 선택된 키 배열 기반 정밀 파싱
  if (matchedDungeons.length > 0) {
    if (matchedDungeons.length === abyssDungeons.length) {
      return {
        isAbyss: true,
        title: "어비스 ALL",
        selectedDungeons: abyssDungeons,
        isPartial: false,
      };
    }
    const shortNames = matchedDungeons.map((d) => d.shortName).join("/");
    return {
      isAbyss: true,
      title: `어비스 ${shortNames}`,
      selectedDungeons: matchedDungeons,
      isPartial: true,
    };
  }

  // 2. DB 키가 없을 경우 메모 스캔
  if (keys.length === 0 && subContentMemo) {
    matchedDungeons = abyssDungeons.filter((dungeon) =>
      dungeon.keywords.some((kw) => subContentMemo.includes(kw))
    );
    if (matchedDungeons.length > 0 && matchedDungeons.length < abyssDungeons.length) {
      const shortNames = matchedDungeons.map((d) => d.shortName).join("/");
      return {
        isAbyss: true,
        title: `어비스 ${shortNames}`,
        selectedDungeons: matchedDungeons,
        isPartial: true,
      };
    }
  }

  // 3. 기본값 (전체 선택)
  return {
    isAbyss: true,
    title: "어비스 ALL",
    selectedDungeons: abyssDungeons,
    isPartial: false,
  };
}

/**
 * 🎯 어비스 자동 기본 파티 메모 생성기 (DB 카탈로그 명칭 동적 매핑)
 */
export function generateAbyssDefaultMemo(
  selectedSubContents: string[],
  difficulty?: string,
  contentsCatalog?: NexusContent[]
): string {
  const keys = extractSubContentKeys(selectedSubContents);
  const shortDiff = getShortDifficulty(difficulty);
  const diffSuffix = shortDiff ? ` ${shortDiff}` : "";

  const abyssDungeons = getAbyssSubDungeonsFromCatalog(contentsCatalog);

  const matchedNames = keys
    .map((key) => {
      const targetKey = key.toLowerCase().trim();
      const found = abyssDungeons.find(
        (d) =>
          d.id.toLowerCase() === targetKey ||
          d.code.toLowerCase() === targetKey ||
          d.name.toLowerCase() === targetKey ||
          d.keywords.some((kw) => kw.toLowerCase() === targetKey)
      );
      return found ? found.name : key;
    })
    .filter((v, i, a) => v && a.indexOf(v) === i);

  if (matchedNames.length >= abyssDungeons.length || matchedNames.length === 0) {
    return `어비스 ${abyssDungeons.length}종${diffSuffix} 가실분~`;
  }
  if (matchedNames.length === 1) {
    return `어비스 ${matchedNames[0]}${diffSuffix} 가실분~`;
  }
  if (matchedNames.length === 2) {
    return `어비스 ${matchedNames[0]}, ${matchedNames[1]}${diffSuffix} 가실분~`;
  }
  return `어비스 ${abyssDungeons.length}종${diffSuffix} 가실분~`;
}

export function formatAbyssBadgeText(contentName: string, subContents?: any, contentsCatalog?: NexusContent[]): string {
  if (!contentName) return "";
  const parsed = parseAbyssInfo({ content_name: contentName }, subContents, contentsCatalog);
  return parsed.title;
}

/**
 * 🎯 100% DB(`nexus_classes`) 기반 동적 역할군 조회 함수 (Single Source of Truth)
 */
export function getRoleByJob(jobName: string, classCatalog?: NexusClassItem[]): JobRole {
  return resolvePartyRole(jobName,(classCatalog && classCatalog.length>0) ? classCatalog : nexusClassesCache ?? undefined);
}

export const getJobRole = getRoleByJob;

export function findPartyPowerReq(reqs: ContentPowerReq[], contentName: string, difficulty: string): ContentPowerReq | null {
  const normalize = (name: string) => (name || '').replace(/^(레이드|어비스)\s*-\s*/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
  const type = /^레이드\s*-/.test(contentName) ? 'raid' : /^어비스\s*-/.test(contentName) ? 'abyss' : null;
  return reqs.find(req => (!type || req.content_type === type) && normalize(req.content_name) === normalize(contentName) && req.difficulty.replace(/\s+/g, '') === difficulty.replace(/\s+/g, '')) ?? null;
}

export function parseCP(val: any): number {
  return parsePartyStat(val);
}

export function getShortNickname(name: string, maxLength: number = 6): string {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength);
}

export function validateStatRequirement(
  cp: number,
  mr: number,
  req?: ContentPowerReq | any
): StatValidationResult {
  if (!req) {
    return {
      isMinPassed: true,
      isRecPassed: true,
      isOpPassed: false,
      cpDeficit: 0,
      mrDeficit: 0,
      badgeLabel: "기준 미지정",
      badgeColorClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };
  }

  const minCp = req.min_cp ?? req.min ?? 0;
  const recCp = req.rec_cp ?? req.rec ?? 0;
  const opCp = req.op_cp ?? req.op ?? 0;
  const recMr = req.rec_mr ?? 0;
  const opMr = req.op_mr ?? 0;

  const isMinPassed = cp >= minCp;
  const isRecPassed = cp >= recCp && mr >= recMr;
  const isOpPassed = (opCp > 0 || opMr > 0) && cp >= opCp && mr >= opMr;

  const cpDeficit = Math.max(0, recCp - cp);
  const mrDeficit = Math.max(0, recMr - mr);

  let badgeLabel = "미달";
  let badgeColorClass = "bg-rose-950/60 text-rose-400 border-rose-800/50";

  if (isOpPassed) {
    badgeLabel = "⚡ 압도 (기사/버스기사 가능)";
    badgeColorClass = "bg-purple-950/60 text-purple-300 border-purple-700/60 font-bold shadow-sm";
  } else if (isRecPassed) {
    badgeLabel = "✅ 권장 충족";
    badgeColorClass = "bg-emerald-950/60 text-emerald-300 border-emerald-700/60 font-bold";
  } else if (isMinPassed) {
    badgeLabel = "⚠️ 최소 충족 (조율 필요)";
    badgeColorClass = "bg-amber-950/60 text-amber-300 border-amber-700/60";
  }

  return {
    isMinPassed,
    isRecPassed,
    isOpPassed,
    cpDeficit,
    mrDeficit,
    badgeLabel,
    badgeColorClass,
  };
}

export function assembleBalancedParty(
  candidates: BusCandidate[],
  maxPartySizeOrReq?: number | ContentPowerReq | any,
  reqOrTargetKey?: any,
  targetContentKeyOrSize?: any,
  classCatalog?: NexusClassItem[]
): AssemblePartyResult {
  if (!candidates || candidates.length === 0) {
    return {
      selected: [],
      remaining: [],
      hasHealer: false,
      hasTanker: false,
    };
  }

  let maxPartySize = 4;
  let req: any = null;
  let targetContentKey: string | undefined = undefined;

  if (typeof maxPartySizeOrReq === "number") {
    maxPartySize = maxPartySizeOrReq;
    req = reqOrTargetKey;
    if (typeof targetContentKeyOrSize === "string") {
      targetContentKey = targetContentKeyOrSize;
    }
  } else {
    req = maxPartySizeOrReq;
    if (typeof reqOrTargetKey === "string") {
      targetContentKey = reqOrTargetKey;
    }
    if (typeof targetContentKeyOrSize === "number") {
      maxPartySize = targetContentKeyOrSize;
    }
  }

  const sortedCandidates = candidates.filter(c => !c.is_completed || c.allow_repeat).sort((a, b) => {
    const aCleared = !!a.is_completed || (targetContentKey ? !!a.raid_checks?.[targetContentKey] : false);
    const bCleared = !!b.is_completed || (targetContentKey ? !!b.raid_checks?.[targetContentKey] : false);

    if (aCleared !== bCleared) return aCleared ? 1 : -1;
    if (a.selection_order != null && b.selection_order != null) return a.selection_order - b.selection_order;
    const aCp = parseCP(a.combat_power);
    const bCp = parseCP(b.combat_power);
    return bCp - aCp;
  });
  const tierOf = (candidate: BusCandidate) => {
    if (!req) return 1;
    const result = validateStatRequirement(parseCP(candidate.combat_power), parseCP(candidate.magic_resistance || 0), req);
    return result.isOpPassed ? 0 : result.isRecPassed ? 1 : 2;
  };
  // One choice per account. Keep the best roster for each tier/role combination,
  // so reserving a healer cannot accidentally consume every passenger seat.
  type Roster = { entries: BusCandidate[]; tiers: number[]; roles: number; cost: number };
  const accounts = new Map<string, BusCandidate[]>();
  const ranks = new Map(sortedCandidates.map((c, i) => [c, i]));
  for (const c of sortedCandidates) {
    const key = c.owner_account || c.character_name;
    accounts.set(key, [...(accounts.get(key) || []), c]);
  }
  let states = new Map<string, Roster>([["0,0,0:0", {entries: [], tiers: [0,0,0], roles: 0, cost: 0}]]);
  for (const choices of accounts.values()) {
    const next = new Map(states);
    for (const roster of states.values()) {
      if (roster.entries.length >= maxPartySize) continue;
      for (const c of choices) {
        const tiers = [...roster.tiers];
        tiers[tierOf(c)]++;
        const role = getRoleByJob(c.job, classCatalog);
        const roles = roster.roles | (role === '힐러' ? 1 : role === '탱커' ? 2 : 0);
        const cost = roster.cost + (c.is_completed ? 10000 : 0) + ranks.get(c)!;
        const key = `${tiers.join(',')}:${roles}`;
        if (!next.has(key) || cost < next.get(key)!.cost) {
          next.set(key, {entries: [...roster.entries, c], tiers, roles, cost});
        }
      }
    }
    states = next;
  }
  const distance = (value: number, low: number, high: number) => Math.max(low-value, 0, value-high);
  const balancePenalty = (roster: Roster) => !req ? 0 : maxPartySize >= 8
    ? distance(roster.tiers[0], 3, 3) + distance(roster.tiers[1], 2, 3) + distance(roster.tiers[2], 2, 3)
    : roster.tiers.reduce((sum, count) => sum + distance(count, 1, 2), 0);
  const rolePenalty = (roster: Roster) => Number(!(roster.roles & 1)) + Number(!(roster.roles & 2));
  const best = [...states.values()].sort((a,b) =>
    b.entries.length-a.entries.length || balancePenalty(a)-balancePenalty(b) ||
    rolePenalty(a)-rolePenalty(b) || a.cost-b.cost
  )[0];
  const selectedMembers: BusMember[] = best.entries.map(c => ({
    character_id: c.character_id || 0, character_name: c.character_name,
    job: c.job, role: getRoleByJob(c.job, classCatalog),
    combat_power: parseCP(c.combat_power), magic_resistance: parseCP(c.magic_resistance),
    owner_account: c.owner_account || c.character_name,
    is_driver: tierOf(c) === 0, is_passenger: tierOf(c) !== 0,
  }));
  const remainingCandidates = sortedCandidates.filter(c => !best.entries.includes(c));

  const hasHealer = selectedMembers.some((m) => m.role === "힐러");
  const hasTanker = selectedMembers.some((m) => m.role === "탱커");

  return {
    selected: selectedMembers,
    remaining: remainingCandidates,
    hasHealer,
    hasTanker,
  };
}

export async function syncKronosChecklist(
  target: any,
  arg2?: string,
  arg3?: string | boolean,
  arg4?: string,
  partyId?: string | number
): Promise<boolean> {
  try {
    if (Array.isArray(target)) {
      const members = target;
      const contentName = typeof arg3 === "string" ? arg3 : typeof arg2 === "string" ? arg2 : "";
      if (!contentName) return false;

      if (!partyId) return false;
      const response = await fetch("/api/parties/sync-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, completedNames: members.map((member: any) => member.character_name || member.name) }),
      });
      return response.ok;
    }

    const characterId = Number(target);
    const contentKey = String(arg2);
    const isCleared = typeof arg3 === "boolean" ? arg3 : true;

    if (!characterId) return false;

    const { data: charData, error: fetchErr } = await supabase
      .from("characters")
      .select("raid_checks")
      .eq("id", characterId)
      .single();

    if (fetchErr || !charData) return false;

    const updatedChecks = setTaskChecked(charData.raid_checks, {name:contentKey}, isCleared);

    const { error: updateErr } = await memberMutation({ table: "characters", action: "update", filter: { column: "id", value: characterId }, payload: { raid_checks: updatedChecks } });

    return !updateErr;
  } catch (err) {
    console.error("syncKronosChecklist 예외:", err);
    return false;
  }
}
