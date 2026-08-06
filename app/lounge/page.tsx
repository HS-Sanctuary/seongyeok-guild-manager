"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  "빙결술사": ["북신", "빙왕", "빙마", "빙결술사"],
  "전격술사": ["뇌신", "뇌왕", "뇌마", "전격술사"],
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
  "듀얼블레이드": ["천참", "보름달", "회오리", "듀얼블레이드"],
};

const TOP_TITLES = {
  TELOS: ['헬리오스', '셀레네', '에오스'],
  PIETAS: ['시리우스', '레굴루스', '알데바란'],
  TECHNE: ['폴리매스', '마이스터', '아르티장'],
  HARMONIA: ['아글라이아', '카리스', '칼로스'],
};

interface Character {
  id: string;
  accountId: string;
  name: string;
  job: string;
  combatPower: number; 
  magicResist: number; 
  lifePower: number;   
  charm: number;       
  contribution: number;
  isMain: boolean;
  status: '생텀 접속중' | '인게임' | '오프라인';
  lastSeen?: string;
  pendingTasks?: string[];
  serverRankOverall?: number;
  serverRankDeian?: number;
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
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false); // 🟢 필터 아코디언 상태
  const [showLoreGuide, setShowLoreGuide] = useState(false);

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
    if (selectedClass !== "전체") {
      chars = chars.filter(c => c.job === selectedClass);
    }
    return chars;
  };

  const getAllEarnedTitles = (char: Character) => {
    const titles: { type: string, name: string, color: string }[] = [];
    
    const telosRank = [...MOCK_CHARACTERS].sort((a,b) => getScore(b, 'TELOS') - getScore(a, 'TELOS')).findIndex(c => c.id === char.id);
    if(telosRank >= 0 && telosRank < 3) titles.push({ type: 'TELOS', name: TOP_TITLES.TELOS[telosRank], color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' });

    const pietasRank = [...MOCK_CHARACTERS].sort((a,b) => getScore(b, 'PIETAS') - getScore(a, 'PIETAS')).findIndex(c => c.id === char.id);
    if(pietasRank >= 0 && pietasRank < 3) titles.push({ type: 'PIETAS', name: TOP_TITLES.PIETAS[pietasRank], color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' });

    const kratosRank = [...MOCK_CHARACTERS].filter(c => c.job === char.job).sort((a,b) => b.combatPower - a.combatPower).findIndex(c => c.id === char.id);
    const kTitles = CLASS_TITLES[char.job];
    if (kTitles) {
      if(kratosRank >= 0 && kratosRank < 3) {
        titles.push({ type: 'KRATOS', name: kTitles[kratosRank], color: 'bg-red-500/20 text-red-400 border-red-500/50' });
      } else {
        titles.push({ type: 'KRATOS', name: kTitles[3], color: 'bg-zinc-800 text-zinc-400 border-zinc-700' });
      }
    }

    const techneRank = [...MOCK_CHARACTERS].sort((a,b) => getScore(b, 'TECHNE') - getScore(a, 'TECHNE')).findIndex(c => c.id === char.id);
    if(techneRank >= 0 && techneRank < 3) titles.push({ type: 'TECHNE', name: TOP_TITLES.TECHNE[techneRank], color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' });

    const harmoRank = [...MOCK_CHARACTERS].sort((a,b) => getScore(b, 'HARMONIA') - getScore(a, 'HARMONIA')).findIndex(c => c.id === char.id);
    if(harmoRank >= 0 && harmoRank < 3) titles.push({ type: 'HARMONIA', name: TOP_TITLES.HARMONIA[harmoRank], color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' });

    return titles;
  };

  const getGroupedRoster = () => {
    const grouped: Record<string, Character[]> = {};
    MOCK_CHARACTERS.forEach(c => {
      if (!grouped[c.accountId]) grouped[c.accountId] = [];
      grouped[c.accountId].push(c);
    });
    Object.values(grouped).forEach(arr => {
      arr.sort((a, b) => (a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1));
    });
    return Object.values(grouped);
  };

  if (!mounted) return null;

  const allSortedCharacters = getAllSortedCharacters(); // 절대 랭킹용 기준 배열
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
          
          <button 
            onClick={() => setShowLoreGuide(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-zinc-700 hidden md:flex"
          >
            <span>📖</span> SANCTUM 세계관 가이드
          </button>
        </header>

        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white text-xl">✕</button>
              <h2 className="text-2xl font-black text-[#e6c788] mb-6 border-b border-zinc-800 pb-4">📖 SANCTUM 세계관 가이드</h2>
              
              <div className="space-y-6 text-sm text-zinc-300">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">🏛️ AGORA (아고라 / 길드 라운지)</h3>
                  <p>성역의 모든 구성원이 함께 모이고 소통하는 중심 공간입니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">✨ ASTRA (아스트라 / 길드원 현황)</h3>
                  <p>한 사람 한 사람이 하나의 별이며, 모두가 함께 성역을 이룹니다. 길드원의 정보와 성장 기록을 확인합니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">🏛️ PANTHEON (판테온 / 성역 랭킹)</h3>
                  <p>성역에서 최고의 경지에 오른 자들이 기록되는 명예의 전당입니다. 5가지 철학적 랭킹으로 나뉩니다.</p>
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
          <button 
            onClick={() => setActiveMainTab('PANTHEON')}
            className={`group relative w-64 h-14 rounded-xl font-black text-sm transition-all overflow-hidden border ${activeMainTab === 'PANTHEON' ? 'bg-[#e6c788] border-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
          >
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${activeMainTab === 'PANTHEON' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
              <span className="tracking-widest text-lg">PANTHEON</span>
            </div>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${activeMainTab === 'PANTHEON' ? '!translate-y-0 !opacity-100' : ''}`}>
              <span className="text-[15px]">판테온</span>
              <span className={`text-[10px] ${activeMainTab === 'PANTHEON' ? 'text-black/70' : 'text-[#e6c788]'}`}>성역 랭킹</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveMainTab('ASTRA')}
            className={`group relative w-64 h-14 rounded-xl font-black text-sm transition-all overflow-hidden border ${activeMainTab === 'ASTRA' ? 'bg-[#e6c788] border-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
          >
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${activeMainTab === 'ASTRA' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
              <span className="tracking-widest text-lg">ASTRA</span>
            </div>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${activeMainTab === 'ASTRA' ? '!translate-y-0 !opacity-100' : ''}`}>
              <span className="text-[15px]">아스트라</span>
              <span className={`text-[10px] ${activeMainTab === 'ASTRA' ? 'text-black/70' : 'text-[#e6c788]'}`}>길드원 현황</span>
            </div>
          </button>
        </div>

        {activeMainTab === 'PANTHEON' && (
          <section className="space-y-8 animate-in fade-in duration-300">
            
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(RANKING_INFO) as Array<keyof typeof RANKING_INFO>).map((key) => {
                const info = RANKING_INFO[key];
                const isActive = activeRankTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveRankTab(key)}
                    className={`group relative w-28 md:w-36 h-16 md:h-20 rounded-2xl border transition-all overflow-hidden ${
                      isActive ? 'bg-zinc-800/80 border-[#e6c788] shadow-[0_0_15px_rgba(230,199,136,0.2)]' : 'bg-[#1c1c1e] border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 ${isActive ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                      <span className="font-black tracking-widest text-zinc-400 text-sm md:text-base">{info.en}</span>
                    </div>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isActive ? '!translate-y-0 !opacity-100' : ''}`}>
                      <span className="font-black text-white text-[13px] md:text-[15px] leading-tight">{info.kr}</span>
                      <span className="text-[9px] font-bold text-[#e6c788]">{info.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center py-2">
              <h2 className="text-3xl font-black text-white tracking-widest">{RANKING_INFO[activeRankTab].en}</h2>
              <p className="text-zinc-400 text-sm mt-2 font-bold">「 {RANKING_INFO[activeRankTab].desc} 」</p>
            </div>

            {/* 🟢 직업 계열 필터 아코디언 UI 적용 */}
            <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-4 shadow-xl">
              <button 
                onClick={() => {
                  if (selectedClass === "전체" && !isClassFilterOpen) {
                    setIsClassFilterOpen(true);
                  } else {
                    setSelectedClass("전체");
                    setIsClassFilterOpen(false);
                  }
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition border flex items-center justify-center gap-2 ${
                  selectedClass === "전체" && !isClassFilterOpen 
                    ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:text-white' 
                    : 'bg-zinc-800 text-[#e6c788] border-[#e6c788]/50 shadow-md'
                }`}
              >
                {selectedClass === "전체" && !isClassFilterOpen ? '클래스별 랭킹 검색 ▼' : '전체 클래스 통합 랭킹 보기 ↺'}
              </button>

              {isClassFilterOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  {CLASS_GROUPS.map((group) => (
                    <div key={group.name} className="bg-[#121212] p-3 rounded-xl border border-zinc-800/50">
                      <div className="text-[10px] font-black text-zinc-500 mb-2 px-1">{group.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.classes.map(cls => (
                          <button 
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${selectedClass === cls ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedCharacters.map((char) => {
                const earnedTitles = getAllEarnedTitles(char);
                const currentRankTitle = earnedTitles.find(t => t.type === activeRankTab)?.name || '';
                const score = getScore(char, activeRankTab);
                
                // 🟢 절대 랭킹 (전체 명단 기준 진짜 순위) 산출
                const absoluteRank = allSortedCharacters.findIndex(c => c.id === char.id) + 1;
                const isTop3 = absoluteRank <= 3;
                
                return (
                  <div key={char.id} className={`relative bg-gradient-to-b from-[#1c1c1e] to-[#121212] border ${isTop3 ? 'border-[#e6c788]/40 shadow-[0_5px_20px_rgba(230,199,136,0.1)]' : 'border-zinc-800'} rounded-2xl p-6 overflow-hidden group hover:border-zinc-500 transition-all`}>
                    
                    <div className={`absolute right-0 top-0 w-16 h-16 rounded-bl-3xl flex items-center justify-center font-black text-2xl shadow-bl ${
                      absoluteRank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                      absoluteRank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black' :
                      absoluteRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      #{absoluteRank}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="pr-12">
                        {currentRankTitle && (
                          <span className={`text-[11px] font-black px-2 py-1 rounded-md mb-2 inline-block ${
                            absoluteRank === 1 || currentRankTitle === CLASS_TITLES[char.job]?.[0] ? 'bg-red-900/40 text-red-400 border border-red-700/50' :
                            absoluteRank === 2 || currentRankTitle === CLASS_TITLES[char.job]?.[1] ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50' :
                            absoluteRank === 3 || currentRankTitle === CLASS_TITLES[char.job]?.[2] ? 'bg-green-900/40 text-green-400 border border-green-700/50' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {currentRankTitle}
                          </span>
                        )}
                        <h3 className="text-2xl font-black text-white flex items-center gap-2">
                          {char.name}
                        </h3>
                        <div className="text-xs text-zinc-400 font-bold mt-1">{char.job}</div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {earnedTitles.map(t => (
                          <span key={t.type} className={`text-[9px] px-1.5 py-0.5 rounded border ${t.color} opacity-80`} title={t.type}>
                            {t.name}
                          </span>
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
                        {mainChar.status === '생텀 접속중' && (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] mb-1"></div>
                        )}
                        {mainChar.status === '인게임' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full mb-1 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        )}
                        {mainChar.status === '오프라인' && (
                          <div className="w-3 h-3 bg-zinc-600 rounded-full mb-1"></div>
                        )}
                        <span className={`text-[10px] font-black ${
                          mainChar.status === '생텀 접속중' ? 'text-emerald-500' :
                          mainChar.status === '인게임' ? 'text-blue-400' : 'text-zinc-500'
                        }`}>
                          {mainChar.status}
                        </span>
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
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${t.color}`}>
                              {t.name}
                            </span>
                          )) : (
                            <span className="text-[9px] text-zinc-600">획득한 칭호 없음</span>
                          )}
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
                              <button 
                                key={i}
                                onClick={() => { setActiveMainTab('PANTHEON'); setActiveRankTab('KRATOS'); }}
                                className="text-xs bg-red-900/30 text-red-400 border border-red-800/50 px-2 py-1 rounded hover:bg-red-800/50 transition cursor-pointer"
                              >
                                {task} 
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-500 font-bold mt-1">모든 과제 완료! ✨</span>
                        )}
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
                        )) : (
                          <span className="text-xs text-zinc-700 font-bold">등록된 별이 없습니다.</span>
                        )}
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