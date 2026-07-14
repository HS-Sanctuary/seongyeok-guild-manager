"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// =====================================================================
// 🎯 직업 및 카테고리 데이터
// =====================================================================
const CLASSES = ["전체", "전사", "마법사", "힐러", "궁수", "기사", "도적", "기타"];
const JOB_ICONS: { [key: string]: string } = {
  전체: "🌐", 전사: "⚔️", 마법사: "🪄", 힐러: "💖", 궁수: "🏹", 기사: "🛡️", 도적: "🥷", 기타: "📌"
};

// =====================================================================
// 🎯 공략 링크 더미 데이터 (DB 연동 전 임시 데이터)
// =====================================================================
const MOCK_GUIDES = [
  { id: 1, title: "어비스 3종 매우어려움 전사 어그로 핑퐁 꿀팁", job: "전사", author: "한설", link: "https://youtube.com", platform: "YouTube", likes: 24, date: "2026. 07. 10" },
  { id: 2, title: "마법사 광역기 딜사이클 완벽 정리 (인벤 펌)", job: "마법사", author: "춘법", link: "https://inven.co.kr", platform: "Inven", likes: 18, date: "2026. 07. 09" },
  { id: 3, title: "힐러 마나 관리 안 될 때 꼭 봐야하는 영상", job: "힐러", author: "꽃닝", link: "https://youtube.com", platform: "YouTube", likes: 32, date: "2026. 07. 08" },
  { id: 4, title: "궁수 포지셔닝 및 생존기 타이밍", job: "궁수", author: "하채", link: "https://cafe.naver.com", platform: "Cafe", likes: 11, date: "2026. 07. 05" },
  { id: 5, title: "카브락 레이드 기사 뎀감기 로테이션", job: "기사", author: "십쇼", link: "https://youtube.com", platform: "YouTube", likes: 45, date: "2026. 07. 02" },
  { id: 6, title: "도적 신규 스킬트리 DPS 실험 결과", job: "도적", author: "별콩", link: "https://inven.co.kr", platform: "Inven", likes: 15, date: "2026. 07. 01" },
];

export default function GuidePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("전체");

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    setUser(JSON.parse(savedUser));
  }, [router]);

  if (!mounted || !user) return null;

  // 필터링 로직
  const filteredGuides = selectedFilter === "전체" 
    ? MOCK_GUIDES 
    : MOCK_GUIDES.filter(guide => guide.job === selectedFilter);

  // 플랫폼별 색상 태그
  const getPlatformStyle = (platform: string) => {
    switch(platform) {
      case "YouTube": return "bg-red-900/20 text-red-400 border-red-900/50";
      case "Inven": return "bg-blue-900/20 text-blue-400 border-blue-900/50";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20">
      

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🟦 헤더 & 새 글 작성 버튼 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              📚 직업별 공략 / 꿀팁
            </h1>
            <p className="text-sm text-zinc-400 mt-2">유튜브, 인벤 등에 올라온 유용한 공략 링크를 공유하고 저장하는 공간입니다.</p>
          </div>
          <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition flex items-center gap-2 whitespace-nowrap">
            <span>🔗</span> 링크 공유하기
          </button>
        </div>

        {/* 🟦 1. 직업 필터링 (가로 스크롤 대응) */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedFilter(cls)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap border
                ${selectedFilter === cls 
                  ? 'bg-zinc-100 text-black border-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-[#252528] text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                }`}
            >
              <span>{JOB_ICONS[cls]}</span>
              {cls}
            </button>
          ))}
        </div>

        {/* 🟦 2. 공략 링크 리스트 (그리드 레이아웃) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuides.length > 0 ? (
            filteredGuides.map(guide => (
              <div key={guide.id} className="bg-[#252528] border border-zinc-700/80 hover:border-yellow-600/50 rounded-2xl p-5 shadow-lg transition group flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-[#1c1c1e] text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-zinc-700">
                      <span>{JOB_ICONS[guide.job]}</span> {guide.job}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded border ${getPlatformStyle(guide.platform)}`}>
                      {guide.platform}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white leading-snug group-hover:text-yellow-400 transition line-clamp-2">
                    {guide.title}
                  </h3>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👤</div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-zinc-300">{guide.author}</span>
                      <span className="text-[9px] text-zinc-500">{guide.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-zinc-400 hover:text-pink-400 transition">
                      <span className="text-sm">❤️</span>
                      <span className="text-xs font-bold">{guide.likes}</span>
                    </button>
                    {/* 바로가기 버튼 */}
                    <a href={guide.link} target="_blank" rel="noopener noreferrer" className="bg-[#121212] border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded transition">
                      보러가기 ↗
                    </a>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-zinc-500">
              <span className="text-4xl mb-3">📭</span>
              <p>아직 등록된 <strong>{selectedFilter}</strong> 공략이 없습니다.</p>
              <p className="text-sm mt-1">첫 번째 공략 링크를 공유해 보세요!</p>
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}