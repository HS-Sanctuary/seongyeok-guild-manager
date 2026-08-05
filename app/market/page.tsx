"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- [더미 데이터 & 타입 정의 (API 연동 전 뼈대)] ---
interface MarketItem {
  id: string;
  name: string;
  category: string;
  lowestPrice: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
  updatedAt: string;
}

const DUMMY_RESULTS: MarketItem[] = [
  { id: 'item_001', name: '붉은 개조석', category: '재료', lowestPrice: 45000, averagePrice: 46200, trend: 'up', updatedAt: '방금 전' },
  { id: 'item_002', name: '푸른 개조석', category: '재료', lowestPrice: 21000, averagePrice: 22000, trend: 'stable', updatedAt: '3분 전' },
  { id: 'item_003', name: '여신의 날개', category: '소모품', lowestPrice: 5000, averagePrice: 5500, trend: 'down', updatedAt: '15분 전' },
  { id: 'item_004', name: '최고급 가죽', category: '재료', lowestPrice: 12000, averagePrice: 11500, trend: 'up', updatedAt: '1시간 전' },
  { id: 'item_005', name: '하이랜더 클레이모어', category: '장비', lowestPrice: 1500000, averagePrice: 1550000, trend: 'down', updatedAt: '2시간 전' },
];

const JOB_ICONS: Record<string, string> = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️"
};

export default function MarketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MarketItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { 
      router.push("/login"); 
    } else { 
      setUser(JSON.parse(savedUser)); 
      // 초기 진입 시 추천/인기 아이템을 보여주기 위해 더미 데이터 세팅
      setResults(DUMMY_RESULTS);
    }
  }, [router]);

  // 검색 실행 함수 (임시 딜레이 적용)
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && activeCategory === "전체") {
      setResults(DUMMY_RESULTS);
      return;
    }
    
    setIsSearching(true);
    
    // 향후 API 호출부가 들어갈 자리입니다.
    setTimeout(() => {
      let filtered = DUMMY_RESULTS;
      if (searchQuery.trim()) {
        filtered = filtered.filter(item => item.name.includes(searchQuery));
      }
      if (activeCategory !== "전체") {
        filtered = filtered.filter(item => item.category === activeCategory);
      }
      setResults(filtered);
      setIsSearching(false);
    }, 600);
  };

  // 카테고리 변경 시 자동 검색
  useEffect(() => {
    if (mounted) handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      
      {/* 글로벌 헤더 (메인과 동일) */}
      <div className="w-full bg-[#1c1c1e] border-b border-zinc-800 px-6 py-2.5 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div onClick={() => router.push('/')} className="flex items-center gap-2 text-white font-bold text-sm tracking-wide cursor-pointer hover:text-[#e6c788] transition">
            <span>🏰 SANCTUM</span>
          </div>
          <div className="w-px h-4 bg-zinc-700"></div>
          <span className="text-[#e6c788] text-xs font-black">거래소 시세 검색</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#121212] border border-zinc-600 flex items-center justify-center text-sm">{JOB_ICONS[user.job || "기사"] || "👦🏻"}</div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-white text-sm">{user.nickname}</span>
            <span className="text-[10px] text-zinc-400">{user.role || "마스터"}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1000px] mx-auto space-y-6">
        
        {/* 상단 타이틀 영역 */}
        <header className="flex flex-col items-center justify-center py-6">
          <h1 className="text-3xl font-black text-white drop-shadow-md flex items-center gap-2">
            ⚖️ 성역 <span className="text-[#e6c788]">통합 거래소</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-2">데이안 서버의 실시간 경매장 시세와 변동 추이를 확인하세요.</p>
        </header>

        {/* 검색 및 필터 영역 */}
        <section className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              type="text" 
              placeholder="아이템 이름을 입력하세요... (예: 붉은 개조석)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border-2 border-zinc-700 hover:border-zinc-500 focus:border-[#e6c788] text-white text-sm md:text-base p-4 pl-12 rounded-xl focus:outline-none transition-all shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-6 py-2 rounded-lg transition-colors shadow-md"
            >
              검색
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {["전체", "장비", "소모품", "재료", "기타"].map((category) => (
              <button 
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  activeCategory === category 
                    ? 'bg-[#e6c788] text-black border-[#e6c788] shadow-md' 
                    : 'bg-[#121212] text-zinc-400 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* 검색 결과 리스트 */}
        <section className="space-y-3">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-bold text-zinc-300">
              시세 검색 결과 <span className="text-[#e6c788]">{results.length}</span>건
            </h2>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              실시간 DB 연동 중
            </span>
          </div>

          {isSearching ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-zinc-500 space-y-3 bg-[#1c1c1e] border border-zinc-800 rounded-xl">
              <span className="text-3xl animate-spin">⏳</span>
              <p className="text-xs font-bold animate-pulse">시세 데이터를 불러오는 중입니다...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-zinc-500 space-y-2 bg-[#1c1c1e] border border-zinc-800 rounded-xl border-dashed">
              <span className="text-3xl">📭</span>
              <p className="text-xs font-bold">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((item) => (
                <div key={item.id} className="bg-[#1c1c1e] border border-zinc-800 hover:border-[#e6c788]/50 rounded-xl p-4 transition-all shadow-md group cursor-pointer flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#121212] border border-zinc-700 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        {item.category === '재료' ? '💎' : item.category === '장비' ? '🗡️' : '🧪'}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">{item.category}</span>
                        <h3 className="text-white font-black text-sm mt-1">{item.name}</h3>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500">{item.updatedAt} 갱신</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-bold mb-0.5">현재 최저가</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-[#e6c788]">{item.lowestPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-yellow-600 font-bold">G</span>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-zinc-800"></div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 font-bold mb-0.5">평균 거래가 (최근)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-300">{item.averagePrice.toLocaleString()}</span>
                        {item.trend === 'up' && <span className="text-rose-500 text-xs">▲</span>}
                        {item.trend === 'down' && <span className="text-blue-500 text-xs">▼</span>}
                        {item.trend === 'stable' && <span className="text-zinc-500 text-xs">-</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e6c788; }
      `}} />
    </main>
  );
}