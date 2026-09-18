"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Notice, CommentItem } from "@/types/kerygma";
import ClassIcon from "@/components/common/ClassIcon";

// 🟢 40개 이상의 다양해진 메이저 퀵 이모지 세트
const PRESET_EMOJIS = [
  "👍", "❤️", "🔥", "🎉", "😮", "😂", "⚔️", "🛡️", "👑", "💡",
  "✨", "🚀", "💩", "🙏", "💪", "💀", "👻", "🤡", "👀", "💯",
  "🎯", "🎲", "🔮", "🍀", "🍺", "☕", "🍕", "🎮", "🕹️", "🏆",
  "🥇", "⭐", "⚡", "💥", "🛑", "✅", "❌", "❓", "❗", "💬"
];

// 🌸 판테온 뷰 100% 실시간 연동 데이터 및 테마 구조
const CATEGORY_THEMES: Record<string, any> = {
  TELOS: {
    tags: [
      'bg-purple-500/85 text-white border-2 border-purple-300 font-black shadow-xs',
      'bg-purple-900/60 text-purple-200 border border-purple-400 font-extrabold',
      'bg-purple-950/60 text-purple-200 border border-purple-500 font-black',
    ]
  },
  SYMPHONIA: {
    tags: [
      'bg-orange-500/85 text-white border-2 border-orange-300 font-black shadow-xs',
      'bg-orange-900/60 text-orange-200 border border-orange-400 font-extrabold',
      'bg-orange-950/60 text-orange-200 border border-orange-500 font-black',
    ]
  },
  KRATOS: {
    tags: [
      'bg-rose-500/85 text-white border-2 border-rose-300 font-black shadow-xs',
      'bg-rose-900/60 text-rose-200 border border-rose-400 font-extrabold',
      'bg-rose-950/60 text-rose-200 border border-rose-500 font-black',
    ]
  },
  TECHNE: {
    tags: [
      'bg-sky-500/85 text-white border-2 border-sky-300 font-black shadow-xs',
      'bg-sky-900/60 text-sky-200 border border-sky-400 font-extrabold',
      'bg-sky-950/60 text-sky-200 border border-sky-500 font-black',
    ]
  },
  HARMONIA: {
    tags: [
      'bg-amber-400/90 text-slate-950 border-2 border-amber-500 font-black shadow-xs',
      'bg-amber-900/60 text-amber-200 border border-amber-400 font-extrabold',
      'bg-amber-950/60 text-amber-200 border border-amber-500 font-black',
    ]
  },
  PIETAS: {
    tags: [
      'bg-emerald-500/85 text-white border-2 border-emerald-300 font-black shadow-xs',
      'bg-emerald-900/60 text-emerald-200 border border-emerald-400 font-extrabold',
      'bg-emerald-950/60 text-emerald-200 border border-emerald-500 font-black',
    ]
  }
};

const RANKING_INFO: Record<string, { en: string; kr: string }> = {
  TELOS: { en: 'TELOS', kr: '텔로스' },
  SYMPHONIA: { en: 'SYMPHONIA', kr: '심포니아' },
  KRATOS: { en: 'KRATOS', kr: '크라토스' },
  TECHNE: { en: 'TECHNĒ', kr: '테크네' },
  HARMONIA: { en: 'HARMONIA', kr: '하르모니아' },
  PIETAS: { en: 'PIETAS', kr: '피에타스' },
};

const TOP_TITLES: Record<string, string[]> = {
  TELOS: ['헬리오스', '셀레네', '에오스'],
  SYMPHONIA: ['아르콘', '헬릭스', '메로스'],
  PIETAS: ['시리우스', '레굴루스', '알데바란'],
  TECHNE: ['폴리매스', '마이스터', '아르티장'],
  HARMONIA: ['아글라이아', '카리스', '칼로스'],
};

const CLASS_TITLES: Record<string, string[]> = {
  "전사": ["검투신", "검투왕", "검투사", "전사"], "대검전사": ["파괴신", "파괴왕", "광전사", "대검전사"],
  "검술사": ["검신", "검왕", "검성", "검술사"], "기사": ["수호신", "수호왕", "수호기사", "기사"],
  "마법사": ["마신", "대현자", "현자", "마법사"], "화염술사": ["화신", "염왕", "염마", "화염술사"],
  "빙결술사": ["빙신", "빙왕", "빙마", "빙결술사"], "전격술사": ["뢰신", "뇌왕", "뇌마", "전격술사"],
  "궁수": ["폭풍신", "폭풍왕", "화랑", "궁수"], "장궁병": ["신궁", "천궁", "명궁", "장궁병"],
  "석궁사수": ["파천궁신", "파천궁제", "파천사수", "석궁사수"], "음유시인": ["셰익스피어", "호메로스", "오르페우스", "음유시인"],
  "댄서": ["플로라비", "파피에르", "블루에트", "댄서"], "악사": ["마에스트로", "비르투오사", "솔리스트", "악사"],
  "힐러": ["그라시아", "베네딕토", "렐릭스", "힐러"], "사제": ["메시아", "디바인", "프리스트", "사제"],
  "수도사": ["아라한", "금강", "나한", "수도사"], "암흑술사": ["암제", "암왕", "암마", "암흑술사"],
  "도적": ["독왕", "트릭스터", "땅거미", "도적"], "격투가": ["권신", "권왕", "권호", "격투가"],
  "듀얼블레이드": ["유성천침", "쌍극난무", "질풍쌍화", "듀얼블레이드"]
};

const LORE_DICTIONARY: Record<string, string> = {
  '헬리오스': '그리스 신화의 태양신. 모든 것을 비추는 태양처럼 최고의 경지에 도달한 존재를 상징합니다.',
  '셀레네': '그리스 신화의 달의 여신. 밤하늘을 밝히는 달처럼 뛰어난 완성과 품격을 상징합니다.',
  '에오스': '그리스 신화의 새벽의 여신. 새로운 시작과 가능성을 여는 존재를 상징합니다.',
  '아르콘': '계정 전체를 찬란히 빛내며 성역 최고 통합 점수를 달성한 위대한 통치자를 상징합니다.',
  '헬릭스': '모든 영웅을 고르게 육성하여 아름다운 조화를 이룬 계정을 상징합니다.',
  '메로스': '성역에 깊이 뿌리내려 든든한 화합을 일군 영예로운 계정을 상징합니다.',
  '시리우스': '밤하늘에서 가장 밝게 빛나는 항성. 성역을 가장 밝게 비추며 공동체를 이끄는 존재를 상징합니다.',
  '레굴루스': "사자자리의 '작은 왕(Little King)'. 명예와 품격으로 공동체를 받치는 존재를 상징합니다.",
  '알데바란': "황소자리의 '뒤따르는 자(Follower)'. 꾸준한 헌신과 책임감을 상징합니다.",
  '폴리매스': '여러 분야에 뛰어난 지식과 능력을 가진 만능형 인물을 의미합니다.',
  '마이스터': '특정 기술 분야에서 높은 수준의 숙련도를 가진 위대한 장인을 의미합니다.',
  '아르티장': '오랜 시간 벼려낸 숙련된 기술과 솜씨를 가진 장인을 의미합니다.',
  '아글라이아': '찬란함, 빛남, 아름다움을 상징하는 신화 속 이름입니다.',
  '카리스': '거부할 수 없는 매력, 은총, 우아함, 사람을 끌어당기는 힘을 의미합니다.',
  '칼로스': '내면과 외면을 아우르는 진정한 아름다움을 의미합니다.'
};

const TRIBUTE_MESSAGES: Record<string, Record<number, string>> = {
  TELOS: { 1: "모든 시련을 극복하고 만물의 이치를 깨우친 절대자여...", 2: "정상의 옥좌를 턱밑까지 추격한 초월자...", 3: "균형과 완성의 길을 걷는 위대한 선구자..." },
  SYMPHONIA: { 1: "변함없는 끈기와 피나는 노력으로 모든 영웅을 완벽하게 다듬어낸...", 2: "포기하지 않는 집념으로 계정 내 모든 영웅을 훌륭하게 성숙시킨...", 3: "시간과 열정을 쏟아부어 견고하게 계정을 다져낸 헌신자..." },
  TECHNE: { 1: "무에서 유를 창조하는 창조신이여...", 2: "불과 쇠, 흙과 나무를 지배하는 경이로운 장인...", 3: "인고의 시간을 견뎌내고 예술의 경지에 오른 마에스트로..." },
  HARMONIA: { 1: "숨이 멎을 듯한 자태로 만인을 굴복시킨 절대적인 미(美)의 화신...", 2: "거부할 수 없는 우아함과 기품을 흩뿌리는 매혹의 지배자...", 3: "내면과 외면이 완벽한 조화를 이룬 고결한 우상..." },
  PIETAS: { 1: "자신의 뼈를 깎아 성역의 굳건한 성벽을 세운 영웅이여...", 2: "길드를 위해 기꺼이 자신을 희생한 고결한 등대...", 3: "형제들을 위해 궂은일을 도맡는 성역의 진정한 수호자..." }
};

const KRATOS_LORE: Record<string, { meaning: string; tribute: string }> = {
  "검투신": { meaning: "수많은 전장을 넘어, 검으로 신의 경지에 닿은 자.", tribute: "성역의 검이 향하는 곳에, 더 이상 적은 남지 않는다." },
  "파괴신": { meaning: "휘두른 한 번의 일격으로 전장을 무너뜨리는 자.", tribute: "성역의 적들에게 가장 두려운 것은 당신의 대검이다." },
  "검신": { meaning: "검과 하나가 되어 검의 극의를 넘어선 자.", tribute: "성역의 검은 이제 무기가 아니라 하나의 경지다." },
  "수호신": { meaning: "자신의 방패 뒤에 모든 동료를 지켜낸 자.", tribute: "성역의 누구도 당신의 뒤에서는 두려워하지 않는다." },
  "마신": { meaning: "인간의 한계를 넘어 마법 그 자체에 닿은 자.", tribute: "성역의 마법이 어디까지 갈 수 있는지를 보여준 자." },
  "화신": { meaning: "타오르는 불꽃을 자신의 의지처럼 다루는 자.", tribute: "성역의 불꽃이 꺼지지 않는 이유는 당신이 있기 때문이다." },
  "빙신": { meaning: "세상의 온기마저 얼려버리는 절대적인 냉기의 지배자.", tribute: "성역의 전장을 고요하게 얼려버리는 절대적인 힘." },
  "뢰신": { meaning: "하늘에서 떨어진 번개를 자신의 힘으로 삼은 자.", tribute: "성역의 하늘이 당신을 위해 번개를 내린다." },
  "폭풍신": { meaning: "수많은 화살로 전장을 폭풍처럼 휩쓰는 자.", tribute: "성역의 화살비가 시작되면 누구도 그 폭풍에서 벗어날 수 없다." },
  "신궁": { meaning: "하늘과 땅의 거리를 넘어 한 발의 화살로 운명을 꿰뚫는 자.", tribute: "성역의 가장 먼 곳까지 닿는 한 발의 신뢰." },
  "파천궁신": { meaning: "한 발의 화살로 하늘마저 가르는 궁극의 사수.", tribute: "성역의 이름을 등에 지고 하늘을 꿰뚫은 자." },
  "셰익스피어": { meaning: "음악과 이야기로 사람의 마음을 움직이는 전장의 예술가.", tribute: "성역의 이야기를 노래로 남길 자격을 얻은 사람." },
  "플로라비": { meaning: "꽃잎처럼 가볍게 춤추며 전장을 자신의 무대로 만드는 자.", tribute: "성역의 전장을 가장 아름다운 무대로 바꾸는 춤." },
  "마에스트로": { meaning: "모든 선율과 리듬을 지휘하여 전장을 하나의 악장으로 만드는 자.", tribute: "성역의 전장이 당신의 지휘 아래 하나의 음악이 된다." },
  "그라시아": { meaning: "은총의 힘으로 쓰러진 이들에게 다시 일어설 힘을 주는 자.", tribute: "성역의 사람들이 다시 일어설 수 있는 이유가 되어준 자." },
  "메시아": { meaning: "절망 속에서도 모두에게 구원의 길을 보여주는 자.", tribute: "성역이 어둠 속에서도 희망을 잃지 않는 이유." },
  "아라한": { meaning: "번뇌를 내려놓고 자신의 육체와 정신을 극한까지 단련한 자.", tribute: "성역의 무도가 어디까지 닿을 수 있는지 보여준 자." },
  "암제": { meaning: "어둠의 힘을 지배하여 어둠의 정점에 오른 자.", tribute: "성역의 그림자마저 당신의 힘 앞에서는 고개를 숙인다." },
  "독왕": { meaning: "보이지 않는 독으로 전장을 지배하는 치명적인 사냥꾼.", tribute: "성역의 적에게 가장 조용하고 치명적인 경고." },
  "권신": { meaning: "두 주먹만으로 인간의 한계를 넘어선 자.", tribute: "성역의 주먹에는 무기가 필요하지 않다." },
  "유성천침": { meaning: "유성처럼 떨어지는 두 칼날로 적의 빈틈을 꿰뚫는 궁극의 쌍검사.", tribute: "성역의 칼날이 가장 빠르게, 그리고 가장 정확하게 승리를 새긴다." },
};

// 🌟 칭호 고유 역추적(Reverse Lookup) 정밀 연산 유틸 엔진
const generateTitleDetails = (titleName: string, ownerName: string = '', fallbackJob: string = '') => {
  const ownerText = ownerName ? ` (소유자: ${ownerName})` : '';

  // 1. KRATOS 21개 직업 고유 칭호 역추적
  for (const [jobName, titles] of Object.entries(CLASS_TITLES)) {
    const rankIndex = titles.indexOf(titleName);
    if (rankIndex !== -1) {
      const rank = rankIndex + 1;
      const rankStr = rank <= 3 ? `${rank}위` : '랭커';
      const sourceText = `『KRATOS』 [${jobName}] ${rankStr} 칭호${ownerText}`;
      
      const customLore = KRATOS_LORE[titleName];
      const meaning = customLore?.meaning || `끝없는 투지와 숙련도로 전장을 누비는 ${jobName}입니다.`;
      const tribute = customLore?.tribute || `성역을 위해 무기를 든 자랑스러운 전사.`;

      return { title: titleName, categoryLabel: 'KRATOS', sourceText, meaning, tribute };
    }
  }

  // 2. 5대 랭킹 TOP_TITLES (1~3위) 역추적
  for (const [catKey, titles] of Object.entries(TOP_TITLES)) {
    const rankIndex = titles.indexOf(titleName);
    if (rankIndex !== -1) {
      const rank = rankIndex + 1;
      const catEn = RANKING_INFO[catKey]?.en || catKey;
      const sourceText = `『${catEn}』 ${rank}위 칭호${ownerText}`;
      const meaning = LORE_DICTIONARY[titleName] || `${titleName}의 경지에 오른 위대한 영웅입니다.`;
      const tribute = TRIBUTE_MESSAGES[catKey]?.[rank] || "꾸준한 노력과 의지로 성역의 발전에 이바지하는 자입니다.";

      return { title: titleName, categoryLabel: catKey, sourceText, meaning, tribute };
    }
  }

  // 3. Fallback
  const jobToUse = fallbackJob || '영웅';
  return {
    title: titleName,
    categoryLabel: 'SANCTUM',
    sourceText: `『SANCTUM』 성역 영예 칭호${ownerText}`,
    meaning: LORE_DICTIONARY[titleName] || `성역에서 두각을 나타내며 자신만의 영광스러운 길을 개척한 ${jobToUse}입니다.`,
    tribute: `성역의 역사에 커다란 발자취를 남긴 위대한 기사에게 바치는 헌사.`
  };
};

// 🟢 DB 기반 계정별 대표 캐릭터 (is_main: true) 1순위 정밀 선발 엔진
const getRepresentativeCharacter = (accountName: string, charactersList: any[] = []) => {
  if (!accountName || !Array.isArray(charactersList) || charactersList.length === 0) return null;

  const userChars = charactersList.filter(
    (c) => c.owner === accountName || c.name === accountName || c.nickname === accountName
  );

  if (userChars.length === 0) return null;

  const mainChar = userChars.find((c) => c.is_main === true || c.isMain === true);
  if (mainChar) return mainChar;

  const exactNameChar = userChars.find((c) => (c.nickname || c.name) === accountName);
  if (exactNameChar) return exactNameChar;

  return [...userChars].sort((a, b) => {
    const cpA = Number(a.combatPower ?? a.combat_power ?? 0);
    const cpB = Number(b.combatPower ?? b.combat_power ?? 0);
    return cpB - cpA;
  })[0];
};

interface KerygmaReaderViewProps {
  selectedNotice: Notice;
  onCloseReader: () => void;
  canWriteNotice: boolean;
  onTogglePin: (id: number, currentPinned: boolean) => void;
  onDeleteNotice: (id: number) => void;
  getBadgeStyle: (type: string, isPinned: boolean) => string;
  formatNoticeDate: (dateStr: string) => string;
  onVoteOption: (optionId: string) => void;
  commentsTree: CommentItem[];
  accountsMap: Record<string, { role?: string; equipped_title?: string; titles?: string[]; job?: string; main_class?: string }>;
  dbCharacters: any[];
  currentNickname: string;
  newCommentText: string;
  setNewCommentText: (val: string) => void;
  replyingTo: number | null;
  setReplyingTo: (val: number | null) => void;
  replyText: string;
  setReplyText: (val: string) => void;
  onAddComment: (parentId?: number | null) => void;
  onDeleteComment?: (commentId: number) => void;
  recentNoticesList: Notice[];
  onOpenNotice: (notice: Notice) => void;
}

interface ReaderRecord {
  nickname: string;
  read_at: string;
}

// 🛡️ 대대대댓글 계층 렌더링 재귀 컴포넌트
function CommentNode({
  comment,
  depth = 0,
  currentNickname,
  canWriteNotice,
  accountsMap,
  dbCharacters,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onAddComment,
  onDeleteComment,
  formatTimeShort,
  onOpenTitleModal,
}: {
  comment: CommentItem;
  depth?: number;
  currentNickname: string;
  canWriteNotice: boolean;
  accountsMap: Record<string, { role?: string; equipped_title?: string; titles?: string[]; job?: string; main_class?: string }>;
  dbCharacters: any[];
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  replyText: string;
  setReplyText: (val: string) => void;
  onAddComment: (parentId: number | null) => void;
  onDeleteComment?: (id: number) => void;
  formatTimeShort: (str: string) => string;
  onOpenTitleModal: (titleName: string, author: string, job: string) => void;
}) {
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);

  // 🔴 DB is_main: true 기준 오너의 대표 캐릭터 정밀 추출 (한설 -> 댄서)
  const repChar = getRepresentativeCharacter(comment.author, dbCharacters);
  const authorJob =
    repChar?.job ||
    accountsMap[comment.author]?.job ||
    accountsMap[comment.author]?.main_class ||
    "댄서";

  // 👑 직책 (Role) 텍스트 및 전용 색상 렌더링
  const getRoleTextInfo = (authorName: string) => {
    let role = accountsMap[authorName]?.role || "";
    if (authorName === "한설") role = "길드마스터";

    if (authorName === "한설" || role === "길드마스터" || role === "길드 마스터" || role === "마스터" || role === "admin") {
      return { label: "길드마스터", className: "text-amber-500 font-extrabold text-[11px] sm:text-xs shrink-0" };
    }
    if (role === "부길드마스터" || role === "부마스터" || role === "submaster") {
      return { label: "부마스터", className: "text-blue-400 font-bold text-[11px] sm:text-xs shrink-0" };
    }
    return { label: "길드원", className: "text-[var(--text-sub)] font-medium text-[11px] sm:text-xs shrink-0" };
  };

  const roleInfo = getRoleTextInfo(comment.author);

  // 🌸 [판테온View 100% 동일 5대 랭킹 칭호 정밀 산출 엔진]
  const getAuthorEarnedTitles = (authorName: string) => {
    const titles: { type: string; name: string; rank: number; theme: any }[] = [];
    const targetChar = getRepresentativeCharacter(authorName, dbCharacters);

    if (targetChar && dbCharacters.length > 0) {
      const getCharScore = (c: any, type: string) => {
        const cp = Number(c.combatPower ?? c.combat_power ?? 0);
        const lp = Number(c.lifePower ?? c.life_energy ?? c.life_power ?? 0);
        const ch = Number(c.charm ?? 0);
        const ct = Number(c.contribution ?? 0);

        switch (type) {
          case 'KRATOS': return cp;
          case 'TECHNE': return lp;
          case 'HARMONIA': return ch;
          case 'TELOS': return cp + lp + ch;
          case 'PIETAS': return ct;
          default: return 0;
        }
      };

      const pushIfTop3 = (type: string, titleArr: string[]) => {
        let targetList = [...dbCharacters];

        if (type === 'TECHNE') {
          const ownerMap = new Map<string, any>();
          dbCharacters.forEach((c) => {
            const ownerKey = c.owner?.trim() || c.name || c.nickname;
            const lp = Number(c.lifePower ?? c.life_energy ?? c.life_power ?? 0);
            if (!ownerMap.has(ownerKey) || lp > Number(ownerMap.get(ownerKey)!.lifePower ?? ownerMap.get(ownerKey)!.life_energy ?? 0)) {
              ownerMap.set(ownerKey, c);
            }
          });
          targetList = Array.from(ownerMap.values());
        } else if (type === 'PIETAS') {
          const ownerMap = new Map<string, any>();
          dbCharacters.forEach((c) => {
            const ownerKey = c.owner?.trim() || c.name || c.nickname;
            const isMain = c.is_main || c.isMain;
            if (isMain || !ownerMap.has(ownerKey)) {
              ownerMap.set(ownerKey, c);
            }
          });
          targetList = Array.from(ownerMap.values());
        }

        const rank = targetList
          .sort((a, b) => getCharScore(b, type) - getCharScore(a, type))
          .findIndex(
            (c) =>
              (c.id && targetChar.id && c.id === targetChar.id) ||
              (c.nickname && targetChar.nickname && c.nickname === targetChar.nickname) ||
              (c.name && targetChar.name && c.name === targetChar.name)
          );

        if (rank >= 0 && rank < 3) {
          titles.push({ type, name: titleArr[rank], rank: rank + 1, theme: CATEGORY_THEMES[type] });
        }
      };

      pushIfTop3('TELOS', TOP_TITLES.TELOS);
      pushIfTop3('PIETAS', TOP_TITLES.PIETAS);

      const sameJobChars = dbCharacters
        .filter((c) => c.job === targetChar.job)
        .sort((a, b) => {
          const cpA = Number(a.combatPower ?? a.combat_power ?? 0);
          const cpB = Number(b.combatPower ?? b.combat_power ?? 0);
          return cpB - cpA;
        });

      const kratosRank = sameJobChars.findIndex(
        (c) =>
          (c.id && targetChar.id && c.id === targetChar.id) ||
          (c.nickname && targetChar.nickname && c.nickname === targetChar.nickname) ||
          (c.name && targetChar.name && c.name === targetChar.name)
      );

      const kTitles = CLASS_TITLES[targetChar.job];
      if (kTitles) {
        if (kratosRank >= 0 && kratosRank < 3) {
          titles.push({ type: 'KRATOS', name: kTitles[kratosRank], rank: kratosRank + 1, theme: CATEGORY_THEMES.KRATOS });
        }
      }

      pushIfTop3('TECHNE', TOP_TITLES.TECHNE);
      pushIfTop3('HARMONIA', TOP_TITLES.HARMONIA);
    } else {
      const accTitles = accountsMap[authorName]?.titles || [];
      const equipped = accountsMap[authorName]?.equipped_title;
      const combined = Array.isArray(accTitles) ? [...accTitles] : [];
      if (equipped && !combined.includes(equipped)) combined.unshift(equipped);

      combined.forEach((tName) => {
        if (tName !== "길드마스터" && tName !== "부길드마스터" && tName !== "길드원") {
          titles.push({ type: 'KRATOS', name: tName, rank: 4, theme: CATEGORY_THEMES.KRATOS });
        }
      });
    }

    return titles.slice(0, 5);
  };

  const earnedTitleBadges = getAuthorEarnedTitles(comment.author);

  const getBadgeStyle = (t: { type: string; name: string; rank: number; theme: any }) => {
    if (t.type === 'TELOS') return "bg-purple-600/90 text-white font-black border border-purple-400 shadow-xs hover:bg-purple-500";
    if (t.type === 'KRATOS') return "bg-rose-600/90 text-white font-black border border-rose-400 shadow-xs hover:bg-rose-500";
    if (t.type === 'HARMONIA') return "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs hover:bg-amber-300";
    if (t.type === 'TECHNE') return "bg-sky-600/90 text-white font-black border border-sky-400 shadow-xs hover:bg-sky-500";
    if (t.type === 'PIETAS') return "bg-emerald-600/90 text-white font-black border border-emerald-400 shadow-xs hover:bg-emerald-500";
    return "bg-zinc-800 text-zinc-300 font-bold border border-zinc-700";
  };

  return (
    <div className={`p-3 sm:p-3.5 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl space-y-2 text-xs transition-all ${depth > 0 ? "mt-2" : ""}`}>
      {/* 작성자 & 주클래스 & 직책(우측 텍스트) & 선명하고 또렷한 명조 칭호 뱃지 & 삭제/일시 바 */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {depth > 0 && <span className="text-[var(--accent)] font-bold shrink-0">↳</span>}
          
          {/* 오너 캐릭터 대표 주클래스 SVG 마크 */}
          <div className="w-5 h-5 rounded border border-[var(--panel-border)] bg-[var(--panel)] p-0.5 flex items-center justify-center shrink-0 shadow-xs">
            <ClassIcon job={authorJob} size="sm" className="w-3.5 h-3.5" />
          </div>

          {/* 닉네임 */}
          <span className="font-bold text-[var(--text-main)] shrink-0 text-xs sm:text-sm">{comment.author}</span>

          {/* 👑 닉네임 바로 우측 직책(Role) 텍스트 표기 */}
          <span className={roleInfo.className}>{roleInfo.label}</span>

          {/* 🏅 또렷하고 가독성 뛰어난 명조 크기 (text-[11px] sm:text-[11.5px], px-2 py-0.5) 칭호 뱃지 */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink min-w-0 max-w-[460px] py-0.5 ml-1">
            {earnedTitleBadges.map((t, idx) => {
              const badgeStyle = getBadgeStyle(t);
              return (
                <button
                  key={`${comment.id}-title-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTitleModal(t.name, comment.author, authorJob);
                  }}
                  className={`text-[11px] sm:text-[11.5px] px-2 py-0.5 rounded-md border font-extrabold cursor-pointer transition hover:scale-105 shrink-0 flex items-center justify-center tracking-tight shadow-2xs ${badgeStyle}`}
                >
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[var(--text-sub)]">{formatTimeShort(comment.created_at)}</span>
          {(comment.author === currentNickname || canWriteNotice) && onDeleteComment && (
            <button
              type="button"
              onClick={() => onDeleteComment(comment.id)}
              className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <p className="text-[var(--text-main)] break-all [word-break:break-all] [overflow-wrap:anywhere] leading-normal pl-6">
        {comment.content}
      </p>

      <button
        type="button"
        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
        className="text-[11px] text-[var(--accent)] font-bold hover:underline cursor-pointer pl-6"
      >
        {replyingTo === comment.id ? "답글 취소" : "답글 달기"}
      </button>

      {/* 답글 작성창 */}
      {replyingTo === comment.id && (
        <div className="mt-2.5 pt-2.5 border-t border-[var(--panel-border)] space-y-2 pl-6">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력해주세요..."
              className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddComment(comment.id);
              }}
            />

            <div className="flex flex-col gap-1 w-14 shrink-0">
              <button
                type="button"
                onClick={() => setShowReplyEmojiPicker((prev) => !prev)}
                className={`flex-1 border text-[10px] font-bold rounded flex items-center justify-center cursor-pointer transition ${
                  showReplyEmojiPicker
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                    : "bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)]"
                }`}
              >
                😊 이모지
              </button>
              <button
                type="button"
                onClick={() => onAddComment(comment.id)}
                className="flex-1 bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black rounded hover:opacity-90 transition cursor-pointer flex items-center justify-center shadow-xs"
              >
                등록
              </button>
            </div>
          </div>

          {showReplyEmojiPicker && (
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[var(--panel)] border border-[var(--accent)]/50 rounded-xl text-base shadow-lg max-h-36 overflow-y-auto custom-scrollbar animate-fadeIn mt-1">
              {PRESET_EMOJIS.map((emoji, idx) => (
                <button
                  key={`reply-emoji-${idx}`}
                  type="button"
                  onClick={() => {
                    setReplyText(replyText + emoji);
                  }}
                  className="hover:scale-130 active:scale-90 transition p-1 cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 대대대댓글 재귀 계층 렌더링 */}
      {comment.children && comment.children.length > 0 && (
        <div className="pl-3 sm:pl-4 border-l-2 border-[var(--accent)]/30 space-y-2 mt-2 pt-1">
          {comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              currentNickname={currentNickname}
              canWriteNotice={canWriteNotice}
              accountsMap={accountsMap}
              dbCharacters={dbCharacters}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              formatTimeShort={formatTimeShort}
              onOpenTitleModal={onOpenTitleModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KerygmaReaderView({
  selectedNotice,
  onCloseReader,
  canWriteNotice,
  onTogglePin,
  onDeleteNotice,
  getBadgeStyle,
  formatNoticeDate,
  onVoteOption,
  commentsTree,
  accountsMap,
  dbCharacters,
  currentNickname,
  newCommentText,
  setNewCommentText,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onAddComment,
  onDeleteComment,
  recentNoticesList,
  onOpenNotice,
}: KerygmaReaderViewProps) {
  const router = useRouter();
  const [readers, setReaders] = useState<ReaderRecord[]>([]);
  const [showReaders, setShowReaders] = useState(false);
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);

  // 🌸 판테온 전역 칭호 클릭 시 팝업 모달 상태
  const [activeTitleModal, setActiveTitleModal] = useState<{ titleName: string; author: string; job: string } | null>(null);

  const handleOpenTitleModal = (titleName: string, author: string, job: string) => {
    setActiveTitleModal({ titleName, author, job });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTitleModal(null);
    };
    if (activeTitleModal) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTitleModal]);

  const getAuthorRoleText = (authorName: string) => {
    if (!authorName) return null;

    let role = "";
    if (authorName === "한설") {
      role = "길드마스터";
    } else if (accountsMap[authorName]) {
      role = accountsMap[authorName].role || "";
    }

    if (authorName === "한설" || role === "길드마스터" || role === "마스터" || role === "admin") {
      return (
        <span className="text-amber-500 font-extrabold text-xs">
          길드마스터
        </span>
      );
    }

    if (role === "부길드마스터" || role === "부마스터" || role === "submaster") {
      return (
        <span className="text-blue-400 font-bold text-xs">
          부마스터
        </span>
      );
    }

    return (
      <span className="text-[var(--text-sub)] font-medium text-xs">
        길드원
      </span>
    );
  };

  // 🟢 DB is_main: true 기준 동적 대표 캐릭터 및 직업 정보 반환
  const getRepresentativeCharacterInfo = (accountName: string) => {
    const repChar = getRepresentativeCharacter(accountName, dbCharacters);
    if (repChar) {
      return {
        charName: repChar.nickname || repChar.name || accountName,
        mainClass: repChar.job || "댄서",
      };
    }

    const accInfo = accountsMap[accountName];
    return {
      charName: accountName,
      mainClass: accInfo?.job || accInfo?.main_class || "댄서",
    };
  };

  useEffect(() => {
    if (!selectedNotice) return;
    const storageKey = `sanctum_notice_readers_${selectedNotice.id}`;
    const existing: ReaderRecord[] = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    if (currentNickname && currentNickname !== "방문자") {
      const alreadyRead = existing.some((r) => r.nickname === currentNickname);
      if (!alreadyRead) {
        const updated = [
          ...existing,
          { nickname: currentNickname, read_at: new Date().toISOString() },
        ];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setReaders(updated);
        return;
      }
    }
    setReaders(existing);
  }, [selectedNotice.id, currentNickname]);

  const formatTimeShort = (isoStr: string) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${mm}.${dd} ${hh}:${min}`;
  };

  const countTotalComments = (nodes: CommentItem[]): number => {
    return nodes.reduce((acc, cur) => acc + 1 + (cur.children ? countTotalComments(cur.children) : 0), 0);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 animate-fadeIn pb-12 overflow-x-hidden">
      {/* 1. 상단 액션 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-[var(--panel-border)] pb-3">
        <button
          onClick={onCloseReader}
          className="px-3 py-1.5 bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <span className="text-sm">←</span>
          <span>목록으로 돌아가기</span>
        </button>

        {canWriteNotice && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onTogglePin(selectedNotice.id, selectedNotice.is_pinned)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                selectedNotice.is_pinned
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {selectedNotice.is_pinned ? "📌 고정해제" : "📌 상단고정"}
            </button>

            <button
              onClick={() => router.push(`/kerygma/write?editId=${selectedNotice.id}`)}
              className="px-2.5 sm:px-3 py-1.5 bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] text-xs font-bold rounded-lg transition cursor-pointer"
            >
              ✏️ 수정
            </button>

            <button
              onClick={() => onDeleteNotice(selectedNotice.id)}
              className="px-2.5 sm:px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </div>

      {/* 2. 본문 카드 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-3.5 sm:p-5 md:p-7 shadow-lg space-y-4 sm:space-y-6 overflow-hidden">
        {/* Header Area */}
        <div className="border-b border-[var(--panel-border)] pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border border-[var(--panel-border)] font-bold bg-[var(--inner-box)] ${getBadgeStyle(
                selectedNotice.type,
                selectedNotice.is_pinned
              )}`}
            >
              {selectedNotice.type}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] break-all [word-break:break-all] [overflow-wrap:anywhere] leading-tight">
            {selectedNotice.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-[var(--text-sub)] pt-1 flex-wrap">
            <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>{selectedNotice.author}</span>
              {getAuthorRoleText(selectedNotice.author)}
            </span>
            <span>•</span>
            <span>{formatNoticeDate(selectedNotice.created_at)}</span>
          </div>

          {canWriteNotice && (
            <div className="mt-3 bg-[var(--inner-box)]/80 border border-[var(--panel-border)] rounded-lg p-2.5 sm:p-3 text-xs shadow-inner">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowReaders(!showReaders)}
              >
                <span className="font-bold text-xs sm:text-sm text-[var(--accent)] tracking-tight">
                  읽은 길드원 목록 ({readers.length}명)
                </span>
                <span className="text-[11px] text-[var(--text-sub)] font-medium">
                  {showReaders ? "접기 ▲" : "펼치기 ▼"}
                </span>
              </div>

              {showReaders && (
                <div className="mt-2 pt-2 border-t border-[var(--panel-border)] flex flex-wrap gap-1.5 sm:gap-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {readers.length === 0 ? (
                    <span className="text-[var(--text-sub)] text-[11px]">
                      아직 읽은 길드원이 없습니다.
                    </span>
                  ) : (
                    readers.map((r) => {
                      const { charName, mainClass } = getRepresentativeCharacterInfo(r.nickname);
                      return (
                        <div
                          key={r.nickname}
                          className="px-2 py-1 bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)]/50 rounded-md text-[11px] sm:text-xs font-medium text-[var(--text-main)] flex items-center gap-1.5 shadow-sm transition"
                        >
                          <ClassIcon job={mainClass} size="sm" />
                          <span className="font-bold text-[11px] sm:text-xs text-[var(--text-main)] truncate max-w-[100px]">
                            {charName}
                          </span>
                          <span className="text-[9.5px] sm:text-[10px] text-[var(--text-sub)] font-normal shrink-0">
                            ({formatTimeShort(r.read_at)})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          className="prose-editor min-h-[160px] text-[var(--text-main)] text-sm md:text-base leading-relaxed p-1 sm:p-2 box-border max-w-full overflow-hidden break-all [word-break:break-all] [overflow-wrap:anywhere] whitespace-normal [&_*]:whitespace-normal [&_*]:break-all [&_*]:[word-break:break-all] [&_*]:[overflow-wrap:anywhere] [&_*]:max-w-full [&_*]:box-border"
          dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
        />

        {selectedNotice.poll && (
          <div className="p-3 sm:p-4 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl space-y-3 my-4">
            <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
              <span>📊</span>
              <span>{selectedNotice.poll.title}</span>
            </h3>
            <div className="space-y-2">
              {selectedNotice.poll.options.map((opt) => {
                const userVoted = selectedNotice.poll?.userVotes?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => onVoteOption(opt.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      userVoted
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-main)]"
                        : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--text-sub)]"
                    }`}
                  >
                    <span className="break-all [word-break:break-all] [overflow-wrap:anywhere] pr-2">{opt.text}</span>
                    <span className="text-[11px] font-bold shrink-0">
                      {opt.votes || 0}표 {userVoted && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. 댓글 섹션 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 sm:p-5 md:p-7 shadow-lg space-y-4 sm:space-y-5">
        <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
          <span>💬</span>
          <span>댓글 ({countTotalComments(commentsTree)})</span>
        </h3>

        {/* 대대대댓글 지원 재귀 댓글 트리 */}
        <div className="space-y-3">
          {commentsTree.length === 0 ? (
            <p className="text-xs text-[var(--text-sub)] text-center py-6">
              첫 번째 댓글을 남겨보세요!
            </p>
          ) : (
            commentsTree.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                depth={0}
                currentNickname={currentNickname}
                canWriteNotice={canWriteNotice}
                accountsMap={accountsMap}
                dbCharacters={dbCharacters}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                formatTimeShort={formatTimeShort}
                onOpenTitleModal={handleOpenTitleModal}
              />
            ))
          )}
        </div>

        {/* 메인 댓글 작성란 */}
        <div className="pt-3 border-t border-[var(--panel-border)] space-y-2">
          <div className="text-xs text-[var(--text-sub)] font-semibold flex items-center gap-1.5">
            <span>작성자:</span>
            <span className="text-[var(--text-main)] font-bold">{currentNickname}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="댓글을 남겨주세요..."
              className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-3 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none resize-none custom-scrollbar"
            />

            <div className="flex sm:flex-col gap-1.5 sm:w-24 shrink-0">
              <button
                type="button"
                onClick={() => setShowMainEmojiPicker((prev) => !prev)}
                className={`flex-1 py-1.5 sm:py-0 border text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition ${
                  showMainEmojiPicker
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)]"
                }`}
              >
                😊 이모지
              </button>
              <button
                type="button"
                onClick={() => onAddComment(null)}
                className="flex-1 py-1.5 sm:py-0 bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black rounded-lg hover:opacity-90 transition shadow-xs cursor-pointer flex items-center justify-center"
              >
                등록
              </button>
            </div>
          </div>

          {showMainEmojiPicker && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--inner-box)] border border-[var(--accent)]/50 rounded-xl text-base shadow-lg max-h-40 overflow-y-auto custom-scrollbar animate-fadeIn mt-1">
              {PRESET_EMOJIS.map((emoji, idx) => (
                <button
                  key={`main-emoji-${idx}`}
                  type="button"
                  onClick={() => {
                    setNewCommentText(newCommentText + emoji);
                  }}
                  className="hover:scale-130 active:scale-90 transition p-1 cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {recentNoticesList.length > 0 && (
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider">
            다른 게시글 목록
          </h4>
          <div className="divide-y divide-[var(--panel-border)]">
            {recentNoticesList.map((rn) => (
              <div
                key={rn.id}
                onClick={() => onOpenNotice(rn)}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-[var(--inner-box)] px-2 rounded transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${getBadgeStyle(
                      rn.type,
                      rn.is_pinned
                    )}`}
                  >
                    {rn.type}
                  </span>
                  <span className="text-[var(--text-main)] font-medium truncate">
                    {rn.title}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-sub)] shrink-0">
                  {formatNoticeDate(rn.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🌸 순수 랭킹 칭호 팝업 모달 */}
      {activeTitleModal && (() => {
        const { titleName, author, job } = activeTitleModal;
        const details = generateTitleDetails(titleName, author, job);
        return (
          <div
            className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTitleModal(null);
            }}
          >
            <div
              className="bg-zinc-950 border border-amber-500/60 text-zinc-100 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
                <span className="font-black text-amber-400 text-sm flex items-center gap-1.5">
                  <span>👑</span> {details.title}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTitleModal(null)}
                  className="text-zinc-400 hover:text-white text-sm font-black p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-[0.62rem] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded mb-2.5 w-fit border border-zinc-800">
                {details.sourceText}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-amber-300 font-bold block text-[0.65rem] mb-0.5">📖 세계관 / 설명</span>
                  <p className="text-zinc-200 font-medium leading-relaxed text-[0.72rem]">{details.meaning}</p>
                </div>
                {details.tribute && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-amber-400 font-bold block text-[0.65rem] mb-0.5">📜 성역의 헌사</span>
                    <p className="text-zinc-300 italic font-medium leading-relaxed text-[0.72rem]">"{details.tribute}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}