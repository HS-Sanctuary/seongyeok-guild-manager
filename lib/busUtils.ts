import { supabase } from "@/lib/supabase";

export const JOB_ROLE_MAP: Record<string, "근딜" | "원딜" | "힐러" | "탱커" | "서포터"> = {
  '도적': '근딜', '댄서': '근딜', '듀얼블레이드': '근딜', '대검전사': '근딜', '검술사': '근딜', '격투가': '근딜',
  '궁수': '원딜', '악사': '원딜', '석궁사수': '원딜', '마법사': '원딜', '화염술사': '원딜', '전격술사': '원딜', '장궁병': '원딜', '암흑술사': '원딜',
  '힐러': '힐러', '수도사': '힐러', '사제': '힐러',
  '전사': '탱커', '기사': '탱커', '빙결술사': '탱커',
  '음유시인': '서포터',
};

export function getRoleByJob(jobName: string): "근딜" | "원딜" | "힐러" | "탱커" | "서포터" {
  return JOB_ROLE_MAP[jobName] || "근딜";
}

export function getShortNickname(name: string): string {
  if (!name) return "";
  return name.length > 3 ? name.slice(0, 3) : name;
}

export function parseCP(cp: any): number {
  if (typeof cp === "number") return isNaN(cp) ? 0 : cp;
  if (!cp) return 0;
  const clean = String(cp).replace(/,/g, "").trim();
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function normalizeContentKeyForKronos(contentName: string): string {
  if (!contentName) return "";
  if (contentName.includes("카브락") || contentName.includes("카브")) return "cabrak";
  if (contentName.includes("에이렐") || contentName.includes("에렐")) return "eirel";
  if (contentName.includes("화이트 서큐버스") || contentName.includes("서큐")) return "succubus";
  if (contentName.includes("어비스")) return "abyss";
  return contentName;
}

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
  character_id?: any;
  character_name: string;
  owner_account: string;
  job: string;
  combat_power: number;
  allow_repeat?: boolean;
  is_completed?: boolean;
  time_start?: string;
  time_end?: string;
}

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
    if (cand.owner_account) {
      selectedOwners.add(cand.owner_account);
    }
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
 * KRONOS 숙제 자동 연동 엔진 (일반 매칭 & 길드 버스 공통 적용)
 */
export async function syncKronosChecklist(
  characterTargets: (string | { id?: any; character_id?: any; character_name?: string; name?: string; nickname?: string })[],
  contentType: string,
  contentName: string,
  difficulty?: string
) {
  try {
    if (!characterTargets || characterTargets.length === 0) return true;

    const normName = (contentName || "").trim();
    const isAbyss = contentType === "abyss" || normName.includes("어비스") || normName.includes("허상") || normName.includes("동굴") || normName.includes("물길");
    const isRaid = contentType === "raid" || normName.includes("레이드") || normName.includes("카브락") || normName.includes("에이렐") || normName.includes("서큐");

    // KRONOS 키 매핑 매트릭스
    let keysToAdd: string[] = [
      normName,
      normalizeContentKeyForKronos(normName),
    ].filter(Boolean) as string[];

    if (normName.includes("카브락") || normName.includes("카브")) {
      if (difficulty === "입문") {
        keysToAdd.push("cabrak_entry", "cabrak_normal", "cabrak_0", "카브락_입문", "raid_cabrak_entry", "카브락");
      } else {
        keysToAdd.push("cabrak_hard", "cabrak_1", "카브락_어려움", "cabrak", "raid_cabrak_hard", "카브락");
      }
    } else if (normName.includes("에이렐") || normName.includes("에렐")) {
      keysToAdd.push("eirel_hard", "에이렐_어려움", "eirel", "raid_eirel_hard", "에이렐");
    } else if (normName.includes("서큐") || normName.includes("서큐버스")) {
      if (difficulty === "매우 어려움") {
        keysToAdd.push("succubus_very_hard", "서큐_매우어려움", "succubus", "raid_succubus_very_hard", "화이트 서큐버스");
      } else {
        keysToAdd.push("succubus_hard", "서큐_어려움", "succubus", "raid_succubus_hard", "화이트 서큐버스");
      }
    }

    if (isAbyss) {
      // 어비스 3종 전체 및 개별 던전 키 일괄 매핑 (KRONOS 상호 완벽 호환)
      keysToAdd.push(
        "abyss_all", "abyss_1", "abyss_2", "abyss_3", 
        "abyss_entry", "abyss_hard", "abyss_very_hard", 
        "어비스 3종 (통합)", "어비스 3종", "어비스",
        "허상의 정박지", "광기의 동굴", "흩어진 물길", 
        "허상", "동굴", "물길"
      );
    }

    // 1. 타겟 캐릭터들의 닉네임 및 ID 수집
    const targetNames = new Set<string>();
    const targetIds = new Set<any>();

    for (const target of characterTargets) {
      if (!target) continue;
      if (typeof target === "string") {
        if (target.trim()) targetNames.add(target.trim());
      } else if (typeof target === "object") {
        const cId = target.character_id || target.id;
        if (cId !== undefined && cId !== null && cId !== "") targetIds.add(cId);
        const cName = (target.character_name || target.nickname || target.name || "").trim();
        if (cName) targetNames.add(cName);
      }
    }

    // 2. 캐릭터 데이터 조회
    const { data: allChars, error: fetchError } = await supabase
      .from("characters")
      .select("id, nickname, raid_checks, weekly_checks");

    if (fetchError || !allChars) {
      console.error("크로노스 연동 전체 캐릭터 조회 실패:", fetchError);
      return false;
    }

    // 3. 대상 캐릭터 필터링
    const matchedChars = allChars.filter(c => {
      const cId = c.id;
      const cNick = (c.nickname || "").trim();
      if (targetIds.has(cId) || targetIds.has(String(cId))) return true;
      if (cNick && targetNames.has(cNick)) return true;
      return false;
    });

    if (matchedChars.length === 0) return true;

    // 4. DB 동기화 (KRONOS 캐릭터 페이지 스펙에 맞춰 raid_checks 컬럼에 통합 저장)
    const updatePromises = matchedChars.map(async (charData) => {
      const mergeChecks = (existingData: any) => {
        let currentList: any[] = [];
        if (Array.isArray(existingData)) {
          currentList = existingData;
        } else if (typeof existingData === "string") {
          try { currentList = JSON.parse(existingData); } catch (e) { currentList = []; }
        }
        return Array.from(new Set([...currentList, ...keysToAdd]));
      };

      let updatePayload: any = {};
      
      // KRONOS는 어비스와 레이드 항목 모두 raid_checks 컬럼에 보관 및 로드합니다.
      if (isRaid || isAbyss) {
        updatePayload.raid_checks = mergeChecks(charData.raid_checks);
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase
          .from("characters")
          .update(updatePayload)
          .eq("id", charData.id);
      }
    });

    await Promise.all(updatePromises);
    return true;
  } catch (e) {
    console.error("KRONOS 숙제 연동 실패:", e);
    return false;
  }
}