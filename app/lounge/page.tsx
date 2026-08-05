"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- [마스터님 기획: 클래스별 전용 칭호 시스템] ---
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

const JOB_ICONS: Record<string, string> = {
  전사: "⚔️", 마법사: "🪄", 궁수: "🏹", 힐러: "💖", 도적: "🥷", 음유시인: "🎵"
};

// --- [데이터 모델] ---
interface Character {
  id: string;
  accountId: string;
  name: string;
  job: string;
  combatPower: number;
  magicResist: number;
  isMain: boolean;
  status: '생텀 접속중' | '인게임' | '오프라인';
  lastSeen?: string;
}

// 임시 더미 데이터 (포켓몬 센터처럼 모든 캐릭터가 유기적으로 존재)
const MOCK_CHARACTERS: Character[] = [
  { id: '1', accountId: 'a1', name: '한설', job: '기사', combatPower: 45000, magicResist: 12000, isMain: true, status: '생텀 접속중' },
  { id: '2', accountId: 'a1', name: '한설부캐1', job: '대검전사', combatPower: 38000, magicResist: 8000, isMain: false, status: '생텀 접속중' },
  { id: '3', accountId: 'a2', name: '영겁', job: '화염술사', combatPower: 46000, magicResist: 15000, isMain: true, status: '인게임' },
  { id: '4', accountId: 'a3', name: '순월', job: '도적', combatPower: 42000, magicResist: 9000, isMain: true, status: '오프라인', lastSeen: '2일 전' },
  { id: '5', accountId: 'a4', name: '마치', job: '힐러', combatPower: 40000, magicResist: 18000, isMain: true, status: '생텀 접속중' },
  { id: '6', accountId: 'a4', name: '마치부캐', job: '음유시인', combatPower: 35000, magicResist: 14000, isMain: false, status: '생텀 접속중' },
  { id: '7', accountId: 'a5', name: '탄월', job: '궁수', combatPower: 44000, magicResist: 10000, isMain: true, status: '인게임' },
  { id: '8', accountId: 'a6', name: '검성유저', job: '검술사', combatPower: 47000, magicResist: 11000, isMain: true, status: '생텀 접속중' },
];

export default function AgoraLoungePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'명예의 전당' | '성역 로스터'>('명예의 전당');
  const [selectedClass, setSelectedClass] = useState<string>("전체");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 종합 점수 계산 (전투력 + 마도저항)
  const calculateScore = (c: Character) => c.combatPower + c.magicResist;

  // 1. 클래스별 랭킹 산정 함수
  const getClassRanking = (jobName: string) => {
    const charsInClass = MOCK_CHARACTERS.filter(c => c.job === jobName || jobName === "전체")
      .sort((a, b) => calculateScore(b) - calculateScore(a));
    return charsInClass;
  };

  // 2. 계정별로 캐릭터 그룹화 (로스터용: 본캐가 맨 앞)
  const getGroupedRoster = () => {
    const grouped: Record<string, Character[]> = {};
    MOCK_CHARACTERS.forEach(c => {
      if (!grouped[c.accountId]) grouped[c.accountId] = [];
      grouped[c.accountId].push(c);
    });
    
    // 본캐가 배열의 0번째 오도록 정렬
    Object.values(grouped).forEach(arr => {
      arr.sort((a, b) => (a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1));
    });
    return Object.values(grouped);
  };

  // 3. 칭호 획득 함수 (마스터님 기획 반영)
  const getTitle = (job: string, rankIndex: number) => {
    const titles = CLASS_TITLES[job];
    if (!titles) return job; // 기본값
    if (rankIndex === 0) return titles[0]; // 1위
    if (rankIndex === 1) return titles[1]; // 2위
    if (rankIndex === 2) return titles[2]; // 3위
    return titles[3]; // 4위 이하
  };

  if (!mounted) return null;

  const allClasses = Object.keys(CLASS_TITLES);
  const rankedCharacters = getClassRanking(selectedClass);
  const rosterGroups = getGroupedRoster();

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10">
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pt-8">
        
        {/* 상단 타이틀 */}
        <header className="flex flex-col items-center justify-center py-6 border-b border-zinc-800">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md flex items-center gap-3 tracking-widest">
            AGORA <span className="text-[#e6c788] text-2xl md:text-3xl">성역 라운지</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 font-bold">성역의 모든 캐릭터들이 교류하고 증명하는 대광장</p>
        </header>

        {/* 메인 탭 */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setActiveTab('명예의 전당')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === '명예의 전당' ? 'bg-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] text-zinc-400 border border-zinc-800 hover:text-white'}`}
          >
            🏆 명예의 전당 (클래스 랭킹)
          </button>
          <button 
            onClick={() => setActiveTab('성역 로스터')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === '성역 로스터' ? 'bg-[#e6c788] text-black shadow-[0_0_20px_rgba(230,199,136,0.4)] scale-105' : 'bg-[#1c1c1e] text-zinc-400 border border-zinc-800 hover:text-white'}`}
          >
            📋 성역 로스터 (길드원 현황)
          </button>
        </div>

        {/* 탭 1: 명예의 전당 (클래스 랭킹 및 칭호) */}
        {activeTab === '명예의 전당' && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* 직업 필터 */}
            <div className="flex flex-wrap gap-2 justify-center bg-[#1c1c1e] p-4 rounded-2xl border border-zinc-800 shadow-lg">
              <button 
                onClick={() => setSelectedClass("전체")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedClass === "전체" ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                전체 보기
              </button>
              {allClasses.map(cls => (
                <button 
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedClass === cls ? 'bg-[#e6c788] text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {cls}
                </button>
              ))}
            </div>

            {/* 랭킹 보드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedCharacters.map((char, index) => {
                const title = getTitle(char.job, index);
                const isTop3 = index < 3 && selectedClass !== "전체";
                
                return (
                  <div key={char.id} className={`relative bg-[#1c1c1e] border ${isTop3 ? 'border-[#e6c788]/50 shadow-[0_0_15px_rgba(230,199,136,0.15)]' : 'border-zinc-800'} rounded-2xl p-6 overflow-hidden group hover:border-[#e6c788] transition-all`}>
                    
                    {/* 순위 뱃지 */}
                    {selectedClass !== "전체" && (
                      <div className={`absolute -right-6 -top-6 w-20 h-20 rotate-12 flex items-end justify-start p-4 font-black text-2xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black' :
                        index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white' : 'hidden'
                      }`}>
                        {index + 1}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          {/* 🟢 기획하신 고유 칭호 출력 부분 */}
                          <span className={`text-[11px] font-black px-2 py-1 rounded-md mb-2 inline-block ${
                            index === 0 ? 'bg-red-900/40 text-red-400 border border-red-700/50' :
                            index === 1 ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50' :
                            index === 2 ? 'bg-green-900/40 text-green-400 border border-green-700/50' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {index === 0 && '🥇 '} 
                            {index === 1 && '🥈 '} 
                            {index === 2 && '🥉 '} 
                            {title}
                          </span>
                          <h3 className="text-2xl font-black text-white flex items-center gap-2">
                            {char.name}
                          </h3>
                        </div>
                        <div className="text-3xl opacity-50">{JOB_ICONS[char.job.split(' ')[0]] || '👤'}</div>
                      </div>

                      <div className="space-y-1 pt-4 border-t border-zinc-800/80">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">전투력</span>
                          <span className="font-bold text-zinc-300">{char.combatPower.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">마도저항</span>
                          <span className="font-bold text-zinc-300">{char.magicResist.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-zinc-800 border-dashed">
                          <span className="text-[#e6c788] font-bold">종합 평가</span>
                          <span className="font-black text-white">{calculateScore(char).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 탭 2: 성역 로스터 (계정 단위 통합 관리) */}
        {activeTab === '성역 로스터' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            
            {/* 현황 요약 */}
            <div className="flex gap-4 mb-6">
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">등록된 계정</span>
                <span className="text-2xl font-black text-white">{rosterGroups.length}</span>
              </div>
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                <span className="text-zinc-500 text-xs font-bold mb-1">총 생성 캐릭터</span>
                <span className="text-2xl font-black text-[#e6c788]">{MOCK_CHARACTERS.length}</span>
              </div>
            </div>

            {/* 계정별 리스트 */}
            <div className="grid grid-cols-1 gap-4">
              {rosterGroups.map((group, idx) => {
                const mainChar = group[0]; // 무조건 첫 번째가 본캐(isMain: true)
                const alts = group.slice(1);
                
                return (
                  <div key={idx} className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-zinc-600 transition-colors">
                    
                    {/* 좌측: 상태 및 대표 캐릭터 */}
                    <div className="flex items-center gap-5">
                      {/* 🟢 상태 표시기 (넥서스 -> 생텀 접속중) */}
                      <div className="flex flex-col items-center justify-center min-w-[70px]">
                        {mainChar.status === '생텀 접속중' && (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] mb-1"></div>
                        )}
                        {mainChar.status === '인게임' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full mb-1"></div>
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

                      <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

                      {/* 대표 캐릭터 정보 */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-[#e6c788] text-black font-black px-1.5 py-0.5 rounded">대표</span>
                          <span className="text-xs text-zinc-400 font-bold">{mainChar.job}</span>
                        </div>
                        <h4 className="text-xl font-black text-white">{mainChar.name}</h4>
                      </div>
                    </div>

                    {/* 우측: 부캐릭터 라인업 */}
                    <div className="flex flex-wrap gap-2 md:justify-end flex-1 pl-[90px] md:pl-0 mt-2 md:mt-0">
                      {alts.length > 0 ? alts.map(alt => (
                        <div key={alt.id} className="flex items-center gap-1.5 bg-[#121212] border border-zinc-700/50 px-3 py-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-default">
                          <span className="text-[10px] text-zinc-500 font-bold">{alt.job}</span>
                          <span className="text-sm font-bold text-zinc-300">{alt.name}</span>
                        </div>
                      )) : (
                        <span className="text-xs text-zinc-600 font-bold">등록된 부캐릭터가 없습니다.</span>
                      )}
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