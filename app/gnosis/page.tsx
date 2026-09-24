"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ClassIcon from "@/components/common/ClassIcon";

const DEFAULT_CLASS_GROUPS = [
  { name: "전사 계열", classes: ["전사", "대검전사", "검술사", "기사"] },
  { name: "마법사 계열", classes: ["마법사", "화염술사", "빙결술사", "전격술사"] },
  { name: "궁수 계열", classes: ["궁수", "장궁병", "석궁사수"] },
  { name: "힐러 계열", classes: ["힐러", "사제", "수도사", "암흑술사"] },
  { name: "음유시인 계열", classes: ["음유시인", "댄서", "악사"] },
  { name: "도적 계열", classes: ["도적", "격투가", "듀얼블레이드"] }
];

const LIFE_KNOWLEDGE = ["채집", "가공", "제작", "데코", "마이홈"];

const EXTRA_ICONS: Record<string, string> = {
  "전체 지식": "🌐",
  "기타 지식": "📦",
  "악보 지식": "🎵",
  "채집": "🌿",
  "가공": "⚙️",
  "제작": "🔨",
  "데코": "🏡",
  "마이홈": "🏠"
};

export default function GnosisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);

  // DB 기반 동적 카테고리 상태
  const [classGroups, setClassGroups] = useState<{ name: string; classes: string[] }[]>(DEFAULT_CLASS_GROUPS);
  const [allClassNames, setAllClassNames] = useState<string[]>([]);

  const [openMainCategory, setOpenMainCategory] = useState<string | null>("클래스 지식");
  const [openSubCategory, setOpenSubCategory] = useState<string | null>("전사 계열");
  const [activeFilter, setActiveFilter] = useState<string>("전체 지식");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");

  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [hoveredGuideId, setHoveredGuideId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    fetchGuides();
    fetchDynamicClasses();
  }, []);

  const fetchDynamicClasses = async () => {
    try {
      const { data, error } = await supabase.from('nexus_classes').select('*');
      const groupMap: Record<string, string[]> = {};

      DEFAULT_CLASS_GROUPS.forEach(g => {
        groupMap[g.name] = [...g.classes];
      });

      const classSet = new Set<string>();
      DEFAULT_CLASS_GROUPS.forEach(g => g.classes.forEach(c => classSet.add(c)));

      if (data && !error) {
        data.forEach((cls: any) => {
          if (!cls.name) return;
          classSet.add(cls.name);

          const isAlreadyGrouped = Object.values(groupMap).some(list => list.includes(cls.name));
          if (!isAlreadyGrouped) {
            const groupName = cls.group_name || cls.category || "신규 계열";
            if (!groupMap[groupName]) groupMap[groupName] = [];
            groupMap[groupName].push(cls.name);
          }
        });
      }

      const updatedGroups = Object.keys(groupMap).map(gName => ({
        name: gName,
        classes: groupMap[gName]
      }));

      setClassGroups(updatedGroups);
      setAllClassNames(Array.from(classSet));
    } catch (err) {
      console.error("그노시스 직업 로딩 실패", err);
    }
  };

  const fetchGuides = () => {
    const localData = localStorage.getItem('gnosis_mock_db');
    if (localData && JSON.parse(localData).length > 0) {
      setGuides(JSON.parse(localData));
    } else {
      const initialData = [
        { 
          id: 2, 
          title: "도적 신규 스킬트리 및 딜사이클 가이드", 
          content: "도적 클래스의 핵심 딜사이클과 스킬 트리 및 장비 세팅 추천입니다.", 
          sub_category: "도적", 
          author: "한설", 
          title_name: "성역 길드마스터", 
          created_at: new Date(Date.now() - 86400000).toISOString(), 
          likes: 112, 
          youtube_id: "dQw4w9WgXcQ", 
          is_spoiler: false, 
          hide_media: false 
        }
      ];
      setGuides(initialData);
      localStorage.setItem('gnosis_mock_db', JSON.stringify(initialData));
    }
  };

  const handleMouseMove = (e: React.MouseEvent, guide: any) => {
    if (guide.is_spoiler) {
      setHoveredGuideId(null);
      return; 
    }
    setMousePos({ x: e.clientX, y: e.clientY });
    if (hoveredGuideId !== guide.id) setHoveredGuideId(guide.id);
  };

  const filteredAndSortedGuides = guides
    .filter(g => activeFilter === "전체 지식" || g.sub_category === activeFilter)
    .filter(g => g.title.includes(searchTerm) || g.author.includes(searchTerm) || (g.sub_category && g.sub_category.includes(searchTerm)))
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

  const openDetailInNewTab = (id: number) => {
    window.open(`/gnosis/${id}`, '_blank');
  };

  const renderCategoryIcon = (categoryName: string) => {
    if (allClassNames.includes(categoryName) || DEFAULT_CLASS_GROUPS.some(g => g.classes.includes(categoryName))) {
      return <ClassIcon job={categoryName} kratosClassRank={0} size="xs" />;
    }
    return <span className="text-sm leading-none">{EXTRA_ICONS[categoryName] || "📂"}</span>;
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 pt-6 relative transition-colors duration-200">
      
      {/* 마우스 호버 요약 툴팁 */}
      {hoveredGuideId && (
        <div 
          className="fixed z-[100] pointer-events-none bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] text-xs p-4 rounded-xl shadow-2xl w-72 backdrop-blur-md transition-opacity duration-150"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <p className="line-clamp-5 leading-relaxed whitespace-pre-wrap text-[var(--text-main)] font-medium">
            {guides.find(g => g.id === hoveredGuideId)?.content}
          </p>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto p-3 sm:p-6 space-y-4 relative">
        
        {/* GNOSIS 헤더 배너 (전역 테마 적용) */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-4 px-5 sm:px-6 shadow-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-[var(--text-main)] tracking-widest leading-none flex items-center gap-2">
                  <span></span> GNOSIS
                </h1>
                <span className="text-[var(--accent)] text-[12px] sm:text-[13px] font-extrabold tracking-wide mt-1.5 leading-none">
                　그노시스 : 지식 공유 · 개발 중
                </span>
              </div>
            </div>
            
            {/* 배너 정보 문구 */}
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-4 py-2 rounded-xl w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">💡</span>
              <div className="flex flex-col text-[11px] sm:text-[12px] font-bold leading-tight w-full">
                <span className="text-[var(--text-main)]">그노시스는 고대 그리스어로 ‘지식’과 ‘깨달음’을 뜻하는 말입니다.</span>
                <span className="text-[var(--text-sub)] mt-0.5">현재 개발 중인 공간입니다. 일부 게시물과 기능은 예시로 표시되며, 정식 공략 자료가 아닙니다.</span>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/gnosis/write')} 
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition transform hover:scale-[1.02] flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>✍️</span> 새 지식 공유하기
            </button>
          </div>
        </header>

        {/* 상단 통합 검색바 & 카테고리 상태 바 */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--panel-border)] shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] shrink-0">
              {renderCategoryIcon(activeFilter)}
              <span className="text-xs sm:text-sm font-black text-[var(--text-main)] truncate">{activeFilter}</span>
            </div>
            <span className="text-[11px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full shrink-0 border border-[var(--accent)]/20">
              {filteredAndSortedGuides.length}개의 지식
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제목, 작성자, 직업 검색..."
                className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl py-1.5 pl-8 pr-7 text-xs font-bold text-[var(--text-main)] placeholder-[var(--text-sub)] outline-none transition"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-50">🔍</span>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)]">✕</button>
              )}
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="oldest">등록순</option>
            </select>
          </div>
        </div>

        {/* 메인 콘텐츠 영역: 좌측 동적 카테고리 트레일 사이드바 / 우측 카드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* 1. 사이드바 - DB 기반 동적 계층 카테고리 트리 */}
          <div className="lg:col-span-1 space-y-2">
            
            {/* 전체 지식 버튼 */}
            <button 
              onClick={() => setActiveFilter("전체 지식")} 
              className={`w-full text-left px-3.5 py-2.5 font-black text-xs sm:text-sm rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                activeFilter === "전체 지식" 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-md font-black' 
                  : 'bg-[var(--panel)] text-[var(--text-main)] border-[var(--panel-border)] hover:bg-[var(--inner-box)]'
              }`}
            >
              <span>🌐</span>
              <span>전체 지식</span>
            </button>

            {/* ⚔️ 클래스 지식 (DB 동적 계열/직업 아코디언) */}
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => setOpenMainCategory(openMainCategory === "클래스 지식" ? null : "클래스 지식")} 
                className={`w-full text-left px-3.5 py-2.5 font-black text-xs sm:text-sm flex justify-between items-center transition cursor-pointer ${
                  openMainCategory === "클래스 지식" ? 'bg-[var(--inner-box)] text-[var(--accent)] border-b border-[var(--panel-border)]' : 'text-[var(--text-main)] hover:bg-[var(--inner-box)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>⚔️</span> 클래스 지식
                </span>
                <span className={`text-[10px] transition-transform ${openMainCategory === "클래스 지식" ? 'rotate-180 text-[var(--accent)]' : ''}`}>▼</span>
              </button>

              {openMainCategory === "클래스 지식" && (
                <div className="bg-[var(--inner-box)]/60 p-2 space-y-1.5 border-b border-[var(--panel-border)]">
                  {classGroups.map((group) => {
                    const isMidOpen = openSubCategory === group.name;
                    return (
                      <div key={group.name} className="rounded-lg overflow-hidden border border-[var(--panel-border)]/50 bg-[var(--panel)]">
                        <button 
                          onClick={() => setOpenSubCategory(isMidOpen ? null : group.name)} 
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-black text-[var(--text-sub)] hover:text-[var(--text-main)] flex justify-between items-center transition"
                        >
                          <span>{group.name}</span>
                          <span className="text-[9px]">{isMidOpen ? '▲' : '▼'}</span>
                        </button>
                        {isMidOpen && (
                          <div className="p-1.5 grid grid-cols-2 gap-1 bg-[var(--inner-box)] border-t border-[var(--panel-border)]/30">
                            {group.classes.map((cls) => (
                              <button 
                                key={cls} 
                                onClick={() => setActiveFilter(cls)} 
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-black text-center transition border flex items-center justify-center gap-1 cursor-pointer truncate ${
                                  activeFilter === cls 
                                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs' 
                                    : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                                }`}
                              >
                                <ClassIcon job={cls} kratosClassRank={0} size="xs" />
                                <span className="truncate">{cls}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🌿 생활 지식 */}
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => setOpenMainCategory(openMainCategory === "생활 지식" ? null : "생활 지식")} 
                className={`w-full text-left px-3.5 py-2.5 font-black text-xs sm:text-sm flex justify-between items-center transition cursor-pointer ${
                  openMainCategory === "생활 지식" ? 'bg-[var(--inner-box)] text-[var(--accent)] border-b border-[var(--panel-border)]' : 'text-[var(--text-main)] hover:bg-[var(--inner-box)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🌿</span> 생활 지식
                </span>
                <span className={`text-[10px] transition-transform ${openMainCategory === "생활 지식" ? 'rotate-180 text-[var(--accent)]' : ''}`}>▼</span>
              </button>

              {openMainCategory === "생활 지식" && (
                <div className="bg-[var(--inner-box)] p-2 grid grid-cols-2 gap-1">
                  {LIFE_KNOWLEDGE.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilter(item)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition border flex items-center justify-center gap-1 cursor-pointer ${
                        activeFilter === item
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs'
                          : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span>{EXTRA_ICONS[item]}</span>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 기타 및 악보 지식 단독 버튼 */}
            {["기타 지식", "악보 지식"].map((board) => (
              <button 
                key={board} 
                onClick={() => setActiveFilter(board)} 
                className={`w-full text-left px-3.5 py-2.5 font-black text-xs sm:text-sm rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                  activeFilter === board 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-md font-black' 
                    : 'bg-[var(--panel)] text-[var(--text-main)] border-[var(--panel-border)] hover:bg-[var(--inner-box)]'
                }`}
              >
                <span>{EXTRA_ICONS[board]}</span>
                <span>{board}</span>
              </button>
            ))}

          </div>

          {/* 2. 우측 - 공략 글 카드 그리드 */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {filteredAndSortedGuides.length === 0 ? (
              <div className="col-span-full py-20 text-center text-[var(--text-sub)] bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] space-y-2">
                <span className="text-4xl opacity-50 block">📭</span>
                <p className="text-xs font-bold">등록된 공략이나 지식이 없습니다.</p>
                <p className="text-[11px] opacity-70">첫 번째 지식의 주인공이 되어보세요!</p>
              </div>
            ) : (
              filteredAndSortedGuides.map(guide => (
                <div 
                  key={guide.id} 
                  onClick={() => openDetailInNewTab(guide.id)}
                  onMouseMove={(e) => handleMouseMove(e, guide)}
                  onMouseLeave={() => setHoveredGuideId(null)}
                  className="bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                >
                  
                  {/* 유튜브 미디어 영역 */}
                  {guide.youtube_id && !guide.hide_media ? (
                    <div className="w-full aspect-video bg-black relative flex items-center justify-center">
                      {playingVideoId === guide.id ? (
                        <iframe src={`https://www.youtube.com/embed/${guide.youtube_id}?autoplay=1&mute=1`} className="w-full h-full" allowFullScreen></iframe>
                      ) : (
                        <div className="relative w-full h-full">
                          <img src={`https://img.youtube.com/vi/${guide.youtube_id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="YouTube Thumbnail" />
                          <div onClick={(e) => { e.stopPropagation(); setPlayingVideoId(guide.id); }} className="absolute inset-0 flex items-center justify-center cursor-pointer">
                            <div className="w-12 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-white text-xs">▶</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-16 bg-[var(--inner-box)] flex items-center justify-center border-b border-[var(--panel-border)] relative">
                      {guide.hide_media && <span className="absolute top-2 left-2 text-[var(--text-sub)] text-[9px]">미디어 숨김</span>}
                      {guide.is_spoiler && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-[10px] font-bold text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded">스포일러 방지</span>
                        </div>
                      )}
                      {!guide.is_spoiler && <span className="text-xl opacity-30">📝</span>}
                    </div>
                  )}

                  {/* 카드 바디 */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <h3 className={`text-sm font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition mb-auto leading-snug line-clamp-2 ${guide.is_spoiler ? 'blur-[3px]' : ''}`}>
                      {guide.title}
                    </h3>
                    
                    <div className="mt-3 pt-2.5 border-t border-[var(--panel-border)] flex justify-between items-end">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] flex items-center justify-center text-xs shrink-0">
                          👤
                        </div>
                        <div className="flex flex-col min-w-0">
                          {guide.title_name && <span className="text-[9px] font-black text-[var(--accent)] truncate">{guide.title_name}</span>}
                          <span className="text-xs font-bold text-[var(--text-main)] truncate">{guide.author}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-black text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md border border-[var(--accent)]/20 flex items-center gap-1">
                          {renderCategoryIcon(guide.sub_category)}
                          <span>{guide.sub_category}</span>
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[var(--text-sub)]">{new Date(guide.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-0.5 text-rose-500 text-xs font-bold">
                            <span>❤️</span>
                            <span className="text-[10px]">{guide.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
