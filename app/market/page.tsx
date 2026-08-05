"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// --- [타입 정의] ---
interface CatalogItem {
  id: string;
  name: string;
  category: string;
}

interface MarketResult {
  id: string;
  name: string;
  category: string;
  lowestPrice: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
  updatedAt: string;
}

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
  
  // 데이터 상태
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [results, setResults] = useState<MarketResult[]>([]);
  
  // 검색 및 UI 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isSearching, setIsSearching] = useState(false);
  
  // 자동완성 상태
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { 
      router.push("/login"); 
    } else { 
      setUser(JSON.parse(savedUser)); 
      loadCatalogData();
    }
  }, [router]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. 카탈로그 데이터 로드 (public/items_catalog.json 기준)
  const loadCatalogData = async () => {
    try {
      const res = await fetch('/items_catalog.json');
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      } else {
        throw new Error("File not found");
      }
    } catch (error) {
      // JSON 파일이 없을 경우를 대비한 마비노기 모바일 임시 기초 DB
      setCatalog([
        { id: 'm1', name: '철광석', category: '재료' },
        { id: 'm2', name: '가죽', category: '재료' },
        { id: 'm3', name: '생명력 포션(소)', category: '소모품' },
        { id: 'm4', name: '마나 포션(소)', category: '소모품' },
        { id: 'm5', name: '나무 장작', category: '재료' },
        { id: 'm6', name: '초보자용 롱소드', category: '장비' },
        { id: 'm7', name: '마법 가루', category: '재료' },
      ]);
    }
  };

  // 2. 검색어 입력 및 자동완성 필터링
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.trim().length > 0) {
      // 검색어가 포함된 아이템 최대 5개 추출
      const filtered = catalog.filter(item => item.name.includes(val)).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 3. 자동완성 목록에서 아이템 클릭 시
  const handleSuggestionClick = (itemName: string) => {
    setSearchQuery(itemName);
    setShowSuggestions(false);
    executeSearch(itemName, activeCategory);
  };

  // 4. 실제 거래소 시세 검색 실행 (API 연동 전 시뮬레이션)
  const executeSearch = (query: string, category: string) => {
    setIsSearching(true);
    setShowSuggestions(false);

    setTimeout(() => {
      // 카탈로그 기반으로 검색된 아이템 목록 추출
      let filteredCatalog = catalog;
      if (query.trim()) {
        filteredCatalog = filteredCatalog.filter(item => item.name.includes(query));
      }
      if (category !== "전체") {
        filteredCatalog = filteredCatalog.filter(item => item.category === category);
      }

      // 모비라이프 시세 API가 연결될 자리 (임시로 랜덤 시세 부여)
      const simulatedResults: MarketResult[] = filteredCatalog.map(item => {
        const basePrice = Math.floor(Math.random() * 50000) + 1000;
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          lowestPrice: basePrice,
          averagePrice: basePrice + Math.floor(Math.random() * 2000),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          updatedAt: '방금 전'
        };
      });

      setResults(simulatedResults);
      setIsSearching(false);
    }, 500); // 0.5초 로딩 연출
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, activeCategory);
  };

  // 카테고리 탭 변경 시 자동 검색
  useEffect(() => {
    if (mounted && catalog.length > 0) {
      executeSearch(searchQuery, activeCategory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, catalog]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      
      {/* 🟢 상단 네비게이션은 layout.tsx에서 처리하므로 삭제 (깔끔한 UI) */}

      <div className="p-4 md:p-8 max-w-[1000px] mx-auto space-y-6 pt-8">
        
        {/* 상단 타이틀 영역 */}
        <header className="flex flex-col items-center justify-center py-6">
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md flex items-center gap-2">
            ⚖️ 성역 <span className="text-[#e6c788]">통합 거래소</span>
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm mt-2 font-bold">데이안 서버의 실시간 경매장 시세와 변동 추이를 확인하세요.</p>
        </header>

        {/* 검색 및 카테고리 필터 영역 */}
        <section className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-5 md:p-7 shadow-xl space-y-5">
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {["전체", "장비", "소모품", "재료", "기타"].map((category) => (
              <button 
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  activeCategory === category 
                    ? 'bg-[#e6c788] text-black border-[#e6c788] shadow-[0_0_15px_rgba(230,199,136,0.3)]' 
                    : 'bg-[#121212] text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full" ref={searchWrapperRef}>
            <input 
              type="text" 
              placeholder="아이템 이름을 입력하세요... (예: 철광석)" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }}
              className="w-full bg-[#121212] border-2 border-zinc-700 hover:border-zinc-500 focus:border-[#e6c788] text-white text-sm p-4 pl-12 rounded-xl focus:outline-none transition-all shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-6 py-2 rounded-lg transition-colors shadow-md"
            >
              검색
            </button>

            {/* 🟢 자동완성 (Auto-complete) 드롭다운 창 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#252528] border border-zinc-600 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {suggestions.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleSuggestionClick(item.name)}
                    className={`p-3 text-sm cursor-pointer hover:bg-[#121212] flex items-center gap-3 transition-colors ${idx !== suggestions.length - 1 ? 'border-b border-zinc-700/50' : ''}`}
                  >
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">{item.category}</span>
                    <span className="text-white font-bold">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </section>

        {/* 검색 결과 리스트 */}
        <section className="space-y-3 pt-2">
          <div className="flex justify-between items-end mb-3 px-1">
            <h2 className="text-sm font-bold text-zinc-300">
              시세 검색 결과 <span className="text-[#e6c788]">{results.length}</span>건
            </h2>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              데이안 서버 DB 연동
            </span>
          </div>

          {isSearching ? (
            <div className="w-full py-24 flex flex-col items-center justify-center text-zinc-500 space-y-3 bg-[#1c1c1e] border border-zinc-800 rounded-2xl shadow-lg">
              <span className="text-4xl animate-spin">⏳</span>
              <p className="text-xs font-bold animate-pulse text-[#e6c788]">거래소 시세 데이터를 동기화 중입니다...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="w-full py-24 flex flex-col items-center justify-center text-zinc-500 space-y-2 bg-[#1c1c1e] border border-zinc-800 rounded-2xl shadow-lg border-dashed">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm font-bold text-zinc-400">검색 결과가 존재하지 않습니다.</p>
              <p className="text-[10px]">아이템 이름을 다시 확인해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => (
                <div key={item.id} className="bg-[#1c1c1e] border border-zinc-800 hover:border-[#e6c788]/60 rounded-xl p-5 transition-all shadow-lg group cursor-pointer flex flex-col justify-between">
                  
                  <div className="flex justify-between items-start mb-4 border-b border-zinc-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#121212] border border-zinc-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                        {item.category === '재료' ? '💎' : item.category === '장비' ? '🗡️' : item.category === '소모품' ? '🧪' : '📦'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 w-fit mb-1">{item.category}</span>
                        <h3 className="text-white font-black text-base tracking-tight">{item.name}</h3>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-[#121212] px-2 py-1 rounded-md border border-zinc-800">{item.updatedAt} 갱신</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#121212] p-3 rounded-xl border border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-bold mb-1">현재 최저가</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-[#e6c788]">{item.lowestPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-yellow-600 font-black">G</span>
                      </div>
                    </div>

                    <div className="w-px h-10 bg-zinc-700/50"></div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 font-bold mb-1">최근 평균 거래가</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-zinc-300">{item.averagePrice.toLocaleString()}</span>
                        {item.trend === 'up' && <span className="text-rose-500 text-xs font-black animate-pulse">▲</span>}
                        {item.trend === 'down' && <span className="text-blue-500 text-xs font-black">▼</span>}
                        {item.trend === 'stable' && <span className="text-zinc-500 text-xs font-black">-</span>}
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