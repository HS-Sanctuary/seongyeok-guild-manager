import { supabase } from "@/lib/supabase";

export type JobRole = "근딜" | "원딜" | "힐러" | "탱커" | "서포터";

export interface NexusClassItem {
  id: number;
  name: string;
  role: JobRole;
}

export interface ContentPowerReq {
  id?: number;
  content_id?: number;
  content_type?: string;
  content_name?: string;
  difficulty?: string;
  min_cp: number;
  rec_cp: number;
  op_cp: number;
  rec_mr?: number;
  op_mr?: number;
}

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

// 🎯 파티 밸런서 리턴 타입 인터페이스
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

// 🎯 어비스 던전 UID - 직관적 약어 매핑 카탈로그
export const ABYSS_KEY_MAP: Record<string, string> = {
  abyss_1: "허상",
  abyss_2: "동굴",
  abyss_3: "물길",
};

/**
 * 🎯 어비스 선택 던전에 따른 동적 약어 뱃지 텍스트 산출 유틸리티
 */
export function formatAbyssBadgeText(contentName: string, subContents?: any): string {
  if (!contentName) return "";
  const cleaned = contentName.replace(/^(레이드|어비스)\s*-\s*/, "").replace(/\s*\(통합\)/g, "").trim();

  if (!contentName.includes("어비스")) return cleaned;

  let keys: string[] = [];
  if (Array.isArray(subContents)) {
    keys = subContents;
  } else if (typeof subContents === "string") {
    try {
      const parsed = JSON.parse(subContents);
      if (Array.isArray(parsed)) keys = parsed;
      else keys = [subContents];
    } catch {
      keys = subContents.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  if (!keys || keys.length === 0) {
    return cleaned;
  }

  const totalAbyssKeys = Object.keys(ABYSS_KEY_MAP);
  const validKeys = keys.filter((k) => ABYSS_KEY_MAP[k]);

  if (validKeys.length === 0) return cleaned;

  if (validKeys.length >= totalAbyssKeys.length) {
    return "어비스 ALL";
  }

  const labels = validKeys.map((k) => ABYSS_KEY_MAP[k]);
  return `어비스 ${labels.join("/")}`;
}

// 비상용 백업 (Fallback) 21개 직업 역할군 맵
export const JOB_ROLE_MAP: Record<string, JobRole> = {
  도적: "근딜",
  댄서: "근딜",
  듀얼블레이드: "근딜",
  대검전사: "근딜",
  검술사: "근딜",
  격투가: "근딜",

  궁수: "원딜",
  악사: "원딜",
  석궁사수: "원딜",
  마법사: "원딜",
  화염술사: "원딜",
  전격술사: "원딜",
  장궁병: "원딜",
  암흑술사: "원딜",

  힐러: "힐러",
  수도사: "힐러",
  사제: "힐러",

  전사: "탱커",
  기사: "탱커",
  빙결술사: "탱커",

  음유시인: "서포터",
};

// static 요구스탯 컷 매핑 백업
export const CONTENT_CP_REQUIREMENTS: Record<string, Record<string, { min: number; rec: number; op: number; rec_mr?: number; op_mr?: number }>> = {
  "레이드 - 카브락": {
    "입문": { min: 65000, rec: 72000, op: 82500, rec_mr: 0, op_mr: 0 },
    "어려움": { min: 90000, rec: 95000, op: 109000, rec_mr: 0, op_mr: 0 },
  },
  "레이드 - 에이렐": {
    "어려움": { min: 43500, rec: 50000, op: 57500, rec_mr: 0, op_mr: 0 },
  },
  "레이드 - 화이트 서큐버스": {
    "어려움": { min: 0, rec: 27000, op: 31100, rec_mr: 0, op_mr: 0 },
    "매우 어려움": { min: 50000, rec: 57500, op: 64000, rec_mr: 0, op_mr: 0 },
  },
  "어비스 - 허상의 정박지": {
    "입문": { min: 50000, rec: 56000, op: 64500, rec_mr: 0, op_mr: 0 },
    "어려움": { min: 63000, rec: 66000, op: 75000, rec_mr: 0, op_mr: 0 },
    "매우 어려움": { min: 76000, rec: 80000, op: 92000, rec_mr: 0, op_mr: 0 },
    "지옥1": { min: 87500, rec: 92000, op: 105000, rec_mr: 0, op_mr: 0 },
    "지옥2": { min: 95000, rec: 100000, op: 115000, rec_mr: 0, op_mr: 0 },
  }
};

export function parseCP(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function getRoleByJob(jobName: string, classCatalog?: NexusClassItem[]): JobRole {
  if (classCatalog && classCatalog.length > 0) {
    const found = classCatalog.find((c) => c.name === jobName);
    if (found && found.role) {
      return found.role;
    }
  }
  return JOB_ROLE_MAP[jobName] || "근딜";
}

export const getJobRole = getRoleByJob;

export function getShortNickname(name: string, maxLength: number = 6): string {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength);
}

export function validateStatRequirement(
  cp: number,
  mr: number,
  req?: any
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

/**
 * 🎯 스마트 파티 밸런서 (AssemblePartyResult 구조체 정확히 반환)
 */
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

  if (typeof maxPartySizeOrReq === 'number') {
    maxPartySize = maxPartySizeOrReq;
    req = reqOrTargetKey;
    if (typeof targetContentKeyOrSize === 'string') {
      targetContentKey = targetContentKeyOrSize;
    }
  } else {
    req = maxPartySizeOrReq;
    if (typeof reqOrTargetKey === 'string') {
      targetContentKey = reqOrTargetKey;
    }
    if (typeof targetContentKeyOrSize === 'number') {
      maxPartySize = targetContentKeyOrSize;
    }
  }

  // 1. 이미 완료한 캐릭터 제외 및 미완료 우선 정렬
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

  // Step 1. 버스 기사 (압도 스탯 보유자) 우선 1선발
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

  // Step 2. 힐러 포지션 1선발
  const healerCandidate = filteredCandidates.find(
    (c) => getRoleByJob(c.job, classCatalog) === "힐러" && !usedAccounts.has(c.owner_account || c.character_name)
  );
  if (healerCandidate) {
    tryAddCandidate(healerCandidate, false);
  }

  // Step 3. 탱커 포지션 1선발
  const tankerCandidate = filteredCandidates.find(
    (c) => getRoleByJob(c.job, classCatalog) === "탱커" && !usedAccounts.has(c.owner_account || c.character_name)
  );
  if (tankerCandidate) {
    tryAddCandidate(tankerCandidate, false);
  }

  // Step 4. 나머지 슬롯 전투력 순 채우기
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
      const contentName = typeof arg3 === 'string' ? arg3 : (typeof arg2 === 'string' ? arg2 : '');
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
    const isCleared = typeof arg3 === 'boolean' ? arg3 : true;

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