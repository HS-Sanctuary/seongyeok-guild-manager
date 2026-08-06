"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ==========================================
// 1. 랭킹 메타 데이터
// ==========================================
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
// 2. 서사(Lore) 사전 및 마스터 특별 헌정사
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
  '칼로스': '내면과 외면을 아우르는 진정한 아름다움과 훌륭함을 의미합니다.'
};

const TRIBUTE_MESSAGES = {
  TELOS: {
    1: "모든 시련을 극복하고 만물의 이치를 깨우친 절대자여. 완벽한 밸런스로 도달한 그대의 궁극적인 경지는 성역의 영원한 신화로 기록될 것입니다.",
    2: "정상의 옥좌를 턱밑까지 추격한 초월자. 무력, 기술, 매력 어느 하나 빠짐없이 갈고닦은 그대의 끈질긴 집념은 차기 성역의 지배자를 예고하고 있습니다.",
    3: "균형과 완성의 길을 걷는 위대한 선구자. 다방면에서 이룩한 눈부신 성취는 숱한 별들에게 성역이 나아가야 할 궁극의 길을 제시합니다."
  },
  TECHNE: {
    1: "무에서 유를 창조하는 창조신이여. 굳은살 박인 손끝에서 탄생한 걸작들과 막대한 부는 성역의 거대한 경제를 홀로 떠받치고 있습니다.",
    2: "불과 쇠, 흙과 나무를 지배하는 경이로운 장인. 숱한 밤을 지새우며 흘린 그대의 고귀한 땀방울이 성역을 눈부시게 발전시켰습니다.",
    3: "인고의 시간을 견뎌내고 예술의 경지에 오른 마에스트로. 그대가 생산해내는 모든 자원은 성역이 살아 숨 쉬게 하는 강력한 심장입니다."
  },
  HARMONIA: {
    1: "숨이 멎을 듯한 자태로 만인을 굴복시킨 절대적인 미(美)의 화신. 그대가 걸음을 내디딜 때마다 성역의 모든 별들이 매혹되어 빛을 잃습니다.",
    2: "거부할 수 없는 우아함과 기품을 흩뿌리는 매혹의 지배자. 사람들의 시선과 마음을 훔친 그대의 찬란한 오라는 성역의 가장 아름다운 풍경입니다.",
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
  "검투왕": { meaning: "싸움의 본질을 꿰뚫고 모든 검투사를 굴복시킨 자.", tribute: "성역의 전장에서 가장 먼저 이름을 부를 만한 전사." },
  "검투사": { meaning: "가장 거친 전장에서도 끝까지 검을 놓지 않는 자.", tribute: "성역은 당신이 버티는 한 결코 무너지지 않는다." },
  "파괴신": { meaning: "휘두른 한 번의 일격으로 전장을 무너뜨리는 자.", tribute: "성역의 적들에게 가장 두려운 것은 당신의 대검이다." },
  "파괴왕": { meaning: "거대한 검 끝에서 파괴의 권능을 휘두르는 자.", tribute: "성역은 당신의 한 방을 믿고 전장에 선다." },
  "광전사": { meaning: "두려움을 버리고 오직 파괴를 향해 돌진하는 자.", tribute: "성역의 맹렬함을 가장 뜨겁게 증명하는 자." },
  "검신": { meaning: "검과 하나가 되어 검의 극의를 넘어선 자.", tribute: "성역의 검은 이제 무기가 아니라 하나의 경지다." },
  "검왕": { meaning: "한 자루의 검으로 모든 검객 위에 군림하는 자.", tribute: "성역의 검객들이 바라보는 가장 높은 곳." },
  "검성": { meaning: "검의 길을 끝없이 갈고닦아 경지에 오른 자.", tribute: "성역의 검로 위에 당신의 발자국이 남는다." },
  "수호신": { meaning: "자신의 방패 뒤에 모든 동료를 지켜낸 자.", tribute: "성역의 누구도 당신의 뒤에서는 두려워하지 않는다." },
  "수호왕": { meaning: "어떠한 공격 앞에서도 물러서지 않는 자.", tribute: "성역의 가장 단단한 방패가 되어준 이름." },
  "수호기사": { meaning: "가장 먼저 앞에 서서 동료의 길을 열어주는 자.", tribute: "성역의 전우들이 가장 믿고 등을 맡길 수 있는 기사." },
  "마신": { meaning: "인간의 한계를 넘어 마법 그 자체에 닿은 자.", tribute: "성역의 마법이 어디까지 갈 수 있는지를 보여준 자." },
  "대현자": { meaning: "수많은 마법의 비밀을 통달한 지혜로운 자.", tribute: "성역의 마법사들이 길을 잃을 때 가장 먼저 찾는 이름." },
  "현자": { meaning: "지식과 마력을 갈고닦아 깊은 경지에 이른 자.", tribute: "성역의 지혜를 마력으로 증명한 마법사." },
  "화신": { meaning: "타오르는 불꽃을 자신의 의지처럼 다루는 자.", tribute: "성역의 불꽃이 꺼지지 않는 이유는 당신이 있기 때문이다." },
  "염왕": { meaning: "모든 불꽃을 거느리고 전장을 불태우는 자.", tribute: "성역의 적들이 가장 먼저 피해야 할 불길." },
  "염마": { meaning: "닿는 모든 것을 재로 만드는 지옥의 불꽃을 품은 자.", tribute: "성역의 분노가 가장 뜨겁게 타오르는 순간." },
  "빙신": { meaning: "세상의 온기마저 얼려버리는 절대적인 냉기의 지배자.", tribute: "성역의 전장을 고요하게 얼려버리는 절대적인 힘." },
  "빙왕": { meaning: "얼어붙은 전장을 자신의 왕국으로 만든 자.", tribute: "성역의 적에게 움직일 틈조차 허락하지 않는 자." },
  "빙마": { meaning: "차가운 마력을 휘둘러 적의 움직임을 봉인하는 자.", tribute: "성역의 겨울이 가장 날카로워지는 순간." },
  "뢰신": { meaning: "하늘에서 떨어진 번개를 자신의 힘으로 삼은 자.", tribute: "성역의 하늘이 당신을 위해 번개를 내린다." },
  "뇌왕": { meaning: "천둥과 번개를 휘몰아 전장을 지배하는 자.", tribute: "성역의 전장을 한순간에 뒤집는 천둥의 왕." },
  "뇌마": { meaning: "한순간의 섬광으로 전장을 뒤흔드는 번개의 악마.", tribute: "성역의 적들이 당신의 움직임을 알아차리는 순간은 이미 늦었다." },
  "폭풍신": { meaning: "수많은 화살로 전장을 폭풍처럼 휩쓰는 자.", tribute: "성역의 화살비가 시작되면 누구도 그 폭풍에서 벗어날 수 없다." },
  "폭풍왕": { meaning: "쉴 새 없이 몰아치는 화살비로 적을 혼란에 빠뜨리는 자.", tribute: "성역의 전장을 가장 빠르게 뒤흔드는 바람." },
  "화랑": { meaning: "자유롭게 전장을 누비며 활과 발걸음으로 적을 농락하는 자.", tribute: "성역의 전장을 누비는 가장 자유로운 사수." },
  "신궁": { meaning: "하늘과 땅의 거리를 넘어 한 발의 화살로 운명을 꿰뚫는 자.", tribute: "성역의 가장 먼 곳까지 닿는 한 발의 신뢰." },
  "천궁": { meaning: "가장 먼 곳에서도 목표를 놓치지 않는 하늘의 궁수.", tribute: "성역의 하늘 아래, 당신의 사거리 밖은 없다." },
  "명궁": { meaning: "한 번 당긴 활시위에 승부를 맡기는 뛰어난 궁수.", tribute: "성역이 믿는 것은 백 발의 화살보다 당신의 한 발이다." },
  "파천궁신": { meaning: "한 발의 화살로 하늘마저 가르는 궁극의 사수.", tribute: "성역의 이름을 등에 지고 하늘을 꿰뚫은 자." },
  "파천궁제": { meaning: "수많은 화살과 힘을 한순간에 폭발시키는 파천의 지배자.", tribute: "성역의 화력이 한순간에 폭발하는 그 중심에 선 자." },
  "파천사수": { meaning: "꿰뚫는 화살과 끊임없는 움직임으로 전장을 장악하는 자.", tribute: "성역의 전장을 꿰뚫고 누비는 가장 날카로운 사수." },
  "셰익스피어": { meaning: "음악과 이야기로 사람의 마음을 움직이는 전장의 예술가.", tribute: "성역의 이야기를 노래로 남길 자격을 얻은 사람." },
  "호메로스": { meaning: "자신의 연주를 전설로 남기는 위대한 이야기꾼.", tribute: "오늘의 성역을 내일의 전설로 바꾸는 목소리." },
  "오르페우스": { meaning: "한 곡의 선율로 적의 마음마저 사로잡는 자.", tribute: "성역의 전장에도 당신의 선율이 흐른다." },
  "플로라비": { meaning: "꽃잎처럼 가볍게 춤추며 전장을 자신의 무대로 만드는 자.", tribute: "성역의 전장을 가장 아름다운 무대로 바꾸는 춤." },
  "파피에르": { meaning: "한순간의 몸짓마저 예술로 승화시키는 무대의 지배자.", tribute: "성역의 모두가 당신의 다음 움직임을 기다린다." },
  "블루에트": { meaning: "화려한 발걸음과 리듬으로 전장의 흐름을 바꾸는 자.", tribute: "성역의 전장에 가장 경쾌한 변화를 만들어내는 춤." },
  "마에스트로": { meaning: "모든 선율과 리듬을 지휘하여 전장을 하나의 악장으로 만드는 자.", tribute: "성역의 전장이 당신의 지휘 아래 하나의 음악이 된다." },
  "비르투오사": { meaning: "누구도 흉내 낼 수 없는 연주로 자신의 이름을 증명한 자.", tribute: "성역의 가장 빛나는 연주를 만들어내는 사람." },
  "솔리스트": { meaning: "오직 자신의 선율 하나만으로 무대를 완성하는 자.", tribute: "성역의 무대에 당신의 선율만으로 충분하다." },
  "그라시아": { meaning: "은총의 힘으로 쓰러진 이들에게 다시 일어설 힘을 주는 자.", tribute: "성역의 사람들이 다시 일어설 수 있는 이유가 되어준 자." },
  "베네딕토": { meaning: "축복을 내려 동료들의 생명을 지켜내는 자.", tribute: "성역의 전우들에게 가장 따뜻한 축복을 건네는 손." },
  "렐릭스": { meaning: "성스러운 힘을 품고 끝까지 동료 곁을 지키는 자.", tribute: "성역의 전우가 쓰러지지 않도록 끝까지 함께하는 사람." },
  "메시아": { meaning: "절망 속에서도 모두에게 구원의 길을 보여주는 자.", tribute: "성역이 어둠 속에서도 희망을 잃지 않는 이유." },
  "디바인": { meaning: "신성한 힘으로 어둠을 몰아내고 질서를 세우는 자.", tribute: "성역의 빛을 가장 강하게 밝히는 자." },
  "프리스트": { meaning: "기도와 신앙으로 동료의 영혼을 지켜주는 자.", tribute: "성역의 모두에게 평온한 안식을 건네는 사람." },
  "아라한": { meaning: "번뇌를 내려놓고 자신의 육체와 정신을 극한까지 단련한 자.", tribute: "성역의 무도가 어디까지 닿을 수 있는지 보여준 자." },
  "금강": { meaning: "무엇으로도 꺾을 수 없는 육체와 의지를 가진 자.", tribute: "성역의 가장 단단한 의지는 결코 쓰러지지 않는다." },
  "나한": { meaning: "끊임없는 수행 끝에 자신만의 무도를 깨우친 자.", tribute: "성역의 길 위에서 스스로 답을 찾아낸 수행자." },
  "암제": { meaning: "어둠의 힘을 지배하여 어둠의 정점에 오른 자.", tribute: "성역의 그림자마저 당신의 힘 앞에서는 고개를 숙인다." },
  "암왕": { meaning: "끝없는 암흑을 거느리고 적을 공포에 빠뜨리는 자.", tribute: "성역의 어둠을 가장 강력한 무기로 바꾼 자." },
  "암마": { meaning: "어둠 속에 몸을 감추고 죽음의 순간을 기다리는 자.", tribute: "성역의 그림자처럼 조용히 적의 뒤를 지키는 자." },
  "독왕": { meaning: "보이지 않는 독으로 전장을 지배하는 치명적인 사냥꾼.", tribute: "성역의 적에게 가장 조용하고 치명적인 경고." },
  "트릭스터": { meaning: "적의 예상을 뒤집으며 전장을 장난처럼 휘젓는 자.", tribute: "성역의 전장을 예측할 수 없게 만드는 가장 영리한 변수." },
  "땅거미": { meaning: "해가 지는 순간처럼 조용히 나타나 흔적 없이 사라지는 자.", tribute: "성역의 그림자가 되어 적이 보지 못하는 곳을 지키는 자." },
  "권신": { meaning: "두 주먹만으로 인간의 한계를 넘어선 자.", tribute: "성역의 주먹에는 무기가 필요하지 않다." },
  "권왕": { meaning: "맨주먹 하나로 모든 격투가 위에 군림하는 자.", tribute: "성역에서 가장 강한 것은 때때로 한 쌍의 주먹이다." },
  "권호": { meaning: "호랑이처럼 거칠고 날카로운 권격으로 상대를 압도하는 자.", tribute: "성역의 포효를 주먹 하나로 증명하는 자." },
  "유성천침": { meaning: "유성처럼 떨어지는 두 칼날로 적의 빈틈을 꿰뚫는 궁극의 쌍검사.", tribute: "성역의 칼날이 가장 빠르게, 그리고 가장 정확하게 승리를 새긴다." },
  "쌍극난무": { meaning: "두 칼날의 극의를 자유롭게 오가며 폭풍처럼 검격을 쏟아내는 자.", tribute: "성역의 전장을 가장 화려한 칼날의 춤으로 바꾸는 자." },
  "질풍쌍화": { meaning: "질풍처럼 적 사이를 누비며 두 칼날로 검화(劍花)를 피워내는 자.", tribute: "성역의 전장에 가장 빠르고 아름다운 칼날의 꽃을 피운다." }
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
      meaning = `무력의 정점에 달하여 더 이상 범접할 수 없는 ${job}의 절대자입니다.`;
      tribute = `성역의 전장을 지배하는 ${job}의 왕.`;
    }
  } else {
    meaning = LORE_DICTIONARY[title] || `${title}의 경지에 오른 자입니다.`;
    tribute = (TRIBUTE_MESSAGES as any)[category]?.[rank] || "";
  }

  // 🟢 괄호 부분(종합 랭킹 등)을 제외하고 깔끔하게 생성
  const sourceText = category === 'KRATOS' 
    ? `ℹ️ 성역 ${RANKING_INFO[category].kr} [${job}] ${rank}위에게 부여되는 칭호`
    : `ℹ️ 성역 ${RANKING_INFO[category].kr} ${rank}위에게 부여되는 칭호`;

  return { title, meaning, tribute, rank, sourceText };
};

// ==========================================
// 3. 데이터 모델
// ==========================================
interface Character {
  id: string; accountId: string; name: string; job: string;
  combatPower: number; magicResist: number; lifePower: number; charm: number; contribution: number;
  isMain: boolean; status: '생텀 접속중' | '인게임' | '오프라인'; lastSeen?: string;
  pendingTasks?: string[]; serverRankOverall?: number; serverRankDeian?: number;
}

const MOCK_CHARACTERS: Character[] = [
  { id: '1', accountId: 'a1', name: '한설', job: '기사', combatPower: 55000, magicResist: 12000, lifePower: 18000, charm: 9500, contribution: 5000, isMain: true, status: '생텀 접속중', pendingTasks: ['어비스(0/4)'], serverRankOverall: 142, serverRankDeian: 12 },
  { id: '2', accountId: 'a1', name: '한설부캐1', job: '대검전사', combatPower: 38000, magicResist: 8000, lifePower: 5000, charm: 3000, contribution: 1000, isMain: false, status: '생텀 접속중' },
  { id: '3', accountId: 'a2', name: '영겁', job: '화염술사', combatPower: 46000, magicResist: 15000, lifePower: 8000, charm: 12000, contribution: 3500, isMain: true, status: '인게임', serverRankOverall: 412, serverRankDeian: 45 },
  { id: '4', accountId: 'a3', name: '순월', job: '도적', combatPower: 42000, magicResist: 9000, lifePower: 22000, charm: 18000, contribution: 4200, isMain: true, status: '오프라인', lastSeen: '2일 전', pendingTasks: ['주간 레이드(2/4)'], serverRankOverall: 890, serverRankDeian: 98 },
  { id: '5', accountId: 'a4', name: '마치', job: '힐러', combatPower: 40000, magicResist: 18000, lifePower: 15000, charm: 15000, contribution: 4800, isMain: true, status: '생텀 접속중', serverRankOverall: 1205, serverRankDeian: 150 },
  { id: '7', accountId: 'a5', name: '탄월', job: '궁수', combatPower: 48000, magicResist: 10000, lifePower: 6000, charm: 8500, contribution: 2500, isMain: true, status: '인게임', serverRankOverall: 290, serverRankDeian: 31 },
  { id: '8', accountId: 'a6', name: '검성유저', job: '검술사', combatPower: 47000, magicResist: 11000, lifePower: 4000, charm: 5000, contribution: 1500, isMain: true, status: '생텀 접속중', serverRankOverall: 310, serverRankDeian: 35 },
];

export default function AgoraLoungePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'PANTHEON' | 'ASTRA'>('PANTHEON');
  const [activeRankTab, setActiveRankTab] = useState<keyof typeof RANKING_INFO>('TELOS');
  
  const [selectedClass, setSelectedClass] = useState<string>("전체"); 
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const getScore = (c: Character, type: keyof typeof RANKING_INFO) => {
    switch(type) {
      case 'KRATOS': return c.combatPower; 
      case 'TECHNE': return c.lifePower;
      case 'HARMONIA': return c.charm;
      case 'TELOS': return c.combatPower + c.lifePower + c.charm;
      case 'PIETAS': return c.contribution;
      default: return 0;
    }
  };

  const getAllSortedCharacters = () => {
    return [...MOCK_CHARACTERS].sort((a, b) => getScore(b, activeRankTab) - getScore(a, activeRankTab));
  };

  const getRankedCharacters = () => {
    let chars = getAllSortedCharacters();
    if (selectedClass !== "전체") chars = chars.filter(c => c.job === selectedClass);
    return chars;
  };

  const getAllEarnedTitles = (char: Character) => {
    const titles: { type: string, name: string, color: string }[] = [];
    const pushIfTop3 = (type: string, scoreType: keyof typeof RANKING_INFO, titleArr: string[], colors: string) => {
      const rank = [...MOCK_CHARACTERS].sort((a,b) => getScore(b, scoreType) - getScore(a, scoreType)).findIndex(c => c.id === char.id);
      if(rank >= 0 && rank < 3) titles.push({ type, name: titleArr[rank], color: colors });
    };

    pushIfTop3('TELOS', 'TELOS', TOP_TITLES.TELOS, 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50');
    pushIfTop3('PIETAS', 'PIETAS', TOP_TITLES.PIETAS, 'bg-purple-500/20 text-purple-400 border-purple-500/50');

    const kratosRank = [...MOCK_CHARACTERS].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id);
    const kTitles = CLASS_TITLES[char.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) titles.push({ type: 'KRATOS', name: kTitles[kratosRank], color: 'bg-red-500/20 text-red-400 border-red-700/50' });
      else titles.push({ type: 'KRATOS', name: kTitles[3], color: 'bg-zinc-800 text-zinc-400 border-zinc-700' });
    }

    pushIfTop3('TECHNE', 'TECHNE', TOP_TITLES.TECHNE, 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50');
    pushIfTop3('HARMONIA', 'HARMONIA', TOP_TITLES.HARMONIA, 'bg-pink-500/20 text-pink-400 border-pink-500/50');

    return titles;
  };

  const getGroupedRoster = () => {
    const grouped: Record<string, Character[]> = {};
    MOCK_CHARACTERS.forEach(c => {
      if (!grouped[c.accountId]) grouped[c.accountId] = [];
      grouped[c.accountId].push(c);
    });
    Object.values(grouped).forEach(arr => { arr.sort((a, b) => (a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1)); });
    return Object.values(grouped);
  };

  if (!mounted) return null;

  const allSortedCharacters = getAllSortedCharacters();
  const rankedCharacters = getRankedCharacters();
  const rosterGroups = getGroupedRoster();

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pt-8">
        
        <header className="relative flex flex-col items-center justify-center py-6 border-b border-zinc-800">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md flex items-center gap-3 tracking-widest">
            AGORA <span className="text-[#e6c788] text-2xl md:text-3xl">성역 라운지</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 font-bold">성역의 모든 캐릭터들이 교류하고 증명하는 대광장</p>
          
          <button onClick={() => setShowLoreGuide(true)} className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-zinc-700 hidden md:flex">
            <span>📖</span> SANCTUM 세계관 가이드
          </button>
        </header>

        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white text-xl">✕</button>
              <h2 className="text-2xl font-black text-[#e6c788] mb-6 border-b border-zinc-800 pb-4">📖 SANCTUM 세계관 가이드</h2>
              <div className="space-y-6 text-sm text-zinc-300">
                <div><h3 className="text-lg font-bold text-white mb-1">🏛️ AGORA (아고라 / 길드 라운지)</h3><p>성역의 모든 구성원이 함께 모이고 소통하는 중심 공간입니다.</p></div>
                <div><h3 className="text-lg font-bold text-white mb-1">✨ ASTRA (아스트라 / 길드원 현황)</h3><p>한 사람 한 사람이 하나의 별이며, 모두가 함께 성역을 이룹니다. 길드원의 정보와 성장 기록을 확인합니다.</p></div>
                <div><h3 className="text-lg font-bold text-white mb-1">🏛️ PANTHEON (판테온 / 성역 랭킹)</h3><p>성역에서 최고의 경지에 오른 자들이 기록되는 명예의 전당입니다. 5가지 철학적 랭킹으로 나뉩니다.</p>
                  <ul className="mt-3 space-y-2 pl-4 border-l-2 border-zinc-700">
                    <li><strong className="text-[#e6c788]">TELOS (텔로스)</strong>: 종합 랭킹. 도달과 완성의 기록.</li>
                    <li><strong className="text-[#e6c788]">KRATOS (크라토스)</strong>: 전투력 랭킹. 힘과 권능의 기록.</li>
                    <li><strong className="text-[#e6c788]">TECHNĒ (테크네)</strong>: 생활력 랭킹. 기술과 숙련의 기록.</li>
                    <li><strong className="text-[#e6c788]">HARMONIA (하르모니아)</strong>: 매력 랭킹. 아름다움과 조화의 기록.</li>
                    <li><strong className="text-[#e6c788]">PIETAS (피에타스)</strong>: 공헌도 랭킹. 헌신과 공헌의 기록.</li>
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
                return (
                  <button key={key} onClick={() => setActiveRankTab(key)} className={`group relative w-28 md:w-36 h-16 md:h-20 rounded-2xl border transition-all overflow-hidden ${isActive ? 'bg-zinc-800/80 border-[#e6c788] shadow-[0_0_15px_rgba(230,199,136,0.2)]' : 'bg-[#1c1c1e] border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'}`}>
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${isActive ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}><span className="font-black tracking-widest text-zinc-400 text-sm md:text-base">{info.en}</span></div>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isActive ? '!translate-y-0 !opacity-100' : ''}`}><span className="font-black text-white text-[13px] md:text-[15px] leading-tight">{info.kr}</span><span className="text-[9px] font-bold text-[#e6c788]">{info.sub}</span></div>
                  </button>
                );
              })}
            </div>

            <div className="text-center py-2">
              <h2 className="text-3xl font-black text-white tracking-widest">{RANKING_INFO[activeRankTab].en}</h2>
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
                const currentRankTitle = earnedTitles.find(t => t.type === activeRankTab)?.name || '';
                const score = getScore(char, activeRankTab);
                
                const categoryRank = allSortedCharacters.findIndex(c => c.id === char.id) + 1;
                const classRank = activeRankTab === 'KRATOS' ? [...MOCK_CHARACTERS].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id) + 1 : categoryRank;
                const rankToUse = activeRankTab === 'KRATOS' ? classRank : categoryRank;
                const isTop3 = categoryRank <= 3;
                
                const tooltipId = `${char.id}-${activeRankTab}`;
                const isTooltipOpen = openTooltipId === tooltipId;
                
                const loreData = generateLore(currentRankTitle, rankToUse, char.job, activeRankTab);

                return (
                  <div key={char.id} className={`relative bg-gradient-to-b from-[#1c1c1e] to-[#121212] border ${isTop3 ? 'border-[#e6c788]/40 shadow-[0_5px_20px_rgba(230,199,136,0.1)]' : 'border-zinc-800'} rounded-2xl p-6 group hover:border-zinc-500 transition-all ${isTooltipOpen ? 'z-50' : 'z-10'}`}>
                    
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
                            onMouseEnter={() => setOpenTooltipId(tooltipId)}
                            onMouseLeave={() => setOpenTooltipId(null)}
                            onClick={() => setOpenTooltipId(isTooltipOpen ? null : tooltipId)}
                          >
                            <button className={`text-[11px] font-black px-2 py-1 rounded-md inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg ${
                              rankToUse === 1 || currentRankTitle === CLASS_TITLES[char.job]?.[0] ? 'bg-red-900/40 text-red-400 border border-red-700/50 hover:bg-red-900/60' :
                              rankToUse === 2 || currentRankTitle === CLASS_TITLES[char.job]?.[1] ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50 hover:bg-blue-900/60' :
                              'bg-green-900/40 text-green-400 border border-green-700/50 hover:bg-green-900/60'
                            }`}>
                              {currentRankTitle}
                            </button>

                            {/* 🟢 괄호가 제거된 출처 박스가 포함된 툴팁 UI */}
                            {isTooltipOpen && (
                              <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] bg-[#1a1a1c] border border-zinc-700 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-[100] cursor-default" onClick={e => e.stopPropagation()}>
                                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#1a1a1c] border-t border-l border-zinc-700 transform rotate-45"></div>
                                
                                <div className="relative z-10 flex flex-col gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[15px]">✨</span>
                                    <span className="font-black text-[#e6c788] text-[15px] tracking-wide">[{loreData.title}]</span>
                                  </div>
                                  
                                  <p className="text-[13px] font-bold text-zinc-300 leading-snug break-keep">
                                    {loreData.meaning}
                                  </p>
                                  
                                  <div className="w-full h-px bg-zinc-700/60"></div>
                                  
                                  <p className="text-[13px] font-bold text-zinc-200 leading-relaxed break-keep">
                                    {loreData.tribute}
                                  </p>

                                  <div className="mt-1 bg-black/40 border border-zinc-800/80 rounded-md p-2">
                                    <p className="text-[10px] font-bold text-zinc-400 text-center break-keep">
                                      {loreData.sourceText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          currentRankTitle && (
                            <span className="text-[11px] font-black px-2 py-1 rounded-md mb-2 inline-block bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {currentRankTitle}
                            </span>
                          )
                        )}

                        <h3 className="text-2xl font-black text-white flex items-center gap-2">{char.name}</h3>
                        <div className="text-xs text-zinc-400 font-bold mt-1">{char.job}</div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {earnedTitles.map(t => (
                          <span key={t.type} className={`text-[9px] px-1.5 py-0.5 rounded border ${t.color} opacity-80`} title={t.type}>{t.name}</span>
                        ))}
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

        {/* 탭 2: ASTRA (기존 코드 완벽 유지) */}
        {activeMainTab === 'ASTRA' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="flex gap-4 mb-6">
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">등록된 계정</span>
                <span className="text-2xl font-black text-white">{rosterGroups.length}</span>
              </div>
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">성역의 별 (총 캐릭터)</span>
                <span className="text-2xl font-black text-[#e6c788]">{MOCK_CHARACTERS.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rosterGroups.map((group, idx) => {
                const mainChar = group[0];
                const alts = group.slice(1);
                const mainTitles = getAllEarnedTitles(mainChar);
                
                return (
                  <div key={idx} className="bg-gradient-to-r from-[#1c1c1e] to-[#121212] border border-zinc-800 rounded-2xl p-5 flex flex-col xl:flex-row justify-between xl:items-center gap-6 hover:border-zinc-600 transition-colors">
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
                          <span className="text-[10px] bg-[#e6c788] text-black font-black px-1.5 py-0.5 rounded">대표</span>
                          <span className="text-xs text-zinc-400 font-bold">{mainChar.job}</span>
                        </div>
                        <h4 className="text-2xl font-black text-white">{mainChar.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {mainTitles.length > 0 ? mainTitles.map((t, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${t.color}`}>{t.name}</span>
                          )) : <span className="text-[9px] text-zinc-600">획득한 칭호 없음</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-[#121212] border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-xl">📜</span>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-zinc-500 font-bold">주간 미완료 과제</span>
                        {mainChar.pendingTasks && mainChar.pendingTasks.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {mainChar.pendingTasks.map((task, i) => (
                              <button key={i} onClick={() => { setActiveMainTab('PANTHEON'); setActiveRankTab('KRATOS'); }} className="text-xs bg-red-900/30 text-red-400 border border-red-800/50 px-2 py-1 rounded hover:bg-red-800/50 transition cursor-pointer">{task}</button>
                            ))}
                          </div>
                        ) : <span className="text-xs text-emerald-500 font-bold mt-1">모든 과제 완료! ✨</span>}
                      </div>
                    </div>

                    <div className="flex flex-col xl:items-end justify-center min-w-[200px]">
                      <span className="text-[10px] text-zinc-500 font-bold mb-2">ASTRA (부캐릭터)</span>
                      <div className="flex flex-wrap xl:justify-end gap-2">
                        {alts.length > 0 ? alts.map(alt => (
                          <div key={alt.id} className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-zinc-400 font-bold">{alt.job}</span>
                            <span className="text-sm font-bold text-zinc-200">{alt.name}</span>
                          </div>
                        )) : <span className="text-xs text-zinc-700 font-bold">등록된 별이 없습니다.</span>}
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