"use client";

import '../globals.css';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

// ==========================================
// 1. 6대 카테고리 파스텔 & 네온 테마 정의
// ==========================================
const CATEGORY_THEMES: Record<string, any> = {
  TELOS: { // 🟣 텔로스 (파스텔 바이올렛)
    tabActive: 'bg-purple-600/90 text-white border-2 border-purple-400 shadow-md dark:bg-purple-800/80 dark:text-purple-100 dark:border-purple-400',
    titleActiveText: 'text-white font-black',
    subActiveText: 'text-purple-100 font-bold',
    text: 'text-purple-700 dark:text-purple-300 font-black', 
    tags: [
      'bg-purple-500/85 text-white border-2 border-purple-300 ring-2 ring-purple-300/30 font-black shadow-sm dark:bg-purple-700/80 dark:text-purple-100 dark:border-purple-400', 
      'bg-purple-100 text-purple-900 border-2 border-purple-400 font-extrabold dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-400', 
      'bg-purple-50/90 text-purple-900 border-[1.5px] border-purple-300 font-black dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-500', 
    ],
    borders: ['border-purple-400 dark:border-purple-400', 'border-purple-300 dark:border-purple-500', 'border-purple-300 dark:border-purple-600']
  },
  SYMPHONIA: { // 🟧 심포니아 (오렌지)
    tabActive: 'bg-orange-600/90 text-white border-2 border-orange-400 shadow-md dark:bg-orange-700/80 dark:text-orange-100 dark:border-orange-400',
    titleActiveText: 'text-white font-black',
    subActiveText: 'text-orange-100 font-bold',
    text: 'text-orange-600 dark:text-orange-400 font-black',
    tags: [
      'bg-orange-500/85 text-white border-2 border-orange-300 ring-2 ring-orange-300/30 font-black shadow-sm dark:bg-orange-700/80 dark:text-orange-100 dark:border-orange-400',
      'bg-orange-100 text-orange-900 border-2 border-orange-400 font-extrabold dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-400',
      'bg-orange-50/90 text-orange-900 border-[1.5px] border-orange-300 font-black dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-500',
    ],
    borders: ['border-orange-400 dark:border-orange-400', 'border-orange-300 dark:border-orange-500', 'border-orange-300 dark:border-orange-600']
  },
  KRATOS: { // 🔴 크라토스 (파스텔 로즈)
    tabActive: 'bg-rose-600/90 text-white border-2 border-rose-400 shadow-md dark:bg-rose-800/80 dark:text-rose-100 dark:border-rose-400',
    titleActiveText: 'text-white font-black',
    subActiveText: 'text-rose-100 font-bold',
    text: 'text-rose-700 dark:text-rose-300 font-black', 
    tags: [
      'bg-rose-500/85 text-white border-2 border-rose-300 ring-2 ring-rose-300/30 font-black shadow-sm dark:bg-rose-700/80 dark:text-rose-100 dark:border-rose-400',
      'bg-rose-100 text-rose-900 border-2 border-rose-400 font-extrabold dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-400',
      'bg-rose-50/90 text-rose-900 border-[1.5px] border-rose-300 font-black dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-500',
    ],
    borders: ['border-rose-400 dark:border-rose-400', 'border-rose-300 dark:border-rose-500', 'border-rose-300 dark:border-rose-600']
  },
  TECHNE: { // 🔵 테크네 (소프트 블루)
    tabActive: 'bg-sky-600/90 text-white border-2 border-sky-400 shadow-md dark:bg-sky-800/80 dark:text-sky-100 dark:border-sky-400',
    titleActiveText: 'text-white font-black',
    subActiveText: 'text-sky-100 font-bold',
    text: 'text-sky-700 dark:text-sky-300 font-black', 
    tags: [
      'bg-sky-500/85 text-white border-2 border-sky-300 ring-2 ring-sky-300/30 font-black shadow-sm dark:bg-sky-700/80 dark:text-sky-100 dark:border-sky-400',
      'bg-sky-100 text-sky-900 border-2 border-sky-400 font-extrabold dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-400',
      'bg-sky-50/90 text-sky-900 border-[1.5px] border-sky-300 font-black dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-500',
    ],
    borders: ['border-sky-400 dark:border-sky-400', 'border-sky-300 dark:border-sky-500', 'border-sky-300 dark:border-sky-600']
  },
  HARMONIA: { // 🟡 하르모니아 (골드)
    tabActive: 'bg-amber-500/90 text-slate-950 border-2 border-amber-300 shadow-md dark:bg-amber-600/80 dark:text-amber-100 dark:border-amber-300',
    titleActiveText: 'text-slate-950 dark:text-white font-black',
    subActiveText: 'text-amber-950 dark:text-amber-100 font-bold',
    text: 'text-amber-700 dark:text-amber-300 font-black', 
    tags: [
      'bg-amber-400/90 text-slate-950 border-2 border-amber-500 ring-2 ring-amber-300/30 font-black shadow-sm dark:bg-amber-600/80 dark:text-amber-100 dark:border-amber-300',
      'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-400',
      'bg-amber-50/90 text-amber-950 border-[1.5px] border-amber-300 font-black dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-500',
    ],
    borders: ['border-amber-400 dark:border-amber-400', 'border-amber-300 dark:border-amber-500', 'border-amber-300 dark:border-amber-600']
  },
  PIETAS: { // 🟢 피에타스 (에메랄드)
    tabActive: 'bg-emerald-600/90 text-white border-2 border-emerald-400 shadow-md dark:bg-emerald-800/80 dark:text-emerald-100 dark:border-emerald-400',
    titleActiveText: 'text-white font-black',
    subActiveText: 'text-emerald-100 font-bold',
    text: 'text-emerald-700 dark:text-emerald-300 font-black', 
    tags: [
      'bg-emerald-500/85 text-white border-2 border-emerald-300 ring-2 ring-emerald-300/30 font-black shadow-sm dark:bg-emerald-700/80 dark:text-emerald-100 dark:border-emerald-400',
      'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 font-extrabold dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-400',
      'bg-emerald-50/90 text-emerald-900 border-[1.5px] border-emerald-300 font-black dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500',
    ],
    borders: ['border-emerald-400 dark:border-emerald-400', 'border-emerald-300 dark:border-emerald-500', 'border-emerald-300 dark:border-emerald-600']
  }
};

const RANKING_INFO = {
  TELOS: { en: 'TELOS', kr: '텔로스', desc: '도달과 완성의 기록', sub: '종합 랭킹', stat: '종합 점수' },
  SYMPHONIA: { en: 'SYMPHONIA', kr: '심포니아', desc: '끈기와 노력의 기록', sub: '계정 랭킹', stat: '계정 총점' },
  KRATOS: { en: 'KRATOS', kr: '크라토스', desc: '힘과 권능의 기록', sub: '전투력 랭킹', stat: '전투력' },
  TECHNE: { en: 'TECHNĒ', kr: '테크네', desc: '기술과 숙련의 기록', sub: '생활력 랭킹', stat: '생활력' },
  HARMONIA: { en: 'HARMONIA', kr: '하르모니아', desc: '아름다움과 조화의 기록', sub: '매력 랭킹', stat: '매력' },
  PIETAS: { en: 'PIETAS', kr: '피에타스', desc: '헌신과 공헌의 기록', sub: '공헌도 랭킹', stat: '공헌도' },
};

const CLASS_GROUPS = [
  { name: '전사 계열', classes: ['전사', '대검전사', '검술사', '기사'] },
  { name: '마법사 계열', classes: ['마법사', '화염술사', '빙결술사', '전격술사'] },
  { name: '궁수 계열', classes: ['궁수', '장궁병', '석궁사수'] },
  { name: '힐러 계열', classes: ['힐러', '사제', '수도사', '암흑술사'] },
  { name: '음유시인 계열', classes: ['음유시인', '댄서', '악사'] },
  { name: '도적 계열', classes: ['도적', '격투가', '듀얼블레이드'] }
];

const CLASS_TITLES: Record<string, string[]> = {
  "전사": ["검투신", "검투왕", "검투사", "전사"],
  "대검전사": ["파괴신", "파괴왕", "광전사", "대검전사"],
  "검술사": ["검신", "검왕", "검성", "검술사"],
  "기사": ["수호신", "수호왕", "수호기사", "기사"],
  "마법사": ["마신", "대현자", "현자", "마법사"],
  "화염술사": ["화신", "염왕", "염마", "화염술사"],
  "빙결술사": ["빙신", "빙왕", "빙마", "빙결술사"],
  "전격술사": ["뢰신", "뇌왕", "뇌마", "전격술사"],
  "궁수": ["폭풍신", "폭풍왕", "화랑", "궁수"],
  "장궁병": ["신궁", "천궁", "명궁", "장궁병"],
  "석궁사수": ["파천궁신", "파천궁제", "파천사수", "석궁사수"],
  "음유시인": ["셰익스피어", "호메로스", "오르페우스", "음유시인"],
  "댄서": ["플로라비", "파피에르", "블루에트", "댄서"],
  "악사": ["마에스트로", "비르투오사", "솔리스트", "악사"],
  "힐러": ["그라시아", "베네딕토", "렐릭스", "힐러"],
  "사제": ["메시아", "디바인", "프리스트", "사제"],
  "수도사": ["아라한", "금강", "나한", "수도사"],
  "암흑술사": ["암제", "암왕", "암마", "암흑술사"],
  "도적": ["독왕", "트릭스터", "땅거미", "도적"],
  "격투가": ["권신", "권왕", "권호", "격투가"],
  "듀얼블레이드": ["유성천침", "쌍극난무", "질풍쌍화", "듀얼블레이드"],
};

const TOP_TITLES = {
  TELOS: ['헬리오스', '셀레네', '에오스'],
  SYMPHONIA: ['아르콘', '헬릭스', '메로스'],
  PIETAS: ['시리우스', '레굴루스', '알데바란'],
  TECHNE: ['폴리매스', '마이스터', '아르티장'],
  HARMONIA: ['아글라이아', '카리스', '칼로스'],
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

const TRIBUTE_MESSAGES = {
  TELOS: {
    1: "모든 시련을 극복하고 만물의 이치를 깨우친 절대자여. 완벽한 밸런스로 도달한 그대의 궁극적인 경지는 성역의 영원한 신화로 기록될 것입니다.",
    2: "정상의 옥좌를 턱밑까지 추격한 초월자. 다방면으로 갈고닦은 그대의 끈질긴 집념은 차기 성역의 지배자를 예고하고 있습니다.",
    3: "균형과 완성의 길을 걷는 위대한 선구자. 다방면에서 이룩한 눈부신 성취는 숱한 별들에게 성역이 나아가야 할 궁극의 길을 제시합니다."
  },
  SYMPHONIA: {
    1: "변함없는 끈기와 피나는 노력으로 모든 영웅을 완벽하게 다듬어낸 계정의 정점. 그대의 거대한 결실은 성역 전체의 굵직한 이정표입니다.",
    2: "포기하지 않는 집념으로 계정 내 모든 영웅을 훌륭하게 성숙시킨 노력의 화신. 그대의 묵묵한 행보는 성역의 귀감이 됩니다.",
    3: "시간과 열정을 쏟아부어 견고하게 계정을 다져낸 헌신자. 끊임없는 노력으로 세운 성취는 그 어떤 풍파에도 흔들리지 않습니다."
  },
  TECHNE: {
    1: "무에서 유를 창조하는 창조신이여. 굳은살 박인 손끝에서 탄생한 걸작들과 막대한 부는 성역의 거대한 경제를 홀로 떠받치고 있습니다.",
    2: "불과 쇠, 흙과 나무를 지배하는 경이로운 장인. 숱한 밤을 지새우며 흘린 그대의 고귀한 땀방울이 성역을 눈부시게 발전시켰습니다.",
    3: "인고의 시간을 견뎌내고 예술의 경지에 오른 마에스트로. 그대가 생산해내는 모든 자원은 성역이 살아 숨 쉬게 하는 강력한 심장입니다."
  },
  HARMONIA: {
    1: "숨이 멎을 듯한 자태로 만인을 굴복시킨 절대적인 미(美)의 화신. 그대가 걸음을 내디딜 때마다 성역의 모든 별들이 매혹되어 빛을 잃습니다.",
    2: "거부할 수 없는 우아함과 기품을 흩뿌리는 매혹의 지배자. 사람들의 시선과 마음을 훔친 그대의 찬란한 오라는 성역의 아름다운 풍경입니다.",
    3: "내면과 외면이 완벽한 조화를 이룬 고결한 우상. 수많은 이들의 사랑을 한몸에 받는 그대의 미소는 성역의 지친 영혼들을 치유합니다."
  },
  PIETAS: {
    1: "자신의 뼈를 깎아 성역의 굳건한 성벽을 세운 영웅이여! 누구도 알아주지 않는 곳에서 흘린 그대의 피와 땀이 지금의 위대한 성역을 만들었습니다.",
    2: "길드를 위해 기꺼이 자신을 희생한 고결한 등대. 그대의 숭고한 헌신과 책임감이 없었다면 성역은 결코 이토록 단단해질 수 없을 것입니다.",
    3: "형제들을 위해 궂은일을 도맡는 성역의 진정한 수호자. 묵묵히 길드의 초석을 다지는 그대의 이타심에 모두가 깊은 경의를 표합니다."
  }
};

const KRATOS_LORE: Record<string, { meaning: string, tribute: string }> = {
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

const generateLore = (title: string, rank: number, job: string, category: keyof typeof RANKING_INFO) => {
  let meaning = "";
  let tribute = "";

  if (category === 'KRATOS') {
    const customLore = KRATOS_LORE[title];
    if (customLore) {
      meaning = customLore.meaning;
      tribute = customLore.tribute;
    } else {
      meaning = `끝없는 투지로 전장을 누비는 ${job}입니다.`;
      tribute = `성역을 위해 무기를 든 자랑스러운 전사.`;
    }
  } else {
    meaning = LORE_DICTIONARY[title] || `${title}의 경지에 오른 자입니다.`;
    tribute = (TRIBUTE_MESSAGES as any)[category]?.[rank] || "꾸준한 노력과 의지로 성역의 발전에 이바지하는 자입니다.";
  }

  const categoryEn = RANKING_INFO[category]?.en || category;

  const sourceText = category === 'KRATOS' 
    ? `『${categoryEn}』 [${job}] ${rank <= 3 ? rank + '위' : '랭커'} 칭호`
    : `『${categoryEn}』 ${rank <= 3 ? rank + '위' : '랭커'} 칭호`;

  return { title, meaning, tribute, rank, sourceText };
};

interface Character {
  id: string; name: string; owner: string; job: string;
  combatPower: number; magicResist: number; lifePower: number; charm: number; contribution: number;
  isMain: boolean; status: '생텀 접속중' | '인게임' | '오프라인'; lastSeen?: string;
  pendingTasks?: string[];
  // 각 카테고리별 서버 순위 데이터 구조
  rankings?: Record<string, { overall: number; deian: number }>;
  serverRankOverall?: number; serverRankDeian?: number;
}

interface AccountRankItem {
  owner: string;
  charCount: number;
  totalScore: number;
  totalCombat: number;
  totalLife: number;
  totalCharm: number;
  mainCharName: string;
  mainCharJob: string;
}

function AgoraLoungeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);

  const [activeMainTab, setActiveMainTab] = useState<'PANTHEON' | 'ASTRA'>('PANTHEON');
  const [activeRankTab, setActiveRankTab] = useState<keyof typeof RANKING_INFO>('TELOS');
  
  const [selectedClass, setSelectedClass] = useState<string>("전체"); 
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isMobileFilterModalOpen, setIsMobileFilterModalOpen] = useState(false);

  const [openHoverTooltipId, setOpenHoverTooltipId] = useState<string | null>(null);
  const [openClickTooltipId, setOpenClickTooltipId] = useState<string | null>(null);

  useEffect(() => { 
    setMounted(true); 
    fetchServerData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "ASTRA") {
      setActiveMainTab("ASTRA");
    } else if (tabParam === "PANTHEON") {
      setActiveMainTab("PANTHEON");
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'PANTHEON' | 'ASTRA') => {
    setActiveMainTab(tab);
    router.replace(`/lounge?tab=${tab}`, { scroll: false });
  };

  const fetchServerData = async () => {
    try {
      const { data, error } = await supabase.from('characters').select('*');
      if (data && !error) {
        const mappedData: Character[] = data.map((c: any) => ({
          id: c.nickname, name: c.nickname, owner: c.owner || c.nickname, job: c.job || '전사',
          combatPower: Number(c.combat_power) || 0, magicResist: Number(c.magic_resistance) || 0,
          lifePower: Number(c.life_energy) || 0, charm: Number(c.charm) || 0,
          contribution: Number(c.contribution) || 0, isMain: c.is_main || false,
          status: '오프라인', lastSeen: '최근 업데이트 됨', pendingTasks: [],
          rankings: c.rankings || {},
          serverRankOverall: c.rankings?.[activeRankTab]?.overall ?? c.server_rank_overall ?? 0,
          serverRankDeian: c.rankings?.[activeRankTab]?.deian ?? c.server_rank_deian ?? 0
        }));
        setDbCharacters(mappedData);
      }
    } catch (err) {
      console.error("데이터를 불러오는데 실패했습니다.", err);
    }
  };

  const getScore = (c: Character, type: keyof typeof RANKING_INFO) => {
    switch(type) {
      case 'KRATOS': return Number(c.combatPower); 
      case 'TECHNE': return Number(c.lifePower);
      case 'HARMONIA': return Number(c.charm);
      case 'TELOS': return Number(c.combatPower) + Number(c.lifePower) + Number(c.charm);
      case 'PIETAS': return Number(c.contribution);
      default: return 0;
    }
  };

  const getAccountRankings = (): AccountRankItem[] => {
    const accountMap: Record<string, AccountRankItem> = {};

    dbCharacters.forEach(c => {
      const ownerKey = (c.owner && c.owner.trim() !== "") ? c.owner.trim() : c.name;
      const cCombat = Number(c.combatPower) || 0;
      const cLife = Number(c.lifePower) || 0;
      const cCharm = Number(c.charm) || 0;
      const charTotalScore = cCombat + cLife + cCharm;

      if (!accountMap[ownerKey]) {
        accountMap[ownerKey] = {
          owner: ownerKey,
          charCount: 0,
          totalScore: 0,
          totalCombat: 0,
          totalLife: 0,
          totalCharm: 0,
          mainCharName: c.name,
          mainCharJob: c.job
        };
      }

      const acc = accountMap[ownerKey];
      acc.charCount += 1;
      
      acc.totalCombat += cCombat;
      acc.totalLife += cLife;
      acc.totalCharm += cCharm;
      acc.totalScore += charTotalScore;

      if (c.isMain) {
        acc.mainCharName = c.name;
        acc.mainCharJob = c.job;
      }
    });

    return Object.values(accountMap).sort((a, b) => b.totalScore - a.totalScore);
  };

  const getAllSortedCharacters = () => {
    return [...dbCharacters].sort((a, b) => getScore(b, activeRankTab) - getScore(a, activeRankTab));
  };

  const getRankedCharacters = () => {
    let chars = getAllSortedCharacters();
    if (selectedClass !== "전체") chars = chars.filter(c => c.job === selectedClass);
    return chars;
  };

  const getAllEarnedTitles = (char: Character) => {
    const titles: { type: string, name: string, rank: number, theme: any }[] = [];
    
    const pushIfTop3 = (type: keyof typeof RANKING_INFO, titleArr: string[]) => {
      if (type === 'SYMPHONIA') {
        const accList = getAccountRankings();
        const rank = accList.findIndex(a => a.owner === (char.owner || char.name));
        if (rank >= 0 && rank < 3) {
          titles.push({ type: 'SYMPHONIA', name: TOP_TITLES.SYMPHONIA[rank], rank: rank + 1, theme: CATEGORY_THEMES.SYMPHONIA });
        }
        return;
      }

      const rank = [...dbCharacters].sort((a,b) => getScore(b, type) - getScore(a, type)).findIndex(c => c.id === char.id);
      if(rank >= 0 && rank < 3) {
        titles.push({ type, name: titleArr[rank], rank: rank + 1, theme: CATEGORY_THEMES[type] });
      }
    };

    pushIfTop3('TELOS', TOP_TITLES.TELOS);
    pushIfTop3('SYMPHONIA', TOP_TITLES.SYMPHONIA);
    pushIfTop3('PIETAS', TOP_TITLES.PIETAS);

    const kratosRank = [...dbCharacters].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id);
    const kTitles = CLASS_TITLES[char.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) {
        titles.push({ type: 'KRATOS', name: kTitles[kratosRank], rank: kratosRank + 1, theme: CATEGORY_THEMES.KRATOS });
      } else {
        titles.push({ type: 'KRATOS', name: kTitles[3], rank: 4, theme: {
          tags: [
            'bg-zinc-100 text-zinc-950 border-zinc-400 font-bold dark:bg-[var(--inner-box)] dark:text-[var(--text-sub)] dark:border-[var(--panel-border)]',
            'bg-zinc-100 text-zinc-950 border-zinc-400 font-bold dark:bg-[var(--inner-box)] dark:text-[var(--text-sub)] dark:border-[var(--panel-border)]',
            'bg-zinc-100 text-zinc-950 border-zinc-400 font-bold dark:bg-[var(--inner-box)] dark:text-[var(--text-sub)] dark:border-[var(--panel-border)]'
          ],
          borders: ['border-zinc-400 dark:border-[var(--panel-border)]'],
          text: 'text-zinc-950 dark:text-[var(--text-sub)]'
        } });
      }
    }

    pushIfTop3('TECHNE', TOP_TITLES.TECHNE);
    pushIfTop3('HARMONIA', TOP_TITLES.HARMONIA);

    return titles;
  };

  const getTop3BorderClass = (rank: number) => {
    if (rank === 1) return 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]';
    if (rank === 2) return 'border-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.4)]';
    if (rank === 3) return 'border-amber-700 shadow-[0_0_6px_rgba(180,83,9,0.3)]';
    return 'border-[var(--panel-border)]';
  };

  const renderRankButton = (key: keyof typeof RANKING_INFO) => {
    const info = RANKING_INFO[key];
    const isActive = activeRankTab === key;
    const theme = CATEGORY_THEMES[key];
    
    return (
      <button 
        key={key} 
        onClick={() => setActiveRankTab(key)} 
        className={`group relative h-10 sm:h-12 rounded-xl border transition-all overflow-hidden cursor-pointer ${
          isActive ? theme.tabActive : 'bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] opacity-85 hover:opacity-100'
        }`}
      >
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${isActive ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <span className={`font-black ${theme.text} text-[0.7rem] sm:text-xs leading-tight`}>{info.kr}</span>
          <span className={`text-[0.48rem] sm:text-[0.5rem] font-bold text-[var(--text-sub)]`}>{info.sub}</span>
        </div>

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isActive ? '!translate-y-0 !opacity-100' : ''}`}>
          <span className={`font-black tracking-wider ${isActive ? theme.titleActiveText : 'text-[var(--text-main)]'} text-[0.68rem] sm:text-xs`}>{info.en}</span>
        </div>
      </button>
    );
  };

  if (!mounted) return null;

  const allSortedCharacters = getAllSortedCharacters();
  const rankedCharacters = getRankedCharacters();
  const accountRankings = getAccountRankings();
  const mainCharacters = dbCharacters.filter(c => c.isMain).sort((a, b) => b.combatPower - a.combatPower);

  return (
    <div className="w-full text-[var(--text-main)] font-sans pb-10 relative">
      
      {openClickTooltipId && (
        <div className="fixed inset-0 z-[80]" onClick={() => setOpenClickTooltipId(null)}></div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-5 relative z-10">
        
        {/* 헤더 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-2.5 px-3.5 sm:px-5 shadow-sm transition-colors flex flex-row items-center justify-between gap-2 mb-2">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-wider leading-none flex items-center gap-2">
              <span>AGORA</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--accent)] tracking-normal">
                아고라 : 길드 라운지
              </span>
            </h1>

            <div className="flex items-center gap-1 ml-1">
              <button 
                onClick={() => setShowLoreGuide(true)} 
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer text-[0.65rem] font-bold shrink-0" 
                title="명칭 가이드 보기"
              >
                ?
              </button>

              <button 
                onClick={() => setShowInfoModal(true)} 
                className="md:hidden w-5 h-5 flex items-center justify-center rounded-full bg-[var(--inner-box)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition cursor-pointer text-[0.65rem] font-black italic shrink-0" 
                title="아고라 소개 보기"
              >
                i
              </button>
            </div>
          </div>
          
          <div className="hidden md:flex bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 rounded-lg text-xs text-[var(--text-sub)] font-medium items-start gap-2 shrink-0">
            <span className="text-sm shrink-0 leading-none mt-0.5">🏛️</span>
            <div className="flex flex-col gap-0.5 leading-snug">
              <span>고대 그리스의 대광장 아고라. 성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.</span>
              <span className="text-[var(--accent)] font-semibold">성역의 모든 별을 아스트라에 새기고, 빛나는 결실을 판테온에 기립니다.</span>
            </div>
          </div>
        </header>

        {/* 모바일전용 (i) 모달 */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/75 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInfoModal(false)}>
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-xl max-w-xs w-full p-4 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">✕</button>
              <h3 className="text-sm font-black text-[var(--accent)] mb-2 flex items-center gap-1.5">
                <span>🏛️</span> 아고라 안내
              </h3>
              <div className="space-y-1.5 text-xs text-[var(--text-main)] leading-relaxed font-medium border-t border-[var(--panel-border)] pt-2.5">
                <p>고대 그리스의 대광장 아고라.</p>
                <p>성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.</p>
                <p className="text-[var(--accent)] font-bold pt-1 border-t border-[var(--panel-border)]/50">성역의 모든 별을 아스트라에 새기고, 빛나는 결실을 판테온에 기립니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* SANCTUM 명칭 가이드 모달 */}
        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl relative custom-scrollbar" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)] text-lg font-bold cursor-pointer">✕</button>
              <h2 className="text-base sm:text-lg font-black text-[var(--accent)] mb-3 border-b border-[var(--panel-border)] pb-2 flex items-center gap-2">
                <span>🏛️</span> SANCTUM 명칭 가이드
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
                <div>
                  <h3 className="font-bold text-sm text-[var(--accent)] mb-0.5">AGORA (아고라 / 길드 라운지)</h3>
                  <p className="text-[var(--text-sub)] text-xs">성역의 모든 구성원이 함께 모이고 소통하는 중심 공간입니다.</p>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--accent)] mb-0.5">ASTRA (아스트라 / 길드원 현황)</h3>
                  <p className="text-[var(--text-sub)] text-xs">한 명 한 명이 하나의 별이며, 모두가 함께 성역을 이룹니다.</p>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--accent)] mb-0.5">PANTHEON (판테온 / 성역 랭킹)</h3>
                  <p className="text-[var(--text-sub)] text-xs mb-1">성역의 명예의 전당입니다. 6개의 명예 기록으로 나뉩니다.</p>
                  <ul className="space-y-1 pl-2.5 border-l-2 border-[var(--accent)] text-xs">
                    <li><strong className="text-purple-700 dark:text-purple-400">TELOS (텔로스)</strong>: 캐릭터 종합 랭킹</li>
                    <li><strong className="text-orange-600 dark:text-orange-400">SYMPHONIA (심포니아)</strong>: 계정 통합 랭킹</li>
                    <li><strong className="text-rose-700 dark:text-rose-400">KRATOS (크라토스)</strong>: 전투력 랭킹</li>
                    <li><strong className="text-sky-700 dark:text-sky-400">TECHNĒ (테크네)</strong>: 생활력 랭킹</li>
                    <li><strong className="text-amber-800 dark:text-amber-400">HARMONIA (하르모니아)</strong>: 매력 랭킹</li>
                    <li><strong className="text-emerald-800 dark:text-emerald-400">PIETAS (피에타스)</strong>: 공헌도 랭킹</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 세그먼트 버튼 */}
        <div className="bg-[var(--inner-box)] border-2 border-[var(--panel-border)] p-1 rounded-2xl flex gap-1.5 shadow-sm">
          <button 
            onClick={() => handleTabChange('PANTHEON')} 
            className={`flex-1 h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'PANTHEON' 
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border border-[var(--accent)] scale-[1.01]' 
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
            }`}
          >
            <span className="text-base sm:text-lg">🏛️</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-black tracking-wider">PANTHEON</span>
              <span className={`text-[0.55rem] font-bold ${activeMainTab === 'PANTHEON' ? 'text-[var(--accent-fg)] opacity-90' : 'text-[var(--text-sub)]'}`}>판테온 (성역 랭킹)</span>
            </div>
          </button>

          <button 
            onClick={() => handleTabChange('ASTRA')} 
            className={`flex-1 h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'ASTRA' 
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border border-[var(--accent)] scale-[1.01]' 
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
            }`}
          >
            <span className="text-base sm:text-lg">✦</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-black tracking-wider">ASTRA</span>
              <span className={`text-[0.55rem] font-bold ${activeMainTab === 'ASTRA' ? 'text-[var(--accent-fg)] opacity-90' : 'text-[var(--text-sub)]'}`}>아스트라 (길드원 현황)</span>
            </div>
          </button>
        </div>

        {/* 1. PANTHEON (성역 랭킹) 뷰 */}
        {activeMainTab === 'PANTHEON' && (
          <section className="space-y-3 animate-in fade-in duration-200">
            
            <div className="grid md:hidden grid-cols-3 gap-1.5">
              {['TELOS', 'SYMPHONIA', 'PIETAS', 'KRATOS', 'TECHNE', 'HARMONIA'].map(k => renderRankButton(k as any))}
            </div>

            <div className="hidden md:grid grid-cols-6 gap-2">
              {['TELOS', 'SYMPHONIA', 'KRATOS', 'TECHNE', 'HARMONIA', 'PIETAS'].map(k => renderRankButton(k as any))}
            </div>

            {/* 모바일 타이틀 */}
            <div className="md:hidden flex items-center justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-black ${CATEGORY_THEMES[activeRankTab].text}`}>
                  {RANKING_INFO[activeRankTab].en}
                </span>
                <span className="text-[0.62rem] font-bold text-[var(--text-sub)]">
                  「 {RANKING_INFO[activeRankTab].desc} 」
                </span>
              </div>
              {activeRankTab !== 'SYMPHONIA' && (
                <button 
                  onClick={() => setIsMobileFilterModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-black text-[0.65rem] shadow-sm cursor-pointer shrink-0"
                >
                  <span>🔍</span>
                  {selectedClass !== "전체" ? <span>[{selectedClass}]</span> : <span>필터</span>}
                </button>
              )}
            </div>

            {/* 데스크톱 타이틀 */}
            <div className="hidden md:block text-center py-0.5">
              <h2 className={`text-2xl font-black tracking-widest flex justify-center items-center gap-2 ${CATEGORY_THEMES[activeRankTab].text}`}>
                {RANKING_INFO[activeRankTab].en}
              </h2>
              <p className="text-[var(--text-sub)] text-xs mt-0.5 font-bold">「 {RANKING_INFO[activeRankTab].desc} 」</p>
            </div>

            {activeRankTab !== 'SYMPHONIA' && (
              <div className="hidden md:block bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-2 shadow-sm">
                <button 
                  onClick={() => { if (selectedClass === "전체" && !isClassFilterOpen) setIsClassFilterOpen(true); else { setSelectedClass("전체"); setIsClassFilterOpen(false); } }} 
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedClass === "전체" && !isClassFilterOpen 
                      ? 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)]' 
                      : 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-sm'
                  }`}
                >
                  {selectedClass === "전체" && !isClassFilterOpen ? '🔍 클래스별 필터링 펼치기 ▼' : '✨ 전체 클래스 통합 랭킹 보기 ↺'}
                </button>

                {isClassFilterOpen && (
                  <div className="grid grid-cols-6 gap-1.5 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    {CLASS_GROUPS.map((group) => (
                      <div key={group.name} className="bg-[var(--inner-box)] p-1.5 rounded-lg border border-[var(--panel-border)] flex flex-col gap-1">
                        <div className="text-[0.55rem] font-black text-[var(--text-sub)] px-1">{group.name}</div>
                        <div className="flex flex-col gap-0.5">
                          {group.classes.map(cls => (
                            <button 
                              key={cls} 
                              onClick={() => setSelectedClass(cls)} 
                              className={`px-2 py-0.5 rounded text-[0.65rem] font-bold text-left transition cursor-pointer ${
                                selectedClass === cls 
                                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-black' 
                                  : 'text-[var(--text-sub)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              {cls}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 🟧 SYMPHONIA (계정 통합 랭킹) */}
            {activeRankTab === 'SYMPHONIA' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {accountRankings.map((acc, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const titleName = isTop3 ? TOP_TITLES.SYMPHONIA[rank - 1] : '';
                  const theme = CATEGORY_THEMES.SYMPHONIA;
                  const tagClass = isTop3 ? theme.tags[rank - 1] : 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)]';
                  const top3Border = getTop3BorderClass(rank);

                  return (
                    <div key={acc.owner} className={`relative bg-[var(--panel)] border ${top3Border} rounded-xl p-2.5 md:p-4 transition-all hover:border-[var(--accent)] z-10`}>
                      <div className="md:hidden flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-1.5 py-0.2 rounded text-[0.6rem] font-black shrink-0 ${
                              rank === 1 ? 'bg-amber-400 text-black' :
                              rank === 2 ? 'bg-slate-300 text-black' :
                              rank === 3 ? 'bg-amber-700 text-white' : 'bg-[var(--inner-box)] text-[var(--text-sub)]'
                            }`}>
                              #{rank}
                            </span>
                            {titleName && <span className={`text-[0.55rem] px-1.5 py-0.2 rounded shrink-0 border ${tagClass}`}>{titleName}</span>}
                            <span className="font-black text-sm text-[var(--text-main)] truncate">{acc.owner}</span>
                            <span className="text-[0.6rem] text-orange-500 dark:text-orange-400 shrink-0 font-bold">[{acc.charCount}캐릭]</span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[0.55rem] text-[var(--text-sub)] font-bold block leading-none">계정 총점</span>
                            <span className="text-xs sm:text-sm font-black text-[var(--accent)] leading-tight">{acc.totalScore.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-[0.62rem] sm:text-xs font-bold text-center bg-[var(--inner-box)] p-1.5 rounded-lg border border-[var(--panel-border)]">
                          <div>
                            <span className="text-red-400 block font-semibold leading-tight">계정 총 전투력</span>
                            <span className="text-[var(--text-main)] font-black text-[0.7rem] sm:text-xs">{acc.totalCombat.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-emerald-400 block font-semibold leading-tight">계정 총 생활력</span>
                            <span className="text-[var(--text-main)] font-black text-[0.7rem] sm:text-xs">{acc.totalLife.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-pink-400 block font-semibold leading-tight">계정 총 매력</span>
                            <span className="text-[var(--text-main)] font-black text-[0.7rem] sm:text-xs">{acc.totalCharm.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col gap-2">
                        <div className={`absolute right-0 top-0 w-10 h-10 rounded-bl-xl rounded-tr-xl flex items-center justify-center font-black text-sm shadow-sm ${
                          rank === 1 ? 'bg-amber-400 text-black' :
                          rank === 2 ? 'bg-slate-300 text-black' :
                          rank === 3 ? 'bg-amber-700 text-white' : 'bg-[var(--inner-box)] text-[var(--text-sub)]'
                        }`}>
                          #{rank}
                        </div>

                        <div className="pr-10">
                          {titleName && <span className={`text-[0.62rem] px-1.5 py-0.5 rounded mb-1 inline-flex items-center gap-1 border ${tagClass}`}>{titleName}</span>}
                          <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-1.5">{acc.owner}</h3>
                          <div className="text-[0.65rem] text-[var(--text-sub)] font-bold mt-0.5">
                            대표: {acc.mainCharName} ({acc.mainCharJob}) · 총 {acc.charCount}개 캐릭터
                          </div>
                        </div>

                        <div className="bg-[var(--inner-box)] p-2.5 rounded-lg border border-[var(--panel-border)] mt-0.5 space-y-1.5">
                          <div className="flex justify-between items-end border-b border-[var(--panel-border)] pb-1">
                            <span className="text-[var(--text-sub)] text-[0.65rem] font-bold">계정 통합 총점</span>
                            <span className="font-black text-[var(--accent)] text-base leading-none">{acc.totalScore.toLocaleString()}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-[0.6rem] font-bold text-center">
                            <div className="bg-[var(--panel)] p-1 rounded border border-[var(--panel-border)]">
                              <span className="text-red-400 block text-[0.55rem]">계정 총 전투력</span>
                              <span className="font-black text-[var(--text-main)]">{acc.totalCombat.toLocaleString()}</span>
                            </div>
                            <div className="bg-[var(--panel)] p-1 rounded border border-[var(--panel-border)]">
                              <span className="text-emerald-400 block text-[0.55rem]">계정 총 생활력</span>
                              <span className="font-black text-[var(--text-main)]">{acc.totalLife.toLocaleString()}</span>
                            </div>
                            <div className="bg-[var(--panel)] p-1 rounded border border-[var(--panel-border)]">
                              <span className="text-pink-400 block text-[0.55rem]">계정 총 매력</span>
                              <span className="font-black text-[var(--text-main)]">{acc.totalCharm.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 2. 일반 캐릭터 랭킹 */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {rankedCharacters.map((char) => {
                  const earnedTitles = getAllEarnedTitles(char);
                  const currentRankTitleInfo = earnedTitles.find(t => t.type === activeRankTab);
                  const currentRankTitle = currentRankTitleInfo?.name || '';
                  const score = getScore(char, activeRankTab);
                  
                  const categoryRank = allSortedCharacters.findIndex(c => c.id === char.id) + 1;
                  const classRank = activeRankTab === 'KRATOS' ? [...dbCharacters].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id) + 1 : categoryRank;
                  const rankToUse = activeRankTab === 'KRATOS' ? classRank : categoryRank;
                  
                  const hoverTooltipId = `hover-${char.id}-${activeRankTab}`;
                  const isHoverTooltipOpen = openHoverTooltipId === hoverTooltipId;
                  const isClickTooltipOpenForThisCard = openClickTooltipId?.includes(`-${char.id}-`) && openClickTooltipId?.includes('-PANTHEON');
                  const isTooltipActiveOnCard = isHoverTooltipOpen || isClickTooltipOpenForThisCard;
                  
                  const topLoreData = generateLore(currentRankTitle, rankToUse, char.job, activeRankTab);
                  const topTheme = CATEGORY_THEMES[activeRankTab];
                  
                  const isTopRanked = rankToUse <= 3;
                  const topTagClass = isTopRanked ? topTheme.tags[rankToUse - 1] : 'bg-zinc-100 text-zinc-950 border-zinc-400 font-bold dark:bg-[var(--inner-box)] dark:text-[var(--text-sub)] dark:border-[var(--panel-border)]';
                  const top3Border = getTop3BorderClass(categoryRank);

                  // 해당 탭에 맞는 서버 순위 데이터 추출
                  const rankData = char.rankings?.[activeRankTab] || { overall: char.serverRankOverall, deian: char.serverRankDeian };

                  return (
                    <div 
                      key={char.id} 
                      className={`relative bg-[var(--panel)] border ${top3Border} rounded-xl p-2.5 md:p-4 transition-all hover:border-[var(--accent)] ${
                        isTooltipActiveOnCard ? 'z-[60]' : 'z-10'
                      }`}
                    >
                      {/* 모바일 카드 */}
                      <div className="md:hidden flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-1.5 py-0.2 rounded text-[0.6rem] font-black shrink-0 ${
                              categoryRank === 1 ? 'bg-amber-400 text-black' :
                              categoryRank === 2 ? 'bg-slate-300 text-black' :
                              categoryRank === 3 ? 'bg-amber-700 text-white' : 'bg-[var(--inner-box)] text-[var(--text-sub)]'
                            }`}>
                              #{categoryRank}
                            </span>

                            {currentRankTitle && (
                              <span className={`text-[0.55rem] px-1 py-0.2 rounded shrink-0 border ${topTagClass}`}>
                                {currentRankTitle}
                              </span>
                            )}

                            <span className="font-black text-sm text-[var(--text-main)] truncate">{char.name}</span>
                            <span className="text-[0.6rem] text-[var(--text-sub)] shrink-0 font-bold">{char.job}</span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[0.55rem] text-[var(--text-sub)] font-bold block leading-none">{RANKING_INFO[activeRankTab].stat}</span>
                            <span className="text-xs font-black text-[var(--accent)] leading-tight">{score.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* 칭호 목록 */}
                        <div className="flex flex-wrap gap-1 relative">
                          {earnedTitles.map(t => {
                            const clickId = `click-${char.id}-${t.type}-PANTHEON`;
                            const isClicked = openClickTooltipId === clickId;
                            const loreData = generateLore(t.name, t.rank, char.job, t.type as any);
                            const isRankedTitle = t.rank <= 3;
                            const tagClass = isRankedTitle ? t.theme.tags[t.rank - 1] : t.theme.tags[0];
                            const borderClass = isRankedTitle ? t.theme.borders[t.rank - 1] : t.theme.borders[0];

                            return (
                              <div key={t.type} className="relative inline-block">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenClickTooltipId(isClicked ? null : clickId); }}
                                  className={`text-[0.55rem] px-1 py-0.2 rounded border flex items-center gap-1 cursor-pointer transition-all ${tagClass} ${isClicked ? 'ring-2 ring-black/30 dark:ring-white/50 z-10' : 'opacity-95'}`}
                                >
                                  {t.name}
                                </button>

                                {isClicked && (
                                  <div className={`absolute top-[calc(100%+4px)] left-0 w-[260px] bg-[var(--panel)] border-2 ${borderClass} rounded-xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default text-[var(--text-main)]`} onClick={e => e.stopPropagation()}>
                                    <div className={`absolute -top-1.5 left-3 w-2 h-2 bg-[var(--panel)] border-t-2 border-l-2 ${borderClass} transform rotate-45`}></div>
                                    <div className="relative z-10 flex flex-col gap-1.5 text-left">
                                      <span className={`font-black ${t.theme.text} text-[0.7rem] tracking-wide whitespace-nowrap`}>[{loreData.title}]</span>
                                      <p className="text-[0.58rem] font-bold text-[var(--text-main)] leading-snug break-keep">{loreData.meaning}</p>
                                      <p className="text-[0.58rem] font-bold text-[var(--text-sub)] leading-relaxed break-keep border-t border-[var(--panel-border)] pt-1">{loreData.tribute}</p>
                                      <div className="mt-1 py-1 px-2 bg-[var(--inner-box)] border border-[var(--panel-border)]/60 rounded-lg text-center text-[0.58rem] font-black text-[var(--accent)] whitespace-nowrap">
                                        {loreData.sourceText}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 📌 모바일 순위 명칭 수정: 통합 순위 & 데이안 순위 */}
                        {activeRankTab !== 'PIETAS' && (
                          <div className="flex items-center justify-between text-[0.55rem] font-bold text-[var(--text-sub)] bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)]">
                            <span>통합 순위: <strong className="text-[var(--text-main)]">{rankData.overall ? `#${rankData.overall.toLocaleString()}` : '집계중'}</strong></span>
                            <span>데이안 순위: <strong className="text-[var(--text-main)]">{rankData.deian ? `#${rankData.deian.toLocaleString()}` : '집계중'}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* 데스크톱 카드 */}
                      <div className="hidden md:flex flex-col gap-2">
                        <div className={`absolute right-0 top-0 w-10 h-10 rounded-bl-xl rounded-tr-xl flex items-center justify-center font-black text-sm shadow-sm ${
                          categoryRank === 1 ? 'bg-amber-400 text-black' :
                          categoryRank === 2 ? 'bg-slate-300 text-black' :
                          categoryRank === 3 ? 'bg-amber-700 text-white' : 'bg-[var(--inner-box)] text-[var(--text-sub)]'
                        }`}>
                          #{categoryRank}
                        </div>

                        <div className="pr-10">
                          {currentRankTitle && rankToUse <= 3 ? (
                            <div 
                              className="relative inline-block mb-1"
                              onMouseEnter={() => setOpenHoverTooltipId(hoverTooltipId)}
                              onMouseLeave={() => setOpenHoverTooltipId(null)}
                            >
                              <span className={`text-[0.62rem] px-1.5 py-0.5 rounded inline-flex items-center gap-1 cursor-help border ${topTagClass}`}>
                                {currentRankTitle}
                              </span>

                              {isHoverTooltipOpen && (
                                <div className={`absolute top-[calc(100%+4px)] left-0 w-[260px] bg-[var(--panel)] border-2 ${getTop3BorderClass(rankToUse)} rounded-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default text-[var(--text-main)]`} onClick={e => e.stopPropagation()}>
                                  <div className={`absolute -top-1.5 left-4 w-3 h-3 bg-[var(--panel)] border-t-2 border-l-2 ${getTop3BorderClass(rankToUse)} transform rotate-45`}></div>
                                  <div className="relative z-10 flex flex-col gap-1.5">
                                    <span className={`font-black ${topTheme.text} text-xs tracking-wide whitespace-nowrap`}>[{topLoreData.title}]</span>
                                    <p className="text-[0.65rem] font-bold text-[var(--text-main)] leading-snug break-keep">{topLoreData.meaning}</p>
                                    <div className="w-full h-px bg-[var(--panel-border)]"></div>
                                    <p className="text-[0.65rem] font-bold text-[var(--text-sub)] leading-relaxed break-keep">{topLoreData.tribute}</p>
                                    <div className="mt-1 py-1.5 px-2 bg-[var(--inner-box)] border border-[var(--panel-border)]/60 rounded-lg text-center text-[0.6rem] font-black text-[var(--accent)] whitespace-nowrap">
                                      {topLoreData.sourceText}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            currentRankTitle && (
                              <span className={`text-[0.62rem] px-1.5 py-0.5 rounded mb-1 inline-flex items-center gap-1 border ${topTagClass}`}>
                                {currentRankTitle}
                              </span>
                            )
                          )}

                          <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-1.5">{char.name}</h3>
                          <div className="text-[0.65rem] text-[var(--text-sub)] font-bold mt-0.5">{char.job}</div>
                        </div>

                        <div className="flex flex-wrap gap-1 relative">
                          {earnedTitles.map(t => {
                            const clickId = `click-${char.id}-${t.type}-PANTHEON`;
                            const isClicked = openClickTooltipId === clickId;
                            const loreData = generateLore(t.name, t.rank, char.job, t.type as any);
                            const isRankedTitle = t.rank <= 3;
                            const tagClass = isRankedTitle ? t.theme.tags[t.rank - 1] : t.theme.tags[0];
                            const borderClass = isRankedTitle ? t.theme.borders[t.rank - 1] : t.theme.borders[0];

                            return (
                              <div key={t.type} className="relative inline-block">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenClickTooltipId(isClicked ? null : clickId); }}
                                  className={`text-[0.6rem] px-1.5 py-0.2 rounded border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${tagClass} ${isClicked ? 'ring-2 ring-black/30 dark:ring-white/50 z-10 opacity-100' : 'opacity-95 hover:opacity-100'}`}
                                >
                                  {t.name}
                                </button>

                                {isClicked && (
                                  <div className={`absolute top-[calc(100%+4px)] left-0 w-[260px] bg-[var(--panel)] border-2 ${borderClass} rounded-xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default text-[var(--text-main)]`} onClick={e => e.stopPropagation()}>
                                    <div className={`absolute -top-1.5 left-3 w-2.5 h-2.5 bg-[var(--panel)] border-t-2 border-l-2 ${borderClass} transform rotate-45`}></div>
                                    <div className="relative z-10 flex flex-col gap-1.5 text-left">
                                      <span className={`font-black ${t.theme.text} text-[0.7rem] tracking-wide whitespace-nowrap`}>[{loreData.title}]</span>
                                      <p className="text-[0.6rem] font-bold text-[var(--text-main)] leading-snug break-keep">{loreData.meaning}</p>
                                      <div className="w-full h-px bg-[var(--panel-border)]"></div>
                                      <p className="text-[0.6rem] font-bold text-[var(--text-sub)] leading-relaxed break-keep">{loreData.tribute}</p>
                                      <div className="mt-1 py-1.5 px-2 bg-[var(--inner-box)] border border-[var(--panel-border)]/60 rounded-lg text-center text-[0.6rem] font-black text-[var(--accent)] whitespace-nowrap">
                                        {loreData.sourceText}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 📌 데스크톱 순위 명칭 수정: 통합 순위 & 데이안 순위 */}
                        <div className="bg-[var(--inner-box)] p-2.5 rounded-lg border border-[var(--panel-border)] mt-0.5 space-y-1">
                          <div className="flex justify-between items-end border-b border-[var(--panel-border)] pb-1">
                            <span className="text-[var(--text-sub)] text-[0.65rem] font-bold">{RANKING_INFO[activeRankTab].stat}</span>
                            <span className="font-black text-[var(--accent)] text-base leading-none">{score.toLocaleString()}</span>
                          </div>
                          
                          {activeRankTab !== 'PIETAS' && (
                            <>
                              <div className="flex justify-between text-[0.6rem] font-bold">
                                <span className="text-[var(--text-sub)]">통합 순위</span>
                                <span className="text-[var(--text-main)]">{rankData.overall ? `#${rankData.overall.toLocaleString()}` : '집계 중'}</span>
                              </div>
                              <div className="flex justify-between text-[0.6rem] font-bold">
                                <span className="text-[var(--text-sub)]">데이안 순위</span>
                                <span className="text-[var(--text-main)]">{rankData.deian ? `#${rankData.deian.toLocaleString()}` : '집계 중'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 2. ASTRA (길드원 현황) 뷰 */}
        {activeMainTab === 'ASTRA' && (
          <section className="space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-2.5 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[var(--text-sub)] text-[0.65rem] font-bold mb-0.5">성역 전체 캐릭터</span>
                <span className="text-base sm:text-lg font-black text-[var(--text-main)]">{dbCharacters.length}</span>
              </div>
              <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-2.5 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[var(--text-sub)] text-[0.65rem] font-bold mb-0.5">성역 가문 대표</span>
                <span className="text-base sm:text-lg font-black text-[var(--accent)]">{mainCharacters.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {mainCharacters.map((mainChar, idx) => {
                const mainTitles = getAllEarnedTitles(mainChar);
                const isClickTooltipOpenForThisCard = openClickTooltipId?.includes(`-${mainChar.id}-`) && openClickTooltipId?.includes('-ASTRA');
                
                return (
                  <div 
                    key={idx} 
                    className={`relative bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-3 flex flex-col lg:flex-row justify-between lg:items-center gap-3 hover:border-[var(--accent)] transition-colors ${
                      isClickTooltipOpenForThisCard ? 'z-[60]' : 'z-10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
                        {mainChar.status === '생텀 접속중' && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)] mb-0.5"></div>}
                        {mainChar.status === '인게임' && <div className="w-2 h-2 bg-blue-500 rounded-full mb-0.5 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></div>}
                        {mainChar.status === '오프라인' && <div className="w-2 h-2 bg-[var(--text-sub)] rounded-full mb-0.5"></div>}
                        <span className={`text-[0.55rem] font-black ${mainChar.status === '생텀 접속중' ? 'text-emerald-500' : mainChar.status === '인게임' ? 'text-blue-400' : 'text-[var(--text-sub)]'}`}>{mainChar.status}</span>
                      </div>

                      <div className="w-px h-10 bg-[var(--panel-border)] hidden lg:block"></div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[0.5rem] bg-[var(--accent)] text-[var(--accent-fg)] font-black px-1 py-0.2 rounded">대표 캐릭터</span>
                          <span className="text-[0.65rem] text-[var(--text-sub)] font-bold">{mainChar.job}</span>
                        </div>
                        <h4 className="text-base font-black text-[var(--text-main)]">{mainChar.name}</h4>
                        
                        <div className="flex flex-wrap gap-1 mt-1 relative">
                          {mainTitles.length > 0 ? mainTitles.map(t => {
                            const clickId = `click-${mainChar.id}-${t.type}-ASTRA`;
                            const isClicked = openClickTooltipId === clickId;
                            const loreData = generateLore(t.name, t.rank, mainChar.job, t.type as any);
                            const isRankedTitle = t.rank <= 3;
                            const tagClass = isRankedTitle ? t.theme.tags[t.rank - 1] : t.theme.tags[0];
                            const borderClass = isRankedTitle ? t.theme.borders[t.rank - 1] : t.theme.borders[0];

                            return (
                              <div key={t.type} className="relative inline-block">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenClickTooltipId(isClicked ? null : clickId); }}
                                  className={`text-[0.58rem] px-1.5 py-0.2 rounded border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${tagClass} ${isClicked ? 'ring-2 ring-black/30 dark:ring-white/50 z-10 opacity-100' : 'opacity-95 hover:opacity-100'}`}
                                >
                                  {t.name}
                                </button>

                                {isClicked && (
                                  <div className={`absolute top-[calc(100%+4px)] left-0 w-[260px] bg-[var(--panel)] border-2 ${borderClass} rounded-xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default text-[var(--text-main)]`} onClick={e => e.stopPropagation()}>
                                    <div className={`absolute -top-1.5 left-3 w-2.5 h-2.5 bg-[var(--panel)] border-t-2 border-l-2 ${borderClass} transform rotate-45`}></div>
                                    <div className="relative z-10 flex flex-col gap-1.5 text-left">
                                      <span className={`font-black ${t.theme.text} text-[0.7rem] tracking-wide whitespace-nowrap`}>[{loreData.title}]</span>
                                      <p className="text-[0.58rem] font-bold text-[var(--text-main)] leading-snug break-keep">{loreData.meaning}</p>
                                      <div className="w-full h-px bg-[var(--panel-border)]"></div>
                                      <p className="text-[0.58rem] font-bold text-[var(--text-sub)] leading-relaxed break-keep">{loreData.tribute}</p>
                                      <div className="mt-1 py-1.5 px-2 bg-[var(--inner-box)] border border-[var(--panel-border)]/60 rounded-lg text-center text-[0.58rem] font-black text-[var(--accent)] whitespace-nowrap">
                                        {loreData.sourceText}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }) : <span className="text-[0.6rem] text-[var(--text-sub)]">획득한 칭호 없음</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end justify-center min-w-[200px]">
                      <span className="text-[0.55rem] text-[var(--accent)] font-bold mb-1 tracking-widest">대표 스탯 현황</span>
                      <div className="grid grid-cols-2 gap-1 text-[0.65rem] w-full lg:w-auto">
                        <div className="bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)] flex justify-between lg:gap-2"><span className="text-[var(--text-sub)]">전투력</span> <span className="text-[var(--text-main)] font-black">{mainChar.combatPower.toLocaleString()}</span></div>
                        <div className="bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)] flex justify-between lg:gap-2"><span className="text-[var(--text-sub)]">생활력</span> <span className="text-[var(--text-main)] font-black">{mainChar.lifePower.toLocaleString()}</span></div>
                        <div className="bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)] flex justify-between lg:gap-2"><span className="text-[var(--text-sub)]">매력도</span> <span className="text-[var(--text-main)] font-black">{mainChar.charm.toLocaleString()}</span></div>
                        <div className="bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)] flex justify-between lg:gap-2"><span className="text-[var(--text-sub)]">공헌도</span> <span className="text-[var(--text-main)] font-black">{mainChar.contribution.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function AgoraLoungePage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-10 font-bold text-[var(--text-sub)]">아고라 데이터를 불러오는 중...</div>}>
      <AgoraLoungeContent />
    </Suspense>
  );
}