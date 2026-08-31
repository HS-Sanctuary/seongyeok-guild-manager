"use client";

import { useState, useEffect, Fragment } from "react";
import { supabase } from "../../../lib/supabase";
import ClassIcon from "../../components/ClassIcon";

const CATEGORY_THEMES: Record<string, any> = {
  TELOS: {
    tabActive: 'bg-purple-600/90 text-white border-2 border-purple-400 shadow-md dark:bg-purple-800/80 dark:text-purple-100 dark:border-purple-400',
    titleActiveText: 'text-white font-black',
    text: 'text-purple-700 dark:text-purple-400 font-black', 
    tags: [
      'bg-purple-500/85 text-white border-2 border-purple-300 ring-2 ring-purple-300/30 font-black shadow-sm dark:bg-purple-700/80 dark:text-purple-100 dark:border-purple-400', 
      'bg-purple-100 text-purple-900 border-2 border-purple-400 font-extrabold dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-400', 
      'bg-purple-50/90 text-purple-900 border-[1.5px] border-purple-300 font-black dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-500', 
    ],
    borders: ['border-purple-400 dark:border-purple-400', 'border-purple-300 dark:border-purple-500', 'border-purple-300 dark:border-purple-600']
  },
  SYMPHONIA: {
    tabActive: 'bg-orange-600/90 text-white border-2 border-orange-400 shadow-md dark:bg-orange-700/80 dark:text-orange-100 dark:border-orange-400',
    titleActiveText: 'text-white font-black',
    text: 'text-orange-600 dark:text-orange-400 font-black',
    tags: [
      'bg-orange-500/85 text-white border-2 border-orange-300 ring-2 ring-orange-300/30 font-black shadow-sm dark:bg-orange-700/80 dark:text-orange-100 dark:border-orange-400',
      'bg-orange-100 text-orange-900 border-2 border-orange-400 font-extrabold dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-400',
      'bg-orange-50/90 text-orange-900 border-[1.5px] border-orange-300 font-black dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-500',
    ],
    borders: ['border-orange-400 dark:border-orange-400', 'border-orange-300 dark:border-orange-500', 'border-orange-300 dark:border-orange-600']
  },
  KRATOS: {
    tabActive: 'bg-rose-600/90 text-white border-2 border-rose-400 shadow-md dark:bg-rose-800/80 dark:text-rose-100 dark:border-rose-400',
    titleActiveText: 'text-white font-black',
    text: 'text-rose-700 dark:text-rose-400 font-black', 
    tags: [
      'bg-rose-500/85 text-white border-2 border-rose-300 ring-2 ring-rose-300/30 font-black shadow-sm dark:bg-rose-700/80 dark:text-rose-100 dark:border-rose-400',
      'bg-rose-100 text-rose-900 border-2 border-rose-400 font-extrabold dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-400',
      'bg-rose-50/90 text-rose-900 border-[1.5px] border-rose-300 font-black dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-500',
    ],
    borders: ['border-rose-400 dark:border-rose-400', 'border-rose-300 dark:border-rose-500', 'border-rose-300 dark:border-rose-600']
  },
  TECHNE: {
    tabActive: 'bg-sky-600/90 text-white border-2 border-sky-400 shadow-md dark:bg-sky-800/80 dark:text-sky-100 dark:border-sky-400',
    titleActiveText: 'text-white font-black',
    text: 'text-sky-700 dark:text-sky-400 font-black', 
    tags: [
      'bg-sky-500/85 text-white border-2 border-sky-300 ring-2 ring-sky-300/30 font-black shadow-sm dark:bg-sky-700/80 dark:text-sky-100 dark:border-sky-400',
      'bg-sky-100 text-sky-900 border-2 border-sky-400 font-extrabold dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-400',
      'bg-sky-50/90 text-sky-900 border-[1.5px] border-sky-300 font-black dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-500',
    ],
    borders: ['border-sky-400 dark:border-sky-400', 'border-sky-300 dark:border-sky-500', 'border-sky-300 dark:border-sky-600']
  },
  HARMONIA: {
    tabActive: 'bg-amber-500/90 text-slate-950 border-2 border-amber-300 shadow-md dark:bg-amber-600/80 dark:text-amber-100 dark:border-amber-300',
    titleActiveText: 'text-slate-950 dark:text-white font-black',
    text: 'text-amber-700 dark:text-amber-400 font-black', 
    tags: [
      'bg-amber-400/90 text-slate-950 border-2 border-amber-500 ring-2 ring-amber-300/30 font-black shadow-sm dark:bg-amber-600/80 dark:text-amber-100 dark:border-amber-300',
      'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-400',
      'bg-amber-50/90 text-amber-950 border-[1.5px] border-amber-300 font-black dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-500',
    ],
    borders: ['border-amber-400 dark:border-amber-400', 'border-amber-300 dark:border-amber-500', 'border-amber-300 dark:border-amber-600']
  },
  PIETAS: {
    tabActive: 'bg-emerald-600/90 text-white border-2 border-emerald-400 shadow-md dark:bg-emerald-800/80 dark:text-emerald-100 dark:border-emerald-400',
    titleActiveText: 'text-white font-black',
    text: 'text-emerald-700 dark:text-emerald-400 font-black', 
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
  TECHNE: { en: 'TECHNĒ', kr: '테크네', desc: '기술과 숙련의 기록', sub: '대표 생활력 랭킹', stat: '최고 생활력' },
  HARMONIA: { en: 'HARMONIA', kr: '하르모니아', desc: '아름다움과 조화의 기록', sub: '매력 랭킹', stat: '매력' },
  PIETAS: { en: 'PIETAS', kr: '피에타스', desc: '헌신과 공헌의 기록', sub: '대표 공헌도 랭킹', stat: '공헌도' },
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
  TELOS: { 1: "모든 시련을 극복하고 만물의 이치를 깨우친 절대자여...", 2: "정상의 옥좌를 턱밑까지 추격한 초월자...", 3: "균형과 완성의 길을 걷는 위대한 선구자..." },
  SYMPHONIA: { 1: "변함없는 끈기와 피나는 노력으로 모든 영웅을 완벽하게 다듬어낸...", 2: "포기하지 않는 집념으로 계정 내 모든 영웅을 훌륭하게 성숙시킨...", 3: "시간과 열정을 쏟아부어 견고하게 계정을 다져낸 헌신자..." },
  TECHNE: { 1: "무에서 유를 창조하는 창조신이여...", 2: "불과 쇠, 흙과 나무를 지배하는 경이로운 장인...", 3: "인고의 시간을 견뎌내고 예술의 경지에 오른 마에스트로..." },
  HARMONIA: { 1: "숨이 멎을 듯한 자태로 만인을 굴복시킨 절대적인 미(美)의 화신...", 2: "거부할 수 없는 우아함과 기품을 흩뿌리는 매혹의 지배자...", 3: "내면과 외면이 완벽한 조화를 이룬 고결한 우상..." },
  PIETAS: { 1: "자신의 뼈를 깎아 성역의 굳건한 성벽을 세운 영웅이여...", 2: "길드를 위해 기꺼이 자신을 희생한 고결한 등대...", 3: "형제들을 위해 궂은일을 도맡는 성역의 진정한 수호자..." }
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
    if (customLore) { meaning = customLore.meaning; tribute = customLore.tribute; }
    else { meaning = `끝없는 투지로 전장을 누비는 ${job}입니다.`; tribute = `성역을 위해 무기를 든 자랑스러운 전사.`; }
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
  isMain: boolean; rankings?: Record<string, { overall: number; deian: number }>;
  serverRankOverall?: number; serverRankDeian?: number;
}

export default function PantheonView() {
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);
  const [activeRankTab, setActiveRankTab] = useState<keyof typeof RANKING_INFO>('TELOS');
  const [selectedClass, setSelectedClass] = useState<string>("전체"); 
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);

  // 🌟 전역 모달 상태 관리
  const [activeModalData, setActiveModalData] = useState<{ t: any; char: Character } | null>(null);

  // ⌨️ ESC 키 입력 시 모달 닫기 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalData(null);
      }
    };

    if (activeModalData) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModalData]);

  useEffect(() => {
    setSelectedClass("전체");
  }, [activeRankTab]);

  useEffect(() => {
    fetchServerData();
  }, []);

  const fetchServerData = async () => {
    try {
      const { data, error } = await supabase.from('characters').select('*');
      if (data && !error) {
        const mappedData: Character[] = data.map((c: any) => ({
          id: c.nickname, name: c.nickname, owner: c.owner || c.nickname, job: c.job || '전사',
          combatPower: Number(c.combat_power) || 0, magicResist: Number(c.magic_resistance) || 0,
          lifePower: Number(c.life_energy) || 0, charm: Number(c.charm) || 0,
          contribution: Number(c.contribution) || 0, isMain: c.is_main || false,
          rankings: c.rankings || {},
          serverRankOverall: c.rankings?.[activeRankTab]?.overall ?? c.server_rank_overall ?? 0,
          serverRankDeian: c.rankings?.[activeRankTab]?.deian ?? c.server_rank_deian ?? 0
        }));
        setDbCharacters(mappedData);
      }
    } catch (err) { console.error("판테온 로딩 실패", err); }
  };

  const getKratosClassRank = (char: Character): number => {
    const sameJobChars = dbCharacters
      .filter(c => c.job === char.job)
      .sort((a, b) => b.combatPower - a.combatPower);
    
    const index = sameJobChars.findIndex(c => c.id === char.id);
    return index >= 0 ? index + 1 : 0;
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

  const getAccountRankings = () => {
    const accountMap: Record<string, any> = {};
    dbCharacters.forEach(c => {
      const ownerKey = (c.owner && c.owner.trim() !== "") ? c.owner.trim() : c.name;
      const cCombat = Number(c.combatPower) || 0;
      const cLife = Number(c.lifePower) || 0;
      const cCharm = Number(c.charm) || 0;
      const charTotalScore = cCombat + cLife + cCharm;

      if (!accountMap[ownerKey]) {
        accountMap[ownerKey] = { owner: ownerKey, charCount: 0, totalScore: 0, totalCombat: 0, totalLife: 0, totalCharm: 0, mainCharName: c.name, mainCharJob: c.job };
      }
      const acc = accountMap[ownerKey];
      acc.charCount += 1; acc.totalCombat += cCombat; acc.totalLife += cLife; acc.totalCharm += cCharm; acc.totalScore += charTotalScore;
      if (c.isMain) { acc.mainCharName = c.name; acc.mainCharJob = c.job; }
    });
    return Object.values(accountMap).sort((a, b) => b.totalScore - a.totalScore);
  };

  const getAllSortedCharacters = () => {
    if (activeRankTab === 'PIETAS') {
      const ownerMap = new Map<string, Character>();
      dbCharacters.forEach(c => { if (c.isMain) ownerMap.set(c.owner?.trim() || c.name, c); });
      dbCharacters.forEach(c => {
        const ownerKey = c.owner?.trim() || c.name;
        if (!ownerMap.has(ownerKey)) ownerMap.set(ownerKey, c);
        else if (!ownerMap.get(ownerKey)!.isMain && c.contribution > ownerMap.get(ownerKey)!.contribution) ownerMap.set(ownerKey, c);
      });
      return Array.from(ownerMap.values()).sort((a, b) => b.contribution - a.contribution);
    }
    if (activeRankTab === 'TECHNE') {
      const ownerMap = new Map<string, Character>();
      dbCharacters.forEach(c => {
        const ownerKey = c.owner?.trim() || c.name;
        if (!ownerMap.has(ownerKey) || c.lifePower > ownerMap.get(ownerKey)!.lifePower) ownerMap.set(ownerKey, c);
      });
      return Array.from(ownerMap.values()).sort((a, b) => b.lifePower - a.lifePower);
    }
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
      if (type === 'SYMPHONIA') return;
      let targetList = [...dbCharacters];
      if (type === 'TECHNE') {
        const ownerMap = new Map<string, Character>();
        dbCharacters.forEach(c => {
          const ownerKey = c.owner?.trim() || c.name;
          if (!ownerMap.has(ownerKey) || c.lifePower > ownerMap.get(ownerKey)!.lifePower) ownerMap.set(ownerKey, c);
        });
        targetList = Array.from(ownerMap.values());
      } else if (type === 'PIETAS') {
        const ownerMap = new Map<string, Character>();
        dbCharacters.forEach(c => {
          const ownerKey = c.owner?.trim() || c.name;
          if (c.isMain || !ownerMap.has(ownerKey)) ownerMap.set(ownerKey, c);
        });
        targetList = Array.from(ownerMap.values());
      }
      const rank = targetList.sort((a,b) => getScore(b, type) - getScore(a, type)).findIndex(c => c.id === char.id);
      if(rank >= 0 && rank < 3) titles.push({ type, name: titleArr[rank], rank: rank + 1, theme: CATEGORY_THEMES[type] });
    };

    pushIfTop3('TELOS', TOP_TITLES.TELOS);
    pushIfTop3('PIETAS', TOP_TITLES.PIETAS);

    const kratosRank = [...dbCharacters].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id);
    const kTitles = CLASS_TITLES[char.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) titles.push({ type: 'KRATOS', name: kTitles[kratosRank], rank: kratosRank + 1, theme: CATEGORY_THEMES.KRATOS });
      else titles.push({ type: 'KRATOS', name: kTitles[3], rank: 4, theme: { tags: ['bg-zinc-800/80 text-zinc-300 border-zinc-700 font-bold'], borders: ['border-zinc-700'], text: 'text-zinc-400' } });
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

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-black font-black';
    if (rank === 2) return 'bg-slate-300 text-black font-black';
    if (rank === 3) return 'bg-amber-700 text-white font-black';
    return 'text-[var(--text-sub)] bg-transparent font-bold';
  };

  const renderTitleTag = (t: { type: string; name: string; rank: number; theme: any }, char: Character) => {
    const tagStyle = t.rank <= 3 ? t.theme.tags[t.rank - 1] : t.theme.tags[0];

    return (
      <button
        key={`${char.id}-${t.type}-${t.name}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveModalData({ t, char });
        }}
        className={`text-[0.6rem] px-1.5 py-0.5 rounded border transition-all hover:scale-105 cursor-pointer font-bold ${tagStyle}`}
      >
        {t.name}
      </button>
    );
  };

  const renderSpecificTitleTag = (char: Character, category: keyof typeof RANKING_INFO, rank: number) => {
    if (category === 'SYMPHONIA') return null;
    const earnedTitles = getAllEarnedTitles(char);
    const specificTitle = earnedTitles.find(t => t.type === category && t.rank === rank);
    if (!specificTitle) return null;
    return renderTitleTag(specificTitle, char);
  };

  const renderRankButton = (key: keyof typeof RANKING_INFO) => {
    const info = RANKING_INFO[key];
    const isActive = activeRankTab === key;
    const theme = CATEGORY_THEMES[key];
    return (
      <button key={key} onClick={() => setActiveRankTab(key)} className={`group relative h-10 sm:h-12 rounded-xl border transition-all overflow-hidden cursor-pointer ${isActive ? theme.tabActive : 'bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] opacity-85 hover:opacity-100'}`}>
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

  const allSortedCharacters = getAllSortedCharacters();
  const rankedCharacters = getRankedCharacters();
  const accountRankings = getAccountRankings();

  return (
    <section className="space-y-3 animate-in fade-in duration-200">
      
      <div className="grid md:hidden grid-cols-3 gap-1.5">{['TELOS', 'SYMPHONIA', 'PIETAS', 'KRATOS', 'TECHNE', 'HARMONIA'].map(k => renderRankButton(k as any))}</div>
      <div className="hidden md:grid grid-cols-6 gap-2">{['TELOS', 'SYMPHONIA', 'KRATOS', 'TECHNE', 'HARMONIA', 'PIETAS'].map(k => renderRankButton(k as any))}</div>

      <div className="flex md:hidden justify-between items-end border-b border-[var(--panel-border)] pb-2 mb-2 pt-1">
        <div>
          <h2 className={`text-[1.35rem] font-black leading-none ${CATEGORY_THEMES[activeRankTab].text}`}>
            {RANKING_INFO[activeRankTab].en}
          </h2>
          <p className="text-[var(--text-sub)] text-[0.65rem] mt-1 font-bold">
            「 {RANKING_INFO[activeRankTab].desc} 」
          </p>
        </div>
        {activeRankTab !== 'SYMPHONIA' && activeRankTab !== 'PIETAS' && activeRankTab !== 'TECHNE' && (
          <button
            onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
            className={`px-3 py-1.5 rounded-lg text-[0.68rem] font-bold transition flex items-center gap-1 border shadow-sm ${isClassFilterOpen ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' : 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border-[var(--panel-border)]'}`}
          >
            🔍 필터 {selectedClass !== "전체" && `(${selectedClass})`}
          </button>
        )}
      </div>

      <div className="hidden md:block text-center py-2">
        <h2 className={`text-2xl font-black tracking-widest flex justify-center items-center gap-2 ${CATEGORY_THEMES[activeRankTab].text}`}>
          {RANKING_INFO[activeRankTab].en}
        </h2>
        <p className="text-[var(--text-sub)] text-[0.7rem] mt-0.5 font-bold">
          「 {RANKING_INFO[activeRankTab].desc} 」
        </p>
      </div>

      {activeRankTab !== 'SYMPHONIA' && activeRankTab !== 'PIETAS' && activeRankTab !== 'TECHNE' && (
        <div className="hidden md:block bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
            className={`w-full py-1.5 rounded-lg text-[0.75rem] font-bold transition flex items-center justify-center gap-1.5 ${isClassFilterOpen ? 'bg-[var(--inner-box)] text-[var(--accent)] border border-[var(--panel-border)]' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}
          >
            🔍 클래스별 필터링 {selectedClass !== "전체" ? `[선택: ${selectedClass}]` : "펼치기 ▼"}
          </button>
        </div>
      )}

      {isClassFilterOpen && activeRankTab !== 'SYMPHONIA' && activeRankTab !== 'PIETAS' && activeRankTab !== 'TECHNE' && (
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] p-2.5 rounded-xl mt-1 mb-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[0.68rem] font-black text-[var(--accent)]">클래스 필터링</span>
            {selectedClass !== "전체" && (
              <button onClick={() => setSelectedClass("전체")} className="text-[0.62rem] text-rose-400 font-bold hover:underline cursor-pointer">
                필터 해제 (전체 보기)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {CLASS_GROUPS.map((group) => (
              <div key={group.name} className="bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)] flex flex-col gap-1">
                <div className="text-[0.6rem] font-black text-[var(--text-sub)] px-1 border-b border-[var(--panel-border)] pb-1 mb-0.5">
                  {group.name}
                </div>
                <div className="flex flex-col gap-1">
                  {group.classes.map(cls => (
                    <button 
                      key={cls} 
                      onClick={() => setSelectedClass(cls)} 
                      className={`px-2 py-1.5 rounded text-left transition font-bold text-[0.65rem] border flex items-center gap-1.5 cursor-pointer ${
                        selectedClass === cls 
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-black border-[var(--accent)]' 
                          : 'bg-[var(--panel)] text-[var(--text-main)] border-[var(--panel-border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <ClassIcon job={cls} kratosClassRank={0} size="sm" />
                      <span>{cls}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 랭킹 메인 영역 */}
      {activeRankTab === 'SYMPHONIA' ? (
        
        <div className="space-y-3">
          {/* 모바일 뷰 */}
          <div className="grid md:hidden grid-cols-1 gap-2">
            {accountRankings.map((acc, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const titleName = isTop3 ? TOP_TITLES.SYMPHONIA[rank - 1] : '';
              
              return (
                <div key={acc.owner} className={`relative bg-[var(--panel)] border ${getTop3BorderClass(rank)} rounded-xl p-3 hover:border-[var(--accent)] transition-all z-10`}>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[0.65rem] shrink-0 ${getRankBadgeColor(rank)}`}>#{rank}</span>
                      {isTop3 && <span className={`text-[0.6rem] px-1.5 py-0.5 rounded border font-black shrink-0 ${CATEGORY_THEMES.SYMPHONIA.tags[rank-1]}`}>{titleName}</span>}
                      <span className="font-black text-[0.95rem] text-[var(--text-main)] truncate shrink-0">{acc.owner}</span>
                      <span className="text-[0.65rem] text-[var(--text-sub)] font-bold shrink-0">대표: {acc.mainCharName} ({acc.mainCharJob}) · {acc.charCount}캐릭</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[0.55rem] text-[var(--text-sub)] font-bold block">종합 점수</span>
                      <span className="text-[var(--accent)] font-black text-sm">{acc.totalScore.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[0.55rem] font-bold text-center bg-[var(--inner-box)] px-1 py-1.5 rounded border border-[var(--panel-border)]">
                    <div><span className="text-red-400 mr-1">전투력</span>{acc.totalCombat.toLocaleString()}</div>
                    <div><span className="text-emerald-400 mr-1">생활력</span>{acc.totalLife.toLocaleString()}</div>
                    <div><span className="text-pink-400 mr-1">매력</span>{acc.totalCharm.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PC 뷰 */}
          <div className="hidden md:block space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {accountRankings.slice(0, 3).map((acc, index) => {
                const rank = index + 1;
                const titleName = TOP_TITLES.SYMPHONIA[index];
                return (
                  <div key={acc.owner} className={`relative bg-[var(--panel)] border ${getTop3BorderClass(rank)} rounded-xl p-3.5 flex flex-col justify-between hover:border-[var(--accent)] transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${getRankBadgeColor(rank)}`}>#{rank}</span>
                      <span className={`text-[0.62rem] px-1.5 py-0.5 rounded border font-black ${CATEGORY_THEMES.SYMPHONIA.tags[index]}`}>{titleName}</span>
                    </div>
                    <div className="mb-2">
                      <h3 className="text-lg font-black text-[var(--text-main)] truncate">{acc.owner}</h3>
                      <span className="text-xs text-[var(--text-sub)] font-bold">대표: {acc.mainCharName} ({acc.mainCharJob}) · {acc.charCount}캐릭</span>
                    </div>
                    <div className="border-t border-[var(--panel-border)] pt-2 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-sub)] font-bold">계정 총점</span>
                        <span className="text-amber-400 font-black text-base">{acc.totalScore.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[0.6rem] font-bold text-center bg-[var(--inner-box)] p-1 rounded border border-[var(--panel-border)]">
                        <div><span className="text-red-400 block">전투력</span>{acc.totalCombat.toLocaleString()}</div>
                        <div><span className="text-emerald-400 block">생활력</span>{acc.totalLife.toLocaleString()}</div>
                        <div><span className="text-pink-400 block">매력</span>{acc.totalCharm.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {accountRankings.length > 3 && (
              <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-xs">
                <div className="px-3 py-2 bg-[var(--inner-box)] border-b border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] flex justify-between">
                  <span>순위 / 계정 명칭</span>
                  <span>세부 스탯 / 계정 총점</span>
                </div>
                <div className="divide-y divide-[var(--panel-border)]">
                  {accountRankings.slice(3).map((acc, index) => {
                    const rank = index + 4;
                    return (
                      <div key={acc.owner} className="p-2.5 flex items-center justify-between hover:bg-[var(--inner-box)] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-[var(--text-sub)] w-6 text-center">#{rank}</span>
                          <div>
                            <span className="font-black text-xs text-[var(--text-main)]">{acc.owner}</span>
                            <span className="text-[0.6rem] text-[var(--text-sub)] font-bold ml-2">대표: {acc.mainCharName} ({acc.mainCharJob}) · {acc.charCount}캐릭</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 text-[0.6rem] font-bold text-[var(--text-sub)]">
                            <span>전 <strong className="text-red-400">{acc.totalCombat.toLocaleString()}</strong></span>
                            <span>생 <strong className="text-emerald-400">{acc.totalLife.toLocaleString()}</strong></span>
                            <span>매 <strong className="text-pink-400">{acc.totalCharm.toLocaleString()}</strong></span>
                          </div>
                          <span className="font-black text-xs text-amber-400 w-20 text-right">{acc.totalScore.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      ) : (

        <div className="space-y-3">
          
          {/* 모바일 뷰 */}
          <div className="grid md:hidden grid-cols-1 gap-2">
            {rankedCharacters.map((char) => {
              const earnedTitles = getAllEarnedTitles(char);
              const score = getScore(char, activeRankTab);
              const categoryRank = allSortedCharacters.findIndex(c => c.id === char.id) + 1;
              const kratosClassRank = getKratosClassRank(char);
              
              return (
                <div key={char.id} className={`relative bg-[var(--panel)] border ${getTop3BorderClass(categoryRank)} rounded-xl p-3 hover:border-[var(--accent)] transition-all z-10`}>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[0.65rem] shrink-0 ${getRankBadgeColor(categoryRank)}`}>#{categoryRank}</span>
                      {categoryRank <= 3 && renderSpecificTitleTag(char, activeRankTab, categoryRank)}
                      <ClassIcon job={char.job} kratosClassRank={kratosClassRank} size="sm" />
                      <span className="font-black text-[0.95rem] text-[var(--text-main)] truncate shrink-0">{char.name}</span>
                      <span className="text-[0.65rem] text-[var(--text-sub)] font-bold shrink-0">{char.job}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[0.55rem] text-[var(--text-sub)] font-bold block">{RANKING_INFO[activeRankTab].stat}</span>
                      <span className="text-[var(--accent)] font-black text-sm">{score.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {earnedTitles.map(t => renderTitleTag(t, char))}
                  </div>

                  <div className="flex justify-between items-center text-[0.55rem] font-bold text-[var(--text-sub)] bg-[var(--inner-box)] px-2 py-1.5 rounded-lg border border-[var(--panel-border)]">
                    <span>통합 순위: <strong className="text-[var(--text-main)] font-black">#{char.serverRankOverall?.toLocaleString() || '-'}</strong></span>
                    <span>데이안 순위: <strong className="text-[var(--text-main)] font-black">#{char.serverRankDeian?.toLocaleString() || '-'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PC 뷰 */}
          <div className="hidden md:block space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {rankedCharacters.slice(0, 3).map((char, index) => {
                const earnedTitles = getAllEarnedTitles(char);
                const score = getScore(char, activeRankTab);
                const displayRank = index + 1;
                const kratosClassRank = getKratosClassRank(char);

                return (
                  <div key={char.id} className={`relative bg-[var(--panel)] border ${getTop3BorderClass(displayRank)} rounded-xl p-4 flex flex-col justify-between hover:border-[var(--accent)] transition-all`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${getRankBadgeColor(displayRank)}`}>#{displayRank}</span>
                        <ClassIcon job={char.job} kratosClassRank={kratosClassRank} />
                      </div>
                      {renderSpecificTitleTag(char, activeRankTab, displayRank)}
                    </div>

                    <div className="mb-2">
                      <h3 className="text-lg font-black text-[var(--text-main)] truncate">{char.name}</h3>
                      <span className="text-xs text-[var(--text-sub)] font-bold">{char.job}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
                      {earnedTitles.map(t => renderTitleTag(t, char))}
                    </div>

                    <div className="border-t border-[var(--panel-border)] pt-2 space-y-1 text-xs font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-sub)]">{RANKING_INFO[activeRankTab].stat}</span>
                        <span className="text-[var(--accent)] font-black text-sm">{score.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[0.62rem]">
                        <span className="text-[var(--text-sub)]">통합 / 데이안 순위</span>
                        <span className="text-[var(--text-main)] font-black">#{char.serverRankOverall?.toLocaleString() || '-'} / #{char.serverRankDeian?.toLocaleString() || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4위 이하 리스트 */}
            {rankedCharacters.length > 3 && (
              <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-xs">
                <div className="px-3 py-2 bg-[var(--inner-box)] border-b border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] flex justify-between items-center">
                  <span>순위 / 영웅</span>
                  <span>보유 칭호 / {RANKING_INFO[activeRankTab].stat}</span>
                </div>
                <div className="divide-y divide-[var(--panel-border)]">
                  {rankedCharacters.slice(3).map((char, index) => {
                    const earnedTitles = getAllEarnedTitles(char);
                    const score = getScore(char, activeRankTab);
                    const rankNum = index + 4;
                    const kratosClassRank = getKratosClassRank(char);

                    return (
                      <div 
                        key={char.id} 
                        className="p-2.5 flex items-center justify-between hover:bg-[var(--inner-box)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-[var(--text-sub)] w-6 text-center shrink-0">#{rankNum}</span>
                          <ClassIcon job={char.job} kratosClassRank={kratosClassRank} />
                          <div>
                            <span className="font-black text-xs text-[var(--text-main)]">{char.name}</span>
                            <span className="text-[0.62rem] text-[var(--text-sub)] font-bold ml-2">{char.job}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap gap-1 justify-end max-w-[280px]">
                            {earnedTitles.map(t => renderTitleTag(t, char))}
                          </div>
                          <div className="text-right shrink-0 min-w-[80px]">
                            <span className="text-xs font-black text-[var(--accent)] block">{score.toLocaleString()}</span>
                            <span className="text-[0.55rem] text-[var(--text-sub)]">#{char.serverRankDeian?.toLocaleString() || '-'}위</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 🌟 최상단 고정 모달 */}
      {activeModalData && (() => {
        const { t, char } = activeModalData;
        const lore = generateLore(t.name, t.rank, char.job, t.type as keyof typeof RANKING_INFO);
        return (
          <div 
            className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModalData(null);
            }}
          >
            <div 
              className="bg-zinc-950 border border-amber-500/60 text-zinc-100 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative animate-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
                <span className="font-black text-amber-400 text-sm flex items-center gap-1.5">
                  <span>👑</span> {lore.title}
                </span>
                <button 
                  onClick={() => setActiveModalData(null)} 
                  className="text-zinc-400 hover:text-white text-sm font-black p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-[0.62rem] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded mb-2.5 w-fit border border-zinc-800">
                {lore.sourceText}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-amber-300 font-bold block text-[0.65rem] mb-0.5">📖 세계관 / 설명</span>
                  <p className="text-zinc-200 font-medium leading-relaxed text-[0.72rem]">{lore.meaning}</p>
                </div>
                {lore.tribute && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-amber-400 font-bold block text-[0.65rem] mb-0.5">📜 성역의 헌사</span>
                    <p className="text-zinc-300 italic font-medium leading-relaxed text-[0.72rem]">"{lore.tribute}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </section>
  );
}