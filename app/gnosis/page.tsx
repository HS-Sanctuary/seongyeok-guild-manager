"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_TREE = {
  "전체 지식": null,
  "클래스 지식": {
    "전사 계열": ["전사", "대검전사", "검술사", "기사"],
    "마법사 계열": ["마법사", "화염술사", "빙결술사", "전격술사"],
    "궁수 계열": ["궁수", "장궁병", "석궁사수"],
    "힐러 계열": ["힐러", "사제", "수도사", "암흑술사"],
    "음유시인 계열": ["음유시인", "댄서", "악사"],
    "도적 계열": ["도적", "격투가", "듀얼블레이드"]
  },
  "생활 지식": ["채집", "가공", "제작", "데코", "마이홈"],
  "기타 지식": null,
  "악보 지식": null
};

const JOB_ICONS: Record<string, string> = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️",
  전체지식: "", 기타지식: "", 악보지식: "" 
};

export default function GnosisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);
  
  const [openMainCategory, setOpenMainCategory] = useState<string | null>(null);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("전체 지식");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");

  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [hoveredGuideId, setHoveredGuideId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    fetchGuides();
  }, []);

  const fetchGuides = () => {
    const localData = localStorage.getItem('gnosis_mock_db');
    if (localData && JSON.parse(localData).length > 0) {
      setGuides(JSON.parse(localData));
    } else {
      const initialData = [
        { id: 2, title: "도적 신규 스킬트리 (스포일러)", content: "이 글은 스포일러 방지 테스트입니다.", sub_category: "도적", author: "탄월", title_name: "성역 길드마스터", created_at: new Date(Date.now() - 86400000).toISOString(), likes: 112, youtube_id: "dQw4w9WgXcQ", is_spoiler: true, hide_media: false }
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
    .filter(g => g.title.includes(searchTerm) || g.author.includes(searchTerm))
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

  const openDetailInNewTab = (id: number) => {
    window.open(`/gnosis/${id}`, '_blank');
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-20 pt-8 relative">
      
      {hoveredGuideId && (
        <div 
          className="fixed z-[100] pointer-events-none bg-[#1c1c1e]/95 border border-zinc-700 text-zinc-300 text-xs p-4 rounded-xl shadow-2xl w-72 backdrop-blur-md transition-opacity duration-150"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <p className="line-clamp-5 leading-relaxed whitespace-pre-wrap">
            {guides.find(g => g.id === hoveredGuideId)?.content}
          </p>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto p-4 md:p-8 space-y-6 relative">
        
        {/* 🟢 수정된 GNOSIS 헤더 배너 (문구 추가) */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-3 px-6 shadow-xl mb-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788] shadow-[0_0_15px_#e6c788]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#e6c788] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md leading-none">GNOSIS</h1>
                <span className="text-[#e6c788] text-[13px] font-bold tracking-wide mt-1.5 leading-none">그노시스 : 지식공유</span>
              </div>
            </div>
            
            {/* 🟢 설명 문구 추가 영역 */}
            <div className="bg-zinc-900/40 border border-zinc-700/50 px-4 py-2 rounded-lg w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">💡</span>
              <div className="flex flex-col text-[11px] md:text-[12px] font-bold leading-tight w-full">
                <span className="text-zinc-300 w-full">그노시스는 고대 그리스어로 ‘지식’과 ‘깨달음’을 뜻하는 말입니다.</span>
                <span className="text-[#e6c788] mt-0.5">성역의 경험과 지혜가 모여 새로운 길을 밝히는 공간입니다.</span>
              </div>
            </div>
            
            <button onClick={() => router.push('/gnosis/write')} className="bg-gradient-to-r from-yellow-600 to-[#e6c788] hover:from-yellow-500 hover:to-yellow-400 text-[#121212] font-black px-5 py-2.5 rounded-lg text-sm shadow-[0_0_20px_rgba(230,199,136,0.3)] transition transform hover:scale-105 flex items-center gap-2 flex-shrink-0">
              <span>✍️</span> 새 지식 공유하기
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1c1c1e] p-4 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold flex items-center gap-2">
              {JOB_ICONS[activeFilter.replace(" 지식", "")]} {activeFilter}
            </span>
            <span className="text-zinc-500 text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded-full">{filteredAndSortedGuides.length}개의 지식</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {Object.entries(CATEGORY_TREE).map(([mainCat, subContent]) => {
              if (subContent === null) {
                return (
                  <button key={mainCat} onClick={() => setActiveFilter(mainCat)} className={`w-full text-left px-4 py-3 font-black text-sm rounded-xl border transition flex items-center gap-2 ${activeFilter === mainCat ? 'bg-[#e6c788] text-[#121212] border-yellow-600 shadow-[0_0_10px_rgba(230,199,136,0.3)]' : 'bg-[#1c1c1e] text-zinc-300 border-zinc-800 hover:bg-[#252528]'}`}>
                    <span>{mainCat}</span>
                  </button>
                );
              }
              const isMainOpen = openMainCategory === mainCat;
              return (
                <div key={mainCat} className="bg-[#1c1c1e] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                  <button onClick={() => setOpenMainCategory(isMainOpen ? null : mainCat)} className={`w-full text-left px-4 py-3 font-black text-sm flex justify-between items-center transition ${isMainOpen ? 'bg-yellow-900/20 text-[#e6c788] border-b border-zinc-800' : 'text-zinc-300 hover:bg-[#252528]'}`}>
                    {mainCat} <span className={`text-[10px] transition-transform ${isMainOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isMainOpen && (
                    <div className="bg-[#151515] p-2 space-y-1">
                      {Array.isArray(subContent) ? (
                        subContent.map(sub => (
                          <button key={sub} onClick={() => setActiveFilter(sub)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeFilter === sub ? 'bg-[#252528] text-white border border-zinc-700' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                            {JOB_ICONS[sub.replace(" 지식", "")]} {sub}
                          </button>
                        ))
                      ) : (
                        Object.entries(subContent).map(([midCat, jobs]) => {
                          const isMidOpen = openSubCategory === midCat;
                          return (
                            <div key={midCat} className="mb-1">
                              <button onClick={() => setOpenSubCategory(isMidOpen ? null : midCat)} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 flex justify-between">
                                {midCat} <span className="text-[8px]">{isMidOpen ? '▲' : '▼'}</span>
                              </button>
                              {isMidOpen && (
                                <div className="pl-2 pr-1 py-1 grid grid-cols-2 gap-1">
                                  {jobs.map((job: string) => (
                                    <button key={job} onClick={() => setActiveFilter(job)} className={`px-2 py-1.5 rounded text-[10px] font-bold text-center transition border ${activeFilter === job ? 'bg-zinc-800 text-white border-zinc-600 shadow' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'}`}>
                                      {JOB_ICONS[job]} {job}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 content-start">
            {filteredAndSortedGuides.length === 0 ? (
               <div className="col-span-full py-24 text-center text-zinc-500 bg-[#1c1c1e] rounded-xl border border-zinc-800">
                <span className="text-5xl mb-4 opacity-50 block">📭</span>
                <p>등록된 지식이 없습니다.</p>
              </div>
            ) : (
              filteredAndSortedGuides.map(guide => (
                <div 
                  key={guide.id} 
                  onClick={() => openDetailInNewTab(guide.id)}
                  onMouseMove={(e) => handleMouseMove(e, guide)}
                  onMouseLeave={() => setHoveredGuideId(null)}
                  className="bg-[#252528] border border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
                >
                  
                  {guide.youtube_id && !guide.hide_media ? (
                    <div className="w-full aspect-video bg-black relative flex items-center justify-center">
                      {playingVideoId === guide.id ? (
                        <iframe src={`https://www.youtube.com/embed/${guide.youtube_id}?autoplay=1&mute=1`} className="w-full h-full" allowFullScreen></iframe>
                      ) : (
                        <div className="relative w-full h-full group">
                          <img src={`https://img.youtube.com/vi/${guide.youtube_id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="YouTube Thumbnail" />
                          <div onClick={(e) => { e.stopPropagation(); setPlayingVideoId(guide.id); }} className="absolute inset-0 flex items-center justify-center cursor-pointer">
                            <div className="w-12 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-white text-sm">▶</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="w-full h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-b border-zinc-800 relative">
                      {guide.hide_media && <span className="absolute top-2 left-2 text-zinc-500 text-[10px]">미디어 숨김됨</span>}
                      {guide.is_spoiler && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[10px] font-bold text-red-400 border border-red-500/50 px-2 py-1 rounded">스포일러 방지됨</span></div>}
                      {!guide.is_spoiler && <span className="text-2xl opacity-40">📝</span>}
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className={`text-[15px] font-black text-white mb-auto leading-snug line-clamp-2 hover:text-[#e6c788] transition ${guide.is_spoiler ? 'blur-[3px]' : ''}`}>{guide.title}</h3>
                    
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xs">👤</div>
                        <div className="flex flex-col">
                          {guide.title_name && <span className="text-[9px] font-black text-[#e6c788]">{guide.title_name}</span>}
                          <span className="text-xs font-bold text-zinc-300">{guide.author}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{guide.sub_category}</span>
                         <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-zinc-500 font-mono">{new Date(guide.created_at).toLocaleDateString()}</span>
                           <div className="flex items-center gap-1 text-pink-500 text-xs font-bold">
                             <span>❤️</span> {guide.likes || 0}
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