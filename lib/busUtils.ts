import { supabase } from "@/lib/supabase";

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

  // 1. 유효 후보 필터링 (미클리어자 우선, 이미 클리어한 자는 allow_repeat 허용 시만 참가)
  let eligible = candidates.filter(c => !c.is_completed || c.allow_repeat);

  // 2. 미클리어자(!is_completed) 1순위, 전투력 내림차순 2순위 정렬
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

  // 3. 필수 역할군(힐러, 탱커) 선발
  const healerIdx = eligible.findIndex(c => getRoleByJob(c.job) === "힐러" && canAdd(c));
  if (healerIdx !== -1) {
    addCandidate(eligible[healerIdx]);
  }

  const tankerIdx = eligible.findIndex(c => getRoleByJob(c.job) === "탱커" && canAdd(c));
  if (tankerIdx !== -1) {
    addCandidate(eligible[tankerIdx]);
  }

  // 4. 전투력 구간별 그룹 분할
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

  // 5. 슬롯 할당 (OP: ~3명, REC: 2~3명, MIN: 2~3명)
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

  // 6. 남은 정원 채우기
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
 */
export async function syncKronosChecklist(characterNames: string[], contentType: string, contentName: string) {
  try {
    const normalizedKey = normalizeContentKeyForKronos(contentName);

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

      if (contentType === "raid") {
        const currentChecks = Array.isArray(charData.raid_checks) ? charData.raid_checks : [];
        if (!currentChecks.includes(normalizedKey)) {
          await supabase
            .from("characters")
            .update({ raid_checks: [...currentChecks, normalizedKey] })
            .eq("id", charData.id);
        }
      } else if (contentType === "abyss") {
        const currentChecks = Array.isArray(charData.abyss_checks) ? charData.abyss_checks : [];
        if (!currentChecks.includes(normalizedKey)) {
          await supabase
            .from("characters")
            .update({ abyss_checks: [...currentChecks, normalizedKey] })
            .eq("id", charData.id);
        }
      }
    });

    await Promise.all(updatePromises);
    return true;
  } catch (e) {
    console.error("KRONOS 숙제 자동 연동 오류:", e);
    return false;
  }
}