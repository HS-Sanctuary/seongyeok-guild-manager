"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  // 🟢 HTMLFormElement 타입으로 정밀 교정하여 TS2322 에러 완벽 해결
  const searchWrapperRef = useRef<HTMLFormElement>(null);

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

  // 4. 실제 거래소 시세 검색 실행
  const executeSearch = (query: string, category: string) => {
    setIsSearching(true);
    setShowSuggestions(false);

    setTimeout(() => {
      let filteredCatalog = catalog;
      if (query.trim()) {
        filteredCatalog = filteredCatalog.filter(item => item.name.includes(query));
      }
      if (category !== "전체") {
        filteredCatalog = filteredCatalog.filter(item => item.category === category);
      }

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
    }, 500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, activeCategory);
  };

  useEffect(() => {
    if (mounted && catalog.length > 0) {
      executeSearch(searchQuery, activeCategory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, catalog]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 pt-6 relative transition-colors duration-200">
      <div className="max-w-[1300px] mx-auto p-3 sm:p-6 space-y-4 relative">
        
        {/* 🟢 EMPORION 헤더 배너 (전역 테마 적용) */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-4 px-5 sm:px-6 shadow-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-[var(--text-main)] tracking-widest leading-none flex items-center gap-2">
                  <span>🏛️</span> EMPORION
                </h1>
                <span className="text-[var(--accent)] text-[12px] sm:text-[13px] font-extrabold tracking-wide mt-1.5 leading-none">
                  엠포리온 : 거래소 정보 · 개발 중
                </span>
              </div>
            </div>
            
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-4 py-2 rounded-xl w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">💡</span>
              <div className="flex flex-col text-[11px] sm:text-[12px] font-bold leading-tight w-full">
                <span className="text-[var(--text-main)] w-full">엠포리온은 고대 그리스어로 ‘무역과 상업이 이루어지는 시장’을 뜻합니다.</span>
                <span className="text-[var(--text-sub)] mt-0.5">현재 개발 중인 화면입니다. 표시된 가격은 시험용 예시이며 실시간 거래 가격이 아닙니다.</span>
              </div>
            </div>
          </div>
        </header>

        {/* 검색 및 카테고리 필터 영역 */}
        <section className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {["전체", "장비", "소모품", "재료", "기타"].map((category) => (
              <button 
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border cursor-pointer ${
                  activeCategory === category 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-md' 
                    : 'bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 🟢 searchWrapperRef(HTMLFormElement)가 정상 호환되는 form 태그 */}
          <form onSubmit={handleSearchSubmit} className="relative w-full" ref={searchWrapperRef}>
            <input 
              type="text" 
              placeholder="아이템 이름을 입력하세요... (예: 철광석)" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }}
              className="w-full bg-[var(--inner-box)] border-2 border-[var(--panel-border)] focus:border-[var(--accent)] text-[var(--text-main)] text-xs sm:text-sm py-3 pl-10 pr-24 rounded-xl focus:outline-none transition-all shadow-xs font-bold placeholder:[var(--text-sub)]"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-60">🔍</span>
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black px-4 py-1.5 rounded-lg text-xs transition-colors shadow-md cursor-pointer"
            >
              검색
            </button>

            {/* 자동완성 드롭다운 창 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 divide-y divide-[var(--panel-border)]">
                {suggestions.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleSuggestionClick(item.name)}
                    className="p-3 text-xs cursor-pointer hover:bg-[var(--inner-box)] flex items-center gap-2.5 transition-colors"
                  >
                    <span className="text-[10px] font-black bg-[var(--inner-box)] text-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
                      {item.category}
                    </span>
                    <span className="text-[var(--text-main)] font-bold truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </section>

        {/* 검색 결과 리스트 */}
        <section className="space-y-3 pt-1">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-xs sm:text-sm font-black text-[var(--text-main)]">
              시세 검색 결과 <span className="text-[var(--accent)]">{results.length}</span>건
            </h2>
            <span className="text-[10px] text-[var(--text-sub)] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              데이안 서버 DB 연동
            </span>
          </div>

          {isSearching ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-[var(--text-sub)] space-y-2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-lg">
              <span className="text-3xl animate-spin">⏳</span>
              <p className="text-xs font-black animate-pulse text-[var(--accent)]">거래소 시세 데이터를 동기화 중입니다...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-[var(--text-sub)] space-y-1.5 bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-lg border-dashed">
              <span className="text-3xl mb-1 opacity-60">📭</span>
              <p className="text-xs font-black text-[var(--text-main)]">검색 결과가 존재하지 않습니다.</p>
              <p className="text-[10px]">아이템 이름을 다시 확인해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {results.map((item) => (
                <div key={item.id} className="bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-2xl p-4 transition-all shadow-md group cursor-pointer flex flex-col justify-between">
                  
                  <div className="flex justify-between items-start mb-3 border-b border-[var(--panel-border)] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] flex items-center justify-center text-xl group-hover:scale-105 transition-transform shrink-0">
                        {item.category === '재료' ? '💎' : item.category === '장비' ? '🗡️' : item.category === '소모품' ? '🧪' : '📦'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black bg-[var(--inner-box)] text-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] w-fit mb-0.5">
                          {item.category}
                        </span>
                        <h3 className="text-[var(--text-main)] font-black text-sm tracking-tight truncate">{item.name}</h3>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--text-sub)] bg-[var(--inner-box)] px-2 py-0.5 rounded-md border border-[var(--panel-border)] shrink-0">
                      {item.updatedAt} 갱신
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)]/60">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--text-sub)] font-bold mb-0.5">현재 최저가</span>
                      <div className="flex items-center gap-1">
                        <span className="text-base sm:text-lg font-black text-[var(--accent)]">{item.lowestPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-[var(--accent)] font-black">G</span>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-[var(--panel-border)]"></div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-[var(--text-sub)] font-bold mb-0.5">최근 평균 거래가</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-[var(--text-main)]">{item.averagePrice.toLocaleString()}</span>
                        {item.trend === 'up' && <span className="text-rose-500 text-xs font-black animate-pulse">▲</span>}
                        {item.trend === 'down' && <span className="text-sky-500 text-xs font-black">▼</span>}
                        {item.trend === 'stable' && <span className="text-[var(--text-sub)] text-xs font-black">-</span>}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
