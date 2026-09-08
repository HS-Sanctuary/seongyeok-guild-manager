import { supabase } from "@/lib/supabase";
import { CONTENT_DB } from "@/components/party/types";

// 21개 직업군 5대 포지션 1:1 매핑
export const JOB_ROLE_MAP: Record<string, "근딜" | "원딜" | "힐러" | "탱커" | "서포터"> = {
  // 근딜 (6종)
  '도적': '근딜', '댄서': '근딜', '듀얼블레이드': '근딜', '대검전사': '근딜', '검술사': '근딜', '격투가': '근딜',
  // 원딜 (8종)
  '궁수': '원딜', '악사': '원딜', '석궁사수': '원딜', '마법사': '원딜', '화염술사': '원딜', '전격술사': '원딜', '장궁병': '원딜', '암흑술사': '원딜',
  // 힐러 (3종)
  '힐러': '힐러', '수도사': '힐러', '사제': '힐러',
  // 탱커 (3종)
  '전사': '탱커', '기사': '탱커', '빙결술사': '탱커',
  // 서포터 (1종)
  '음유시인': '서포터',
};

export function getRoleByJob(jobName: string): "근딜" | "원딜" | "힐러" | "탱커" | "서포터" {
  return JOB_ROLE_MAP[jobName] || "근딜";
}

/**
 * 전역 닉네임 애칭 규격: 최대 3글자로 트렁케이트
 */
export function getShortNickname(name: string): string {
  if (!name) return "";
  return name.length > 3 ? name.slice(0, 3) : name;
}

// 전투력 안전 파싱 함수 (문자열 결합 버그 방지)
export function parseCP(cp: any): number {
  if (typeof cp === "number") return isNaN(cp) ? 0 : cp;
  if (!cp) return 0;
  const clean = String(cp).replace(/,/g, "").trim();
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// KRONOS UI 연동용 키 정규화 매퍼
export function normalizeContentKeyForKronos(contentName: string): string {
  if (!contentName) return "";
  if (contentName.includes("카브락") || contentName.includes("카브")) return "카브";
  if (contentName.includes("에이렐") || contentName.includes("에렐")) return "에렐";
  if (contentName.includes("화이트 서큐버스") || contentName.includes("서큐")) return "서큐";
  if (contentName.includes("어비스")) return "어비스";
  return contentName;
}

// 컨텐츠별 전투력 기준표 (풀네임 / 단축명 모두 대응)
export const CONTENT_CP_REQUIREMENTS: Record<string, Record<string, { min: number; rec: number; op: number }>> = {
  "카브락": {
    "입문": { min: 65000, rec: 72000, op: 82500 },
    "어려움": { min: 90000, rec: 95000, op: 109000 },
  },
  "레이드 - 카브락": {
    "입문": { min: 65000, rec: 72000, op: 82500 },
    "어려움": { min: 90000, rec: 95000, op: 109000 },
  },
  "에이렐": {
    "어려움": { min: 43500, rec: 50000, op: 57500 },
  },
  "레이드 - 에이렐": {
    "어려움": { min: 43500, rec: 50000, op: 57500 },
  },
  "화이트 서큐버스": {
    "어려움": { min: 0, rec: 27000, op: 31100 },
    "매우 어려움": { min: 50000, rec: 57500, op: 64000 },
  },
  "레이드 - 화이트 서큐버스": {
    "어려움": { min: 0, rec: 27000, op: 31100 },
    "매우 어려움": { min: 50000, rec: 57500, op: 64000 },
  },
  "어비스 3종 (통합)": {
    "입문": { min: 50000, rec: 56000, op: 64500 },
    "어려움": { min: 63000, rec: 66000, op: 75000 },
    "매우 어려움": { min: 76000, rec: 80000, op: 92000 },
    "지옥 1": { min: 87500, rec: 92000, op: 105000 },
    "지옥1": { min: 87500, rec: 92000, op: 105000 },
    "지옥 2": { min: 95000, rec: 100000, op: 115000 },
    "지옥2": { min: 95000, rec: 100000, op: 115000 },
  },
};

export interface BusCandidate {
  character_name: string;
  owner_account: string;
  job: string;
  combat_power: number;
  allow_repeat?: boolean;
  is_completed?: boolean;
  time_start?: string;
  time_end?: string;
}

/**
 * 3단계 전투력 비율 & 역할군 자동 파티 밸런싱 알고리즘
 */
export function assembleBalancedParty(
  candidates: BusCandidate[],
  maxSize: number = 8,
  cpReqs?: { min: number; rec: number; op: number }
) {
  if (!candidates || candidates.length === 0) {
    return { selected: [], remaining: [], hasHealer: false, hasTanker: false };
  }

  let eligible = candidates.filter(c => !c.is_completed || c.allow_repeat);

  eligible.sort((a, b) => {
    if (!!a.is_completed !== !!b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    return parseCP(b.combat_power) - parseCP(a.combat_power);
  });

  const selected: BusCandidate[] = [];
  const selectedOwners = new Set<string>();

  const canAdd = (cand: BusCandidate) => {
    return !selectedOwners.has(cand.owner_account) && !selected.some(s => s.character_name === cand.character_name);
  };

  const addCandidate = (cand: BusCandidate) => {
    selected.push(cand);
    selectedOwners.add(cand.owner_account);
  };

  const healerIdx = eligible.findIndex(c => getRoleByJob(c.job) === "힐러" && canAdd(c));
  if (healerIdx !== -1) {
    addCandidate(eligible[healerIdx]);
  }

  const tankerIdx = eligible.findIndex(c => getRoleByJob(c.job) === "탱커" && canAdd(c));
  if (tankerIdx !== -1) {
    addCandidate(eligible[tankerIdx]);
  }

  const defaultOp = cpReqs?.op || 90000;
  const defaultRec = cpReqs?.rec || 70000;

  const opCandidates: BusCandidate[] = [];
  const recCandidates: BusCandidate[] = [];
  const minCandidates: BusCandidate[] = [];

  eligible.forEach(c => {
    if (selected.some(s => s.character_name === c.character_name)) return;

    const cp = parseCP(c.combat_power);
    if (cp >= defaultOp * 0.95) {
      opCandidates.push(c);
    } else if (cp >= defaultRec * 0.95) {
      recCandidates.push(c);
    } else {
      minCandidates.push(c);
    }
  });

  let neededOpSlots = Math.min(3, opCandidates.length);
  let neededRecSlots = Math.min(3, recCandidates.length);
  let neededMinSlots = Math.min(2, minCandidates.length);

  for (const c of opCandidates) {
    if (selected.length >= maxSize) break;
    if (neededOpSlots <= 0) break;
    if (canAdd(c)) {
      addCandidate(c);
      neededOpSlots--;
    }
  }

  for (const c of recCandidates) {
    if (selected.length >= maxSize) break;
    if (neededRecSlots <= 0) break;
    if (canAdd(c)) {
      addCandidate(c);
      neededRecSlots--;
    }
  }

  for (const c of minCandidates) {
    if (selected.length >= maxSize) break;
    if (neededMinSlots <= 0) break;
    if (canAdd(c)) {
      addCandidate(c);
      neededMinSlots--;
    }
  }

  for (const c of eligible) {
    if (selected.length >= maxSize) break;
    if (canAdd(c)) {
      addCandidate(c);
    }
  }

  const selectedNames = new Set(selected.map(s => s.character_name));
  const remaining = candidates.filter(c => !selectedNames.has(c.character_name));
  const hasHealer = selected.some(s => getRoleByJob(s.job) === "힐러");
  const hasTanker = selected.some(s => getRoleByJob(s.job) === "탱커");

  return { selected, remaining, hasHealer, hasTanker };
}

/**
 * KRONOS 숙제 자동 연동 (Supabase Direct Mutation)
 * 파티/버스 완료 시 해당 캐릭터의 raid_checks / abyss_checks에 던전 키 및 ID를 자동 체크함
 */
export async function syncKronosChecklist(characterNames: string[], contentType: string, contentName: string) {
  try {
    if (!characterNames || characterNames.length === 0) return true;
    const normalizedKey = normalizeContentKeyForKronos(contentName);

    const matchedContent = CONTENT_DB.find(
      (c) => c.name === contentName || contentName.includes(c.name) || c.name.includes(contentName)
    );
    const contentId = matchedContent ? matchedContent.id : null;

    let keysToAdd: (string | number)[] = [normalizedKey, contentId, contentName].filter(Boolean) as (string | number)[];

    if (contentName.includes("어비스 3종") || contentName.includes("통합") || contentId === "abyss_all") {
      keysToAdd = [...keysToAdd, "abyss_all", "abyss_1", "abyss_2", "abyss_3", "어비스", 1, 2, 3, 4];
    } else if (contentId) {
      keysToAdd.push(contentId);
    }

    const isRaid = contentType === "raid" || matchedContent?.category === "레이드" || contentName.includes("레이드") || contentName.includes("카브락") || contentName.includes("에이렐") || contentName.includes("서큐");
    const isAbyss = contentType === "abyss" || matchedContent?.category === "어비스" || contentName.includes("어비스");

    const updatePromises = characterNames.map(async (name) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      let { data: charData } = await supabase
        .from("characters")
        .select("id, nickname, name, raid_checks, abyss_checks")
        .eq("nickname", cleanName)
        .maybeSingle();

      if (!charData) {
        const { data: fallbackData } = await supabase
          .from("characters")
          .select("id, nickname, name, raid_checks, abyss_checks")
          .eq("name", cleanName)
          .maybeSingle();
        charData = fallbackData;
      }

      if (!charData) return;

      if (isRaid) {
        const currentChecks = Array.isArray(charData.raid_checks) ? charData.raid_checks : [];
        const nextChecks = Array.from(new Set([...currentChecks, ...keysToAdd]));
        await supabase
          .from("characters")
          .update({ raid_checks: nextChecks })
          .eq("id", charData.id);
      }

      if (isAbyss) {
        const currentChecks = Array.isArray(charData.abyss_checks) ? charData.abyss_checks : [];
        const nextChecks = Array.from(new Set([...currentChecks, ...keysToAdd]));
        await supabase
          .from("characters")
          .update({ abyss_checks: nextChecks })
          .eq("id", charData.id);
      }
    });

    await Promise.all(updatePromises);
    return true;
  } catch (e) {
    console.error("KRONOS 숙제 자동 연동 오류:", e);
    return false;
  }
}