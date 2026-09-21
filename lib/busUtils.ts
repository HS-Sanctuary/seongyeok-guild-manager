import { supabase } from "@/lib/supabase";
import { NexusContent, ContentPowerReq, NexusClassItem } from "@/components/party/types";

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
 * 🎯 100% DB(`nexus_classes`) 기반 동적 역할군 조회 함수
 */
export function getRoleByJob(jobName: string, classCatalog?: NexusClassItem[]): JobRole {
  if (!jobName) return "근딜";
  const j = jobName.trim();

  if (classCatalog && classCatalog.length > 0) {
    const found = classCatalog.find((c) => c.name === j);
    if (found && found.role) {
      return found.role;
    }
  }

  // Fallback 키워드 매칭
  if (["빙결술사", "빙결", "대검전사", "기사", "전사", "성기사", "수호자"].some((k) => j.includes(k))) return "탱커";
  if (["사제", "수도사", "힐러", "성직자", "구원자"].some((k) => j.includes(k))) return "힐러";
  if (["음유시인", "바드", "서포터"].some((k) => j.includes(k))) return "서포터";
  if (["궁수", "석궁사수", "마법사", "화염술사", "전격술사", "장궁병", "악사", "암흑술사"].some((k) => j.includes(k))) return "원딜";

  return "근딜";
}

export const getJobRole = getRoleByJob;

export function parseCP(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, "").trim();
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
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
  const isOpPassed = cp >= opCp && mr >= opMr;

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

  const filteredCandidates = [...candidates].sort((a, b) => {
    const aCleared = targetContentKey ? !!a.raid_checks?.[targetContentKey] : false;
    const bCleared = targetContentKey ? !!b.raid_checks?.[targetContentKey] : false;

    if (aCleared !== bCleared) return aCleared ? 1 : -1;
    const aCp = parseCP(a.combat_power);
    const bCp = parseCP(b.combat_power);
    return bCp - aCp;
  });

  const selectedMembers: BusMember[] = [];
  const usedAccounts = new Set<string>();

  const tryAddCandidate = (cand: BusCandidate, isDriver: boolean = false): boolean => {
    const ownerAcc = cand.owner_account || cand.character_name;
    if (ownerAcc && usedAccounts.has(ownerAcc)) return false;
    if (selectedMembers.length >= maxPartySize) return false;

    const job = cand.job || "전사";
    const role = getRoleByJob(job, classCatalog);
    const charName = cand.character_name || "";
    const charId = cand.character_id || 0;
    const cp = parseCP(cand.combat_power);
    const mr = parseCP(cand.magic_resistance || 0);

    selectedMembers.push({
      character_id: charId,
      character_name: charName,
      job,
      role,
      combat_power: cp,
      magic_resistance: mr,
      owner_account: ownerAcc,
      is_driver: isDriver,
      is_passenger: !isDriver,
    });
    if (ownerAcc) usedAccounts.add(ownerAcc);
    return true;
  };

  if (req && (req.op_cp || req.op)) {
    const driverCandidate = filteredCandidates.find((c) => {
      const cp = parseCP(c.combat_power);
      const mr = parseCP(c.magic_resistance || 0);
      const val = validateStatRequirement(cp, mr, req);
      return val.isOpPassed;
    });
    if (driverCandidate) {
      tryAddCandidate(driverCandidate, true);
    }
  }

  const healerCandidate = filteredCandidates.find(
    (c) => getRoleByJob(c.job, classCatalog) === "힐러" && !usedAccounts.has(c.owner_account || c.character_name)
  );
  if (healerCandidate) {
    tryAddCandidate(healerCandidate, false);
  }

  const tankerCandidate = filteredCandidates.find(
    (c) => getRoleByJob(c.job, classCatalog) === "탱커" && !usedAccounts.has(c.owner_account || c.character_name)
  );
  if (tankerCandidate) {
    tryAddCandidate(tankerCandidate, false);
  }

  for (const cand of filteredCandidates) {
    if (selectedMembers.length >= maxPartySize) break;
    tryAddCandidate(cand, false);
  }

  const remainingCandidates = filteredCandidates.filter(
    (c) => !selectedMembers.some((m) => m.character_name === c.character_name)
  );

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
  arg4?: string
): Promise<boolean> {
  try {
    if (Array.isArray(target)) {
      const members = target;
      const contentName = typeof arg3 === "string" ? arg3 : typeof arg2 === "string" ? arg2 : "";
      if (!contentName) return false;

      const updatePromises = members.map(async (m: any) => {
        const charId = m.character_id || m.id;
        if (!charId) return;

        const { data: charData } = await supabase
          .from("characters")
          .select("raid_checks")
          .eq("id", charId)
          .single();

        const currentChecks = charData?.raid_checks || {};
        const updatedChecks = {
          ...currentChecks,
          [contentName]: true,
        };

        await supabase
          .from("characters")
          .update({ raid_checks: updatedChecks })
          .eq("id", charId);
      });

      await Promise.all(updatePromises);
      return true;
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

    const currentChecks = charData.raid_checks || {};
    const updatedChecks = {
      ...currentChecks,
      [contentKey]: isCleared,
    };

    const { error: updateErr } = await supabase
      .from("characters")
      .update({ raid_checks: updatedChecks })
      .eq("id", characterId);

    return !updateErr;
  } catch (err) {
    console.error("syncKronosChecklist 예외:", err);
    return false;
  }
}