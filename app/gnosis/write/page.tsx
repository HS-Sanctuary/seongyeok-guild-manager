"use client";

import { useState, useRef, useEffect } from "react";
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

export default function GnosisWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("전사"); 
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // DB 기반 동적 클래스 그룹
  const [classGroups, setClassGroups] = useState<{ name: string; classes: string[] }[]>(DEFAULT_CLASS_GROUPS);
  const [allClassNames, setAllClassNames] = useState<string[]>([]);
  
  const [useYoutube, setUseYoutube] = useState(false);
  const [useFashion, setUseFashion] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  
  // 패션 시뮬레이터(AI) 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [itemData, setItemData] = useState<any>(null);

  const [hideMedia, setHideMedia] = useState(false);
  const [useSpoiler, setUseSpoiler] = useState(false);

  useEffect(() => {
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
      console.error("작성 에디터 클래스 로딩 실패", err);
    }
  };

  // 외부 클릭 시 카테고리 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCategoryPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 유튜브 URL에서 ID 추출
  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 패션 시뮬레이터 AI 붙여넣기
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result;
          try {
            const res = await fetch('/api/analyze-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64 })
            });
            if (!res.ok) throw new Error("AI 서버 응답 없음");
            const data = await res.json();
            if (data && data.itemName) {
              setItemData(data);
              if(!title) setTitle(data.itemName);
            }
          } catch (err) {
            const mockFashionData = {
              itemName: "마린 웨이브 유니폼 (시뮬레이션)",
              rarity: "에픽",
              dyeParts: ["#2E2725", "#3D4144", "#F2F2E8", "#D65B42"]
            };
            setItemData(mockFashionData);
            if(!title) setTitle(mockFashionData.itemName);
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return alert("제목을 입력해주세요!");
    if (!content.trim()) return alert("내용을 입력해주세요!");
    
    const newGuide = {
      id: Date.now(),
      title,
      content,
      sub_category: category,
      author: "한설",
      title_name: "성역 길드마스터",
      created_at: new Date().toISOString(),
      likes: 0,
      youtube_id: useYoutube ? extractYouTubeId(youtubeLink) : null,
      item_data: itemData,
      is_spoiler: useSpoiler,
      hide_media: hideMedia
    };

    const existingGuides = JSON.parse(localStorage.getItem('gnosis_mock_db') || '[]');
    localStorage.setItem('gnosis_mock_db', JSON.stringify([newGuide, ...existingGuides]));
    
    alert("지식이 성공적으로 기록되었습니다!");
    router.push('/gnosis'); 
  };

  const renderCategoryIcon = (catName: string) => {
    if (allClassNames.includes(catName) || DEFAULT_CLASS_GROUPS.some(g => g.classes.includes(catName))) {
      return <ClassIcon job={catName} kratosClassRank={0} size="sm" />;
    }
    return <span>{EXTRA_ICONS[catName] || "📂"}</span>;
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 pt-6 transition-colors duration-200">
      <div className="max-w-[1000px] mx-auto p-4 sm:p-6 space-y-4">
        
        {/* 헤더 배너 */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-4 px-6 shadow-xl mb-2">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <span>✍️</span> 새 지식 기록하기
          </h1>
          <div className="text-[12px] font-bold text-[var(--text-sub)] mt-1.5 space-y-0.5">
            <p>고대 그리스어로 ‘지식’과 ‘깨달음’을 뜻하는 말입니다.</p>
            <p className="text-[var(--accent)] font-black">성역의 경험과 지혜가 모여 새로운 길을 밝히는 공간입니다.</p>
          </div>
        </header>

        {/* 에디터 메인 폼 박스 */}
        <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] overflow-hidden shadow-2xl">
          <div className="bg-[var(--inner-box)] flex flex-col border-b border-[var(--panel-border)]">
            
            {/* 독립 카테고리 피커 드롭다운 팝업 */}
            <div ref={pickerRef} className="relative border-b border-[var(--panel-border)]">
              <button 
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="w-full text-left bg-[var(--panel)] text-[var(--text-main)] text-xs sm:text-sm font-black px-4 py-3.5 focus:outline-none flex justify-between items-center hover:bg-[var(--inner-box)] transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {renderCategoryIcon(category)}
                  <span>카테고리: [{category}]</span>
                </span>
                <span className={`text-xs transition-transform ${showCategoryPicker ? 'rotate-180 text-[var(--accent)]' : ''}`}>▼</span>
              </button>
              
              {showCategoryPicker && (
                <div className="absolute top-full left-0 w-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-2xl z-50 p-4 max-h-[420px] overflow-y-auto custom-scrollbar space-y-4 rounded-b-2xl">
                  
                  {/* 1. 독립 게시판 카테고리 */}
                  <div className="grid grid-cols-3 gap-2 pb-3 border-b border-[var(--panel-border)]">
                    {["전체 지식", "기타 지식", "악보 지식"].map((board) => (
                      <button
                        key={board}
                        type="button"
                        onClick={() => { setCategory(board); setShowCategoryPicker(false); }}
                        className={`text-xs font-black p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          category === board 
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-md' 
                            : 'bg-[var(--inner-box)] text-[var(--text-main)] border-[var(--panel-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <span>{EXTRA_ICONS[board]}</span>
                        <span>{board}</span>
                      </button>
                    ))}
                  </div>

                  {/* 2. 클래스 지식 계열별 분류 (DB 동적 연동) */}
                  <div className="space-y-3 bg-[var(--inner-box)] p-3.5 rounded-xl border border-[var(--panel-border)]">
                    <h4 className="text-xs font-black text-[var(--accent)] uppercase tracking-wider border-b border-[var(--panel-border)] pb-1.5 flex items-center gap-1.5">
                      <span>⚔️</span> 클래스 지식 (DB 연동)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {classGroups.map(({ name: groupName, classes }) => (
                        <div key={groupName} className="space-y-1">
                          <p className="text-[11px] text-[var(--text-sub)] font-bold">{groupName}</p>
                          <div className="flex flex-wrap gap-1">
                            {classes.map(job => (
                              <button 
                                key={job} 
                                type="button"
                                onClick={() => { setCategory(job); setShowCategoryPicker(false); }} 
                                className={`text-[11px] font-black px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border ${
                                  category === job 
                                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-md' 
                                    : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                                }`}
                              >
                                <ClassIcon job={job} kratosClassRank={0} size="xs" />
                                <span>{job}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. 생활 지식 분류 */}
                  <div className="space-y-2 bg-[var(--inner-box)] p-3.5 rounded-xl border border-[var(--panel-border)]">
                    <h4 className="text-xs font-black text-[var(--accent)] uppercase tracking-wider border-b border-[var(--panel-border)] pb-1.5 flex items-center gap-1.5">
                      <span>🌿</span> 생활 지식
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {LIFE_KNOWLEDGE.map(item => (
                        <button 
                          key={item} 
                          type="button"
                          onClick={() => { setCategory(item); setShowCategoryPicker(false); }} 
                          className={`text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                            category === item 
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-md' 
                              : 'bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <span>{EXTRA_ICONS[item]}</span>
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            {/* 제목 입력란 */}
            <input 
              type="text" 
              placeholder="제목을 입력해 주세요..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="bg-[var(--panel)] text-[var(--text-main)] font-black text-sm px-4 py-3 border-b border-[var(--panel-border)] focus:outline-none placeholder:[var(--text-sub)]/60" 
            />

            {/* 툴바 서식 바 */}
            <div className="flex items-center gap-4 px-4 py-2 bg-[var(--inner-box)] text-[var(--text-sub)] text-xs overflow-x-auto custom-scrollbar">
              <div className="flex gap-3 font-serif font-black">
                <button type="button" className="hover:text-[var(--accent)]">B</button>
                <button type="button" className="hover:text-[var(--accent)] italic">i</button>
                <button type="button" className="hover:text-[var(--accent)] underline">U</button>
                <button type="button" className="hover:text-[var(--accent)] line-through">S</button>
              </div>
              <div className="w-px h-3.5 bg-[var(--panel-border)]"></div>
              <div className="flex gap-3 text-sm">
                <button type="button" className="hover:text-[var(--accent)]">🙂</button>
              </div>
            </div>
          </div>

          {/* 옵션 체크박스 바 */}
          <div className="bg-[var(--panel)] p-3.5 flex flex-wrap gap-4 border-b border-[var(--panel-border)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useYoutube} onChange={(e) => setUseYoutube(e.target.checked)} className="accent-red-500 w-4 h-4" />
              <span className="text-xs font-black text-[var(--text-main)]">유튜브 링크 추가</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useFashion} onChange={(e) => setUseFashion(e.target.checked)} className="accent-[var(--accent)] w-4 h-4" />
              <span className="text-xs font-black text-[var(--text-main)]">패션 시뮬레이터 적용</span>
              <span className="text-[10px] text-[var(--text-sub)] hidden sm:inline">(스크린샷을 붙여넣으면 색상이 자동 스캔됩니다)</span>
            </label>
          </div>

          {/* 유튜브 링크 입력창 */}
          {useYoutube && (
            <div className="px-4 py-3 bg-[var(--inner-box)] border-b border-[var(--panel-border)] flex gap-2 items-center">
              <span className="text-red-500 font-bold">▶</span>
              <input 
                type="text" 
                placeholder="유튜브 링크 URL을 입력하세요 (예: https://www.youtube.com/watch?v=...)" 
                value={youtubeLink} 
                onChange={e => setYoutubeLink(e.target.value)} 
                className="bg-transparent w-full text-xs font-bold text-[var(--text-main)] outline-none placeholder:[var(--text-sub)]/60" 
              />
            </div>
          )}

          {/* 패션 시뮬레이터 영역 */}
          {useFashion && (
            <div 
              onPaste={handlePaste} 
              className={`m-4 border-2 border-dashed rounded-xl p-5 text-center transition ${
                isAnalyzing 
                  ? 'border-purple-500 bg-purple-900/10' 
                  : itemData 
                  ? 'border-emerald-500 bg-emerald-900/10' 
                  : 'border-[var(--panel-border)] hover:border-[var(--accent)] bg-[var(--inner-box)]'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center animate-pulse">
                  <span className="text-2xl mb-1">🤖</span>
                  <p className="text-xs font-black text-purple-400">AI가 이미지를 스캔하고 분석하는 중입니다...</p>
                </div>
              ) : itemData ? (
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">✅</span>
                  <p className="text-xs font-black text-emerald-400">아이템 정보 추출 완료!</p>
                  <p className="text-[10px] text-[var(--text-sub)] mt-0.5">[{itemData.rarity}] {itemData.itemName} / 염색 {itemData.dyeParts?.length || 0}파트</p>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-80">
                  <span className="text-2xl mb-1">📸</span>
                  <p className="text-xs font-black text-[var(--text-main)] mb-0.5">여기를 클릭한 후 인게임 스크린샷 붙여넣기 (Ctrl+V)</p>
                  <p className="text-[10px] text-[var(--text-sub)]">이미지는 저장되지 않으며 AI가 염색 파트 정보만 자동 스캔합니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 본문 에디터 텍스트 영역 */}
          <div className="relative border-b border-[var(--panel-border)]">
            {!content && (
              <div className="absolute top-4 left-4 right-4 pointer-events-none space-y-1 text-[11px] sm:text-xs text-[var(--text-sub)] font-medium leading-relaxed">
                <p>- 공략 및 공유용 텍스트 및 정보를 자유롭게 작성해 주세요.</p>
                <p>- 잘못된 정보나 문제가 될 만한 내용을 다루는 게시물은 금지됩니다.</p>
                <p>- 신규 직업 및 가이드는 성역 길드원 전체에게 큰 도움이 됩니다.</p>
              </div>
            )}
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-80 bg-transparent text-[var(--text-main)] p-4 text-xs sm:text-sm font-medium focus:outline-none resize-none relative z-10 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* 추가 보안 옵션 */}
          <div className="bg-[var(--inner-box)] divide-y divide-[var(--panel-border)]">
            <label className="flex items-center gap-2 p-3 cursor-pointer group">
              <input type="checkbox" checked={hideMedia} onChange={e => setHideMedia(e.target.checked)} className="accent-[var(--accent)] w-4 h-4" />
              <span className="text-xs text-[var(--text-sub)] group-hover:text-[var(--text-main)] font-bold">미디어 미리보기를 숨기시겠습니까?</span>
            </label>
            <label className="flex items-center gap-2 p-3 cursor-pointer group">
              <input type="checkbox" checked={useSpoiler} onChange={e => setUseSpoiler(e.target.checked)} className="accent-[var(--accent)] w-4 h-4" />
              <span className="text-xs text-[var(--text-sub)] group-hover:text-[var(--text-main)] font-bold">스포일러 방지 적용</span>
            </label>
          </div>
        </div>

        {/* 하단 버튼 그룹 */}
        <div className="flex justify-between items-center mt-4">
          <button type="button" className="text-xs font-bold text-[var(--text-sub)] bg-[var(--panel)] border border-[var(--panel-border)] px-4 py-2.5 rounded-xl">
            임시 저장 (로컬)
          </button>
          
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="text-xs sm:text-sm font-black text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent)]/90 px-6 py-2.5 rounded-xl transition shadow-md cursor-pointer"
          >
            작성 완료 ✨
          </button>
        </div>

      </div>
    </main>
  );
}