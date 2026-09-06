import { supabase } from "@/lib/supabase";

// 21개 직업군 5대 포지션 1:1 매핑 (명세 반영)
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

// 컨텐츠별 전투력 기준표 (Supabase content_power_reqs 연동 기반)
export const CONTENT_CP_REQUIREMENTS: Record<string, Record<string, { min: number; rec: number; op: number }>> = {
  "카브락": {
    "입문": { min: 65000, rec: 72000, op: 82500 },
    "어려움": { min: 90000, rec: 95000, op: 109000 },
  },
  "에이렐": {
    "어려움": { min: 43500, rec: 50000, op: 57500 },
  },
  "화이트 서큐버스": {
    "어려움": { min: 0, rec: 27000, op: 31100 },
    "매우 어려움": { min: 50000, rec: 57500, op: 64000 },
  },
  "어비스 3종 (통합)": {
    "입문": { min: 50000, rec: 56000, op: 64500 },
    "어려움": { min: 63000, rec: 66000, op: 75000 },
    "매우 어려움": { min: 76000, rec: 80000, op: 92000 },
    "지옥1": { min: 87500, rec: 92000, op: 105000 },
    "지옥2": { min: 95000, rec: 100000, op: 115000 },
  },
};

export interface BusCandidate {
  character_name: string;
  owner_account: string;
  job: string;
  combat_power: number;
  allow_repeat: boolean; // 반복 참여(용병 🔄) 옵션
  is_completed: boolean;   // 미클리어 여부 (1순위 배치 조건)
  time_start: string;
  time_end: string;
}

/**
 * 자동 파티 밸런싱 & 배치 알고리즘
 * 1순위: 미클리어 캐릭터 우선 투입
 * 2순위: 반복 참여(용병 🔄) 캐릭터 투입
 * 힐러: 파티당 최소 1명 지향, 없으면 [⚠️ 힐러 미포함 파티] 태그 노출
 */
export function assembleBalancedParty(
  candidates: BusCandidate[],
  maxSize: number,
  cpReqs: { min: number; rec: number; op: number },
  isRebalanceMode: boolean = false
) {
  if (candidates.length === 0) return { selected: [], remaining: [], hasHealer: false };

  // 1. 유효 후보 필터링 (미클리어자 우선, 클리어자는 반복 참여 체크된 경우만 허용)
  let eligible = candidates.filter(c => !c.is_completed || c.allow_repeat);

  // 2. 1순위 정렬: 미클리어(!is_completed) 우선, 그 다음 전투력 높은 순
  eligible.sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    return b.combat_power - a.combat_power;
  });

  const selected: BusCandidate[] = [];
  const selectedOwners = new Set<string>();

  // 3. 힐러 확보 (파티당 최소 1명 선발 지향)
  const healerIdx = eligible.findIndex(c => getRoleByJob(c.job) === "힐러");
  if (healerIdx !== -1) {
    const healer = eligible[healerIdx];
    selected.push(healer);
    selectedOwners.add(healer.owner_account);
    eligible.splice(healerIdx, 1);
  }

  // 4. 재구성 모드 시 압도 전투력 우선 배치
  if (isRebalanceMode) {
    eligible.sort((a, b) => b.combat_power - a.combat_power);
  }

  // 5. 정원 채우기 (동일 계정 캐릭터 1파티 중복 배치 방지)
  for (let i = 0; i < eligible.length && selected.length < maxSize; i++) {
    const candidate = eligible[i];
    if (!selectedOwners.has(candidate.owner_account) || eligible.length <= maxSize) {
      selected.push(candidate);
      selectedOwners.add(candidate.owner_account);
    }
  }

  // 잔여 정원 채우기
  if (selected.length < maxSize) {
    for (const candidate of eligible) {
      if (selected.length >= maxSize) break;
      if (!selected.some(s => s.character_name === candidate.character_name)) {
        selected.push(candidate);
      }
    }
  }

  const selectedNames = new Set(selected.map(s => s.character_name));
  const remaining = candidates.filter(c => !selectedNames.has(c.character_name));
  const hasHealer = selected.some(s => getRoleByJob(s.job) === "힐러");

  return { selected, remaining, hasHealer };
}

/**
 * 6. 크로노스(KRONOS) 숙제 자동 연동 (Supabase Direct Mutation)
 * sync-client API 규격과 동일하게 nickname/name 이중 컬럼 매칭 및 병렬 트랜잭션 처리
 */
export async function syncKronosChecklist(characterNames: string[], contentType: string, contentName: string) {
  try {
    const updatePromises = characterNames.map(async (name) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      // 1. nickname 우선 조회 후 없으면 name 컬럼으로 fallback
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

      // 2. raid_checks / abyss_checks jsonb 배열 업데이트
      if (contentType === "raid") {
        const currentChecks = Array.isArray(charData.raid_checks) ? charData.raid_checks : [];
        if (!currentChecks.includes(contentName)) {
          await supabase
            .from("characters")
            .update({ raid_checks: [...currentChecks, contentName] })
            .eq("id", charData.id);
        }
      } else if (contentType === "abyss") {
        const currentChecks = Array.isArray(charData.abyss_checks) ? charData.abyss_checks : [];
        if (!currentChecks.includes(contentName)) {
          await supabase
            .from("characters")
            .update({ abyss_checks: [...currentChecks, contentName] })
            .eq("id", charData.id);
        }
      }
    });

    await Promise.all(updatePromises);
    return true;
  } catch (e) {
    console.error("KRONOS 자동 체크 연동 오류:", e);
    return false;
  }
}