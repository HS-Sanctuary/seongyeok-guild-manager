"use client";

import '../globals.css'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

// ==========================================
// 1. 카테고리 컬러 테마 정의 (이모지 대체)
// ==========================================
const CATEGORY_THEMES: Record<string, any> = {
  TELOS: { 
    tab: 'bg-zinc-800/80 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]', 
    text: 'text-purple-400', 
    tag: 'bg-purple-900/30 text-purple-400 border-purple-700/50', 
    border: 'border-purple-500/50'
  },
  KRATOS: { 
    tab: 'bg-zinc-800/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]', 
    text: 'text-red-400', 
    tag: 'bg-red-900/30 text-red-400 border-red-700/50', 
    border: 'border-red-500/50'
  },
  TECHNE: { 
    tab: 'bg-zinc-800/80 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]', 
    text: 'text-blue-400', 
    tag: 'bg-blue-900/30 text-blue-400 border-blue-700/50', 
    border: 'border-blue-500/50'
  },
  HARMONIA: { 
    tab: 'bg-zinc-800/80 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]', 
    text: 'text-yellow-400', 
    tag: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50', 
    border: 'border-yellow-500/50'
  },
  PIETAS: { 
    tab: 'bg-zinc-800/80 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]', 
    text: 'text-emerald-500', 
    tag: 'bg-emerald-900/30 text-emerald-500 border-emerald-700/50', 
    border: 'border-emerald-500/50'
  },
  DEFAULT: {
    tag: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    text: 'text-zinc-400',
    border: 'border-zinc-700'
  }
};

const RANKING_INFO = {
  TELOS: { en: 'TELOS', kr: '텔로스', desc: '도달과 완성의 기록', sub: '종합 랭킹', stat: '종합 점수' },
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
  PIETAS: ['시리우스', '레굴루스', '알데바란'],
  TECHNE: ['폴리매스', '마이스터', '아르티장'],
  HARMONIA: ['아글라이아', '카리스', '칼로스'],
};

// ==========================================
// 2. 서사(Lore) 사전
// ==========================================
const LORE_DICTIONARY: Record<string, string> = {
  '헬리오스': '그리스 신화의 태양신. 모든 것을 비추는 태양처럼 최고의 경지에 도달한 존재를 상징합니다.',
  '셀레네': '그리스 신화의 달의 여신. 밤하늘을 밝히는 달처럼 뛰어난 완성과 품격을 상징합니다.',
  '에오스': '그리스 신화의 새벽의 여신. 새로운 시작과 가능성을 여는 존재를 상징합니다.',
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

  const sourceText = category === 'KRATOS' 
    ? `성역 ${RANKING_INFO[category].kr} [${job}] ${rank <= 3 ? rank + '위' : '랭커'}에게 부여되는 칭호`
    : `성역 ${RANKING_INFO[category].kr} ${rank <= 3 ? rank + '위' : '랭커'}에게 부여되는 칭호`;

  return { title, meaning, tribute, rank, sourceText };
};

// ==========================================
// 3. 데이터 모델
// ==========================================
interface Character {
  id: string; name: string; job: string;
  combatPower: number; magicResist: number; lifePower: number; charm: number; contribution: number;
  isMain: boolean; status: '생텀 접속중' | '인게임' | '오프라인'; lastSeen?: string;
  pendingTasks?: string[]; serverRankOverall?: number; serverRankDeian?: number;
}

export default function AgoraLoungePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);

  const [activeMainTab, setActiveMainTab] = useState<'PANTHEON' | 'ASTRA'>('PANTHEON');
  const [activeRankTab, setActiveRankTab] = useState<keyof typeof RANKING_INFO>('TELOS');
  
  const [selectedClass, setSelectedClass] = useState<string>("전체"); 
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  
  const [openHoverTooltipId, setOpenHoverTooltipId] = useState<string | null>(null);
  const [openClickTooltipId, setOpenClickTooltipId] = useState<string | null>(null);

  useEffect(() => { 
    setMounted(true); 
    fetchServerData();
  }, []);

  const fetchServerData = async () => {
    try {
      const { data, error } = await supabase.from('characters').select('*');
      if (data && !error) {
        const mappedData: Character[] = data.map((c: any) => ({
          id: c.nickname, name: c.nickname, job: c.job || '전사',
          combatPower: Number(c.combat_power) || 0, magicResist: Number(c.magic_resistance) || 0,
          lifePower: Number(c.life_energy) || 0, charm: Number(c.charm) || 0,
          contribution: Number(c.contribution) || 0, isMain: c.is_main || false,
          status: '오프라인', lastSeen: '최근 업데이트 됨', pendingTasks: [] 
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
      const rank = [...dbCharacters].sort((a,b) => getScore(b, type) - getScore(a, type)).findIndex(c => c.id === char.id);
      if(rank >= 0 && rank < 3) {
        titles.push({ type, name: titleArr[rank], rank: rank + 1, theme: CATEGORY_THEMES[type] });
      }
    };

    pushIfTop3('TELOS', TOP_TITLES.TELOS);
    pushIfTop3('PIETAS', TOP_TITLES.PIETAS);

    const kratosRank = [...dbCharacters].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id);
    const kTitles = CLASS_TITLES[char.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) {
        titles.push({ type: 'KRATOS', name: kTitles[kratosRank], rank: kratosRank + 1, theme: CATEGORY_THEMES.KRATOS });
      } else {
        titles.push({ type: 'KRATOS', name: kTitles[3], rank: 4, theme: CATEGORY_THEMES.DEFAULT });
      }
    }

    pushIfTop3('TECHNE', TOP_TITLES.TECHNE);
    pushIfTop3('HARMONIA', TOP_TITLES.HARMONIA);

    return titles;
  };

  if (!mounted) return null;

  const allSortedCharacters = getAllSortedCharacters();
  const rankedCharacters = getRankedCharacters();
  const mainCharacters = dbCharacters.filter(c => c.isMain).sort((a, b) => b.combatPower - a.combatPower);

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      
      {openClickTooltipId && (
        <div className="fixed inset-0 z-[80]" onClick={() => setOpenClickTooltipId(null)}></div>
      )}

      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pt-8 relative z-10">
        
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-3 px-6 shadow-xl mb-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788] shadow-[0_0_15px_#e6c788]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#e6c788] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md leading-none">
                  AGORA
                </h1>
                <span className="text-[#e6c788] text-[13px] font-bold tracking-wide mt-1.5 leading-none">
                  아고라 : 길드 라운지
                </span>
              </div>
              <button 
                onClick={() => setShowLoreGuide(true)} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-[#e6c788] hover:bg-zinc-800 hover:border-[#e6c788] transition-all ml-2" 
                title="명칭 가이드 보기"
              >
                ?
              </button>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-700/50 px-4 py-2 rounded-lg w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <div className="flex flex-col text-[11px] md:text-[12px] font-bold leading-tight w-full mt-1">
                <span className="text-zinc-300 w-full truncate md:whitespace-normal">
                  고대 그리스의 대광장, 아고라. 이곳은 성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.
                </span>
                <span className="text-[#e6c788] mt-0.5">
                  성역의 모든 별을 아스트라에 새기고, 빛나는 결실을 판테온에 기립니다.
                </span>
              </div>
            </div>
          </div>
        </header>

        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white text-xl">✕</button>
              <h2 className="text-2xl font-black text-[#e6c788] mb-6 border-b border-zinc-800 pb-4">SANCTUM 명칭 가이드</h2>
              <div className="space-y-6 text-sm text-zinc-300">
                <div><h3 className="text-lg font-bold text-white mb-1">AGORA (아고라 / 길드 라운지)</h3><p>성역의 모든 구성원이 함께 모이고 소통하는 중심 공간입니다.</p></div>
                <div><h3 className="text-lg font-bold text-white mb-1">ASTRA (아스트라 / 길드원 현황)</h3><p>한 명 한 명이 하나의 별이며, 모두가 함께 성역을 이룹니다. 길드원의 정보와 성장 기록을 확인합니다.</p></div>
                <div><h3 className="text-lg font-bold text-white mb-1">PANTHEON (판테온 / 성역 랭킹)</h3><p>성역의 모두와 그중 빛나는 이들을 기록하는 명예의 전당입니다. 5개의 철학적 기록으로 나뉩니다.</p>
                  <ul className="mt-3 space-y-2 pl-4 border-l-2 border-zinc-700">
                    <li><strong className="text-purple-400">TELOS (텔로스)</strong>: 종합 랭킹. 도달과 완성의 기록.</li>
                    <li><strong className="text-red-400">KRATOS (크라토스)</strong>: 전투력 랭킹. 힘과 권능의 기록.</li>
                    <li><strong className="text-blue-400">TECHNĒ (테크네)</strong>: 생활력 랭킹. 기술과 숙련의 기록.</li>
                    <li><strong className="text-yellow-400">HARMONIA (하르모니아)</strong>: 매력 랭킹. 아름다움과 조화의 기록.</li>
                    <li><strong className="text-emerald-500">PIETAS (피에타스)</strong>: 공헌도 랭킹. 헌신과 공헌의 기록.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button onClick={() => setActiveMainTab('PANTHEON')} className={`group relative w-64 h-14 rounded-xl font-black text-sm transition-all overflow-hidden border ${activeMainTab === 'PANTHEON' ? 'bg-[#e6c788] border-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${activeMainTab === 'PANTHEON' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}><span className="tracking-widest text-lg">PANTHEON</span></div>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${activeMainTab === 'PANTHEON' ? '!translate-y-0 !opacity-100' : ''}`}><span className="text-[15px]">판테온</span><span className={`text-[10px] ${activeMainTab === 'PANTHEON' ? 'text-black/70' : 'text-[#e6c788]'}`}>성역 랭킹</span></div>
          </button>
          <button onClick={() => setActiveMainTab('ASTRA')} className={`group relative w-64 h-14 rounded-xl font-black text-sm transition-all overflow-hidden border ${activeMainTab === 'ASTRA' ? 'bg-[#e6c788] border-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${activeMainTab === 'ASTRA' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}><span className="tracking-widest text-lg">ASTRA</span></div>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${activeMainTab === 'ASTRA' ? '!translate-y-0 !opacity-100' : ''}`}><span className="text-[15px]">아스트라</span><span className={`text-[10px] ${activeMainTab === 'ASTRA' ? 'text-black/70' : 'text-[#e6c788]'}`}>길드원 현황</span></div>
          </button>
        </div>

        {activeMainTab === 'PANTHEON' && (
          <section className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(RANKING_INFO) as Array<keyof typeof RANKING_INFO>).map((key) => {
                const info = RANKING_INFO[key];
                const isActive = activeRankTab === key;
                const theme = CATEGORY_THEMES[key];
                
                return (
                  <button key={key} onClick={() => setActiveRankTab(key)} className={`group relative w-28 md:w-36 h-16 md:h-20 rounded-2xl border transition-all overflow-hidden ${isActive ? theme.tab : 'bg-[#1c1c1e] border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'}`}>
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${isActive ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}><span className="font-black tracking-widest text-zinc-400 text-sm md:text-base">{info.en}</span></div>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isActive ? '!translate-y-0 !opacity-100' : ''}`}><span className={`font-black ${isActive ? theme.text : 'text-white'} text-[13px] md:text-[15px] leading-tight`}>{info.kr}</span><span className={`text-[9px] font-bold ${isActive ? theme.text : 'text-zinc-500'}`}>{info.sub}</span></div>
                  </button>
                );
              })}
            </div>

            <div className="text-center py-2">
              <h2 className={`text-3xl font-black tracking-widest flex justify-center items-center gap-3 ${CATEGORY_THEMES[activeRankTab].text}`}>
                {RANKING_INFO[activeRankTab].en}
              </h2>
              <p className="text-zinc-400 text-sm mt-2 font-bold">「 {RANKING_INFO[activeRankTab].desc} 」</p>
            </div>

            <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-4 shadow-xl">
              <button onClick={() => { if (selectedClass === "전체" && !isClassFilterOpen) setIsClassFilterOpen(true); else { setSelectedClass("전체"); setIsClassFilterOpen(false); } }} className={`w-full py-2.5 rounded-lg text-sm font-bold transition border flex items-center justify-center gap-2 ${selectedClass === "전체" && !isClassFilterOpen ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:text-white' : 'bg-zinc-800 text-[#e6c788] border-[#e6c788]/50 shadow-md'}`}>
                {selectedClass === "전체" && !isClassFilterOpen ? '클래스별 랭킹 검색 ▼' : '전체 클래스 통합 랭킹 보기 ↺'}
              </button>

              {isClassFilterOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  {CLASS_GROUPS.map((group) => (
                    <div key={group.name} className="bg-[#121212] p-3 rounded-xl border border-zinc-800/50">
                      <div className="text-[10px] font-black text-zinc-500 mb-2 px-1">{group.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.classes.map(cls => (
                          <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${selectedClass === cls ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>{cls}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedCharacters.map((char) => {
                const earnedTitles = getAllEarnedTitles(char);
                const currentRankTitleInfo = earnedTitles.find(t => t.type === activeRankTab);
                const currentRankTitle = currentRankTitleInfo?.name || '';
                const score = getScore(char, activeRankTab);
                
                const categoryRank = allSortedCharacters.findIndex(c => c.id === char.id) + 1;
                const classRank = activeRankTab === 'KRATOS' ? [...dbCharacters].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id) + 1 : categoryRank;
                const rankToUse = activeRankTab === 'KRATOS' ? classRank : categoryRank;
                const isTop3 = categoryRank <= 3;
                
                const hoverTooltipId = `hover-${char.id}-${activeRankTab}`;
                const isHoverTooltipOpen = openHoverTooltipId === hoverTooltipId;
                
                // 🟢 핵심 Z-Index 수정: 클릭 툴팁이 이 카드 안에서 열렸는지 아이디(char.id)를 포함하는지 확인
                const isClickTooltipOpenForThisCard = openClickTooltipId?.includes(`-${char.id}-`) && openClickTooltipId?.includes('-PANTHEON');
                const isTooltipActiveOnCard = isHoverTooltipOpen || isClickTooltipOpenForThisCard;
                
                const topLoreData = generateLore(currentRankTitle, rankToUse, char.job, activeRankTab);
                const topTheme = CATEGORY_THEMES[activeRankTab];

                return (
                  <div key={char.id} className={`relative bg-gradient-to-b from-[#1c1c1e] to-[#121212] border ${isTop3 ? 'border-[#e6c788]/40 shadow-[0_5px_20px_rgba(230,199,136,0.1)]' : 'border-zinc-800'} rounded-2xl p-6 group hover:border-zinc-500 transition-all ${isTooltipActiveOnCard ? 'z-50' : 'z-10'}`}>
                    
                    <div className={`absolute right-0 top-0 w-16 h-16 rounded-bl-3xl rounded-tr-2xl flex items-center justify-center font-black text-2xl shadow-bl ${
                      categoryRank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                      categoryRank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black' :
                      categoryRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      #{categoryRank}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="pr-12">
                        {currentRankTitle && rankToUse <= 3 ? (
                          <div 
                            className="relative inline-block mb-2"
                            onMouseEnter={() => setOpenHoverTooltipId(hoverTooltipId)}
                            onMouseLeave={() => setOpenHoverTooltipId(null)}
                          >
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md inline-flex items-center gap-1 transition-transform cursor-help border ${topTheme.tag}`}>
                              {currentRankTitle}
                            </span>

                            {isHoverTooltipOpen && (
                              <div className={`absolute top-[calc(100%+8px)] left-0 w-[300px] bg-[#1a1a1c] border ${topTheme.border} rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default`} onClick={e => e.stopPropagation()}>
                                <div className={`absolute -top-1.5 left-6 w-3 h-3 bg-[#1a1a1c] border-t border-l ${topTheme.border} transform rotate-45`}></div>
                                <div className="relative z-10 flex flex-col gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-black ${topTheme.text} text-[15px] tracking-wide`}>[{topLoreData.title}]</span>
                                  </div>
                                  <p className="text-[13px] font-bold text-zinc-300 leading-snug break-keep">{topLoreData.meaning}</p>
                                  <div className="w-full h-px bg-zinc-700/60"></div>
                                  <p className="text-[13px] font-bold text-zinc-200 leading-relaxed break-keep">{topLoreData.tribute}</p>
                                  <div className="mt-1 bg-black/40 border border-zinc-800/80 rounded-md p-2">
                                    <p className="text-[10px] font-bold text-zinc-400 text-center break-keep">{topLoreData.sourceText}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          currentRankTitle && (
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md mb-2 inline-flex items-center gap-1 border ${topTheme.tag}`}>
                              {currentRankTitle}
                            </span>
                          )
                        )}

                        <h3 className="text-2xl font-black text-white flex items-center gap-2">{char.name}</h3>
                        <div className="text-xs text-zinc-400 font-bold mt-1">{char.job}</div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1 relative">
                        {earnedTitles.map(t => {
                          const clickId = `click-${char.id}-${t.type}-PANTHEON`;
                          const isClicked = openClickTooltipId === clickId;
                          const loreData = generateLore(t.name, t.rank, char.job, t.type as any);

                          return (
                            <div key={t.type} className="relative inline-block">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenClickTooltipId(isClicked ? null : clickId); }}
                                className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${t.theme.tag} ${isClicked ? 'ring-2 ring-white/50 z-10 opacity-100' : 'opacity-80 hover:opacity-100'}`}
                              >
                                {t.name}
                              </button>

                              {isClicked && (
                                <div className={`absolute top-[calc(100%+8px)] left-0 w-[280px] bg-[#1a1a1c] border ${t.theme.border} rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default`} onClick={e => e.stopPropagation()}>
                                  <div className={`absolute -top-1.5 left-4 w-3 h-3 bg-[#1a1a1c] border-t border-l ${t.theme.border} transform rotate-45`}></div>
                                  <div className="relative z-10 flex flex-col gap-2.5 text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-black ${t.theme.text} text-[14px] tracking-wide`}>[{loreData.title}]</span>
                                    </div>
                                    <p className="text-[12px] font-bold text-zinc-300 leading-snug break-keep">{loreData.meaning}</p>
                                    <div className="w-full h-px bg-zinc-700/60"></div>
                                    <p className="text-[12px] font-bold text-zinc-200 leading-relaxed break-keep">{loreData.tribute}</p>
                                    <div className="mt-1 bg-black/40 border border-zinc-800/80 rounded-md p-2">
                                      <p className="text-[9px] font-bold text-zinc-400 text-center break-keep">{loreData.sourceText}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-[#121212] p-4 rounded-xl border border-zinc-800/80 mt-2 space-y-3">
                        <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                          <span className="text-zinc-500 text-xs font-bold">{RANKING_INFO[activeRankTab].stat}</span>
                          <span className="font-black text-[#e6c788] text-xl leading-none">{score.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-zinc-600">서버 전체 순위</span>
                          <span className="text-zinc-400">{char.serverRankOverall ? `#${char.serverRankOverall.toLocaleString()}` : '집계 중'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-zinc-600">데이안 서버 순위</span>
                          <span className="text-zinc-400">{char.serverRankDeian ? `#${char.serverRankDeian.toLocaleString()}` : '집계 중'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeMainTab === 'ASTRA' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="flex gap-4 mb-6">
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">성역에 등록된 전체 캐릭터</span>
                <span className="text-2xl font-black text-white">{dbCharacters.length}</span>
              </div>
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">성역의 대표 (가문 대표)</span>
                <span className="text-2xl font-black text-[#e6c788]">{mainCharacters.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mainCharacters.map((mainChar, idx) => {
                const mainTitles = getAllEarnedTitles(mainChar);
                const isClickTooltipOpenForThisCard = openClickTooltipId?.includes(`-${mainChar.id}-`) && openClickTooltipId?.includes('-ASTRA');
                
                return (
                  <div key={idx} className={`relative bg-gradient-to-r from-[#1c1c1e] to-[#121212] border border-zinc-800 rounded-2xl p-5 flex flex-col xl:flex-row justify-between xl:items-center gap-6 hover:border-zinc-600 transition-colors ${isClickTooltipOpenForThisCard ? 'z-50' : 'z-10'}`}>
                    <div className="flex items-center gap-5 min-w-[280px]">
                      <div className="flex flex-col items-center justify-center min-w-[70px]">
                        {mainChar.status === '생텀 접속중' && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] mb-1"></div>}
                        {mainChar.status === '인게임' && <div className="w-3 h-3 bg-blue-500 rounded-full mb-1 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                        {mainChar.status === '오프라인' && <div className="w-3 h-3 bg-zinc-600 rounded-full mb-1"></div>}
                        <span className={`text-[10px] font-black ${mainChar.status === '생텀 접속중' ? 'text-emerald-500' : mainChar.status === '인게임' ? 'text-blue-400' : 'text-zinc-500'}`}>{mainChar.status}</span>
                        {mainChar.status === '오프라인' && <span className="text-[9px] text-zinc-600 mt-0.5">{mainChar.lastSeen}</span>}
                      </div>

                      <div className="w-px h-16 bg-zinc-800 hidden xl:block"></div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-[#e6c788] text-black font-black px-1.5 py-0.5 rounded">대표 캐릭터</span>
                          <span className="text-xs text-zinc-400 font-bold">{mainChar.job}</span>
                        </div>
                        <h4 className="text-2xl font-black text-white">{mainChar.name}</h4>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2 relative">
                          {mainTitles.length > 0 ? mainTitles.map(t => {
                            const clickId = `click-${mainChar.id}-${t.type}-ASTRA`;
                            const isClicked = openClickTooltipId === clickId;
                            const loreData = generateLore(t.name, t.rank, mainChar.job, t.type as any);

                            return (
                              <div key={t.type} className="relative inline-block">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenClickTooltipId(isClicked ? null : clickId); }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${t.theme.tag} ${isClicked ? 'ring-2 ring-white/50 z-10 opacity-100' : 'opacity-80 hover:opacity-100'}`}
                                >
                                  {t.name}
                                </button>

                                {isClicked && (
                                  <div className={`absolute top-[calc(100%+8px)] left-0 w-[280px] bg-[#1a1a1c] border ${t.theme.border} rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default`} onClick={e => e.stopPropagation()}>
                                    <div className={`absolute -top-1.5 left-4 w-3 h-3 bg-[#1a1a1c] border-t border-l ${t.theme.border} transform rotate-45`}></div>
                                    <div className="relative z-10 flex flex-col gap-2.5 text-left">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`font-black ${t.theme.text} text-[14px] tracking-wide`}>[{loreData.title}]</span>
                                      </div>
                                      <p className="text-[12px] font-bold text-zinc-300 leading-snug break-keep">{loreData.meaning}</p>
                                      <div className="w-full h-px bg-zinc-700/60"></div>
                                      <p className="text-[12px] font-bold text-zinc-200 leading-relaxed break-keep">{loreData.tribute}</p>
                                      <div className="mt-1 bg-black/40 border border-zinc-800/80 rounded-md p-2">
                                        <p className="text-[9px] font-bold text-zinc-400 text-center break-keep">{loreData.sourceText}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }) : <span className="text-[9px] text-zinc-600">획득한 칭호 없음</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col xl:items-end justify-center min-w-[250px]">
                      <span className="text-[10px] text-[#e6c788] font-bold mb-2 tracking-widest">대표 스탯 현황</span>
                      <div className="grid grid-cols-2 gap-2 text-xs w-full xl:w-auto">
                        <div className="bg-zinc-800/50 px-3 py-1.5 rounded border border-zinc-700/50 flex justify-between xl:gap-4"><span className="text-zinc-500">전투력</span> <span className="text-white font-black">{mainChar.combatPower.toLocaleString()}</span></div>
                        <div className="bg-zinc-800/50 px-3 py-1.5 rounded border border-zinc-700/50 flex justify-between xl:gap-4"><span className="text-zinc-500">생활력</span> <span className="text-white font-black">{mainChar.lifePower.toLocaleString()}</span></div>
                        <div className="bg-zinc-800/50 px-3 py-1.5 rounded border border-zinc-700/50 flex justify-between xl:gap-4"><span className="text-zinc-500">매력도</span> <span className="text-white font-black">{mainChar.charm.toLocaleString()}</span></div>
                        <div className="bg-zinc-800/50 px-3 py-1.5 rounded border border-zinc-700/50 flex justify-between xl:gap-4"><span className="text-zinc-500">공헌도</span> <span className="text-white font-black">{mainChar.contribution.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}