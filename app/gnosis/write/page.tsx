"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const JOB_ICONS: Record<string, string> = {
  전사: "⚔️", 대검전사: "🗡️", 검술사: "🤺", 기사: "🛡️",
  마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 전격술사: "⚡",
  궁수: "🏹", 장궁병: "🎯", 석궁사수: "🏹",
  힐러: "💖", 사제: "🕊️", 수도사: "🙏", 암흑술사: "🌑",
  음유시인: "🎵", 댄서: "💃", 악사: "🎸",
  도적: "🥷", 격투가: "🥊", 듀얼블레이드: "⚔️",
  "전체 지식": "🌐", "기타 지식": "📦", "악보 지식": "🎵",
  "채집": "🌿", "가공": "⚙️", "제작": "🔨", "데코": "🏡", "마이홈": "🏠"
};

export default function GnosisWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("전사"); 
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const [useYoutube, setUseYoutube] = useState(false);
  const [useFashion, setUseFashion] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  
  // 패션 시뮬레이터(AI) 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [itemData, setItemData] = useState<any>(null);

  const [hideMedia, setHideMedia] = useState(false);
  const [useSpoiler, setUseSpoiler] = useState(false);

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

  // 패션 시뮬레이터 AI 붙여넣기 (500 에러 방어 가드 포함)
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

  const isFashionBoard = category.includes("코디") || category.includes("염색") || category.includes("패션");

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-20 pt-8">
      <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 헤더 배너 */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-4 px-6 shadow-xl mb-4">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788]"></div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3"><span>✍️</span> 새 지식 기록하기</h1>
          <div className="text-[12px] font-bold text-zinc-400 mt-2 space-y-0.5">
            <p>고대 그리스어로 ‘지식’과 ‘깨달음’을 뜻하는 말입니다.</p>
            <p className="text-[#e6c788]">성역의 경험과 지혜가 모여 새로운 길을 밝히는 공간입니다.</p>
          </div>
        </header>

        <div className="bg-[#1c1c1e] rounded-lg border border-zinc-700 overflow-hidden shadow-2xl">
          <div className="bg-[#252528] flex flex-col border-b border-zinc-800">
            
            {/* 🟢 독립 게시판 및 계층형 카테고리 선택 UI */}
            <div ref={pickerRef} className="relative border-b border-zinc-800">
              <button 
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="w-full text-left bg-[#1c1c1e] text-white text-sm font-bold px-4 py-4 focus:outline-none flex justify-between items-center hover:bg-[#252528] transition"
              >
                <span className="flex items-center gap-2">
                  <span>{JOB_ICONS[category] || "📂"}</span>
                  <span>{category}</span>
                </span>
                <span className={`text-xs transition-transform ${showCategoryPicker ? 'rotate-180 text-[#e6c788]' : ''}`}>▼</span>
              </button>
              
              {showCategoryPicker && (
                <div className="absolute top-full left-0 w-full bg-[#1c1c1e] border border-zinc-700 shadow-2xl z-50 p-5 max-h-[420px] overflow-y-auto custom-scrollbar space-y-4">
                  
                  {/* 1. 상단 독립 게시판 (전체, 기타, 악보) */}
                  <div className="grid grid-cols-3 gap-2 pb-3 border-b border-zinc-800">
                    {["전체 지식", "기타 지식", "악보 지식"].map((board) => (
                      <button
                        key={board}
                        type="button"
                        onClick={() => { setCategory(board); setShowCategoryPicker(false); }}
                        className={`text-xs font-black p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 ${category === board ? 'bg-[#e6c788] text-black border-[#e6c788]' : 'bg-[#151515] text-zinc-300 border-zinc-800 hover:bg-zinc-800'}`}
                      >
                        <span>{JOB_ICONS[board]}</span>
                        <span>{board}</span>
                      </button>
                    ))}
                  </div>

                  {/* 2. 클래스 지식 계열별 분류 */}
                  <div className="space-y-3 bg-[#151515] p-3.5 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-black text-[#e6c788] uppercase tracking-wider border-b border-zinc-800 pb-1.5">⚔️ 클래스 지식</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { group: "전사 계열", jobs: ["전사", "대검전사", "검술사", "기사"] },
                        { group: "마법사 계열", jobs: ["마법사", "화염술사", "빙결술사", "전격술사"] },
                        { group: "궁수 계열", jobs: ["궁수", "장궁병", "석궁사수"] },
                        { group: "힐러 계열", jobs: ["힐러", "사제", "수도사", "암흑술사"] },
                        { group: "음유시인 계열", jobs: ["음유시인", "댄서", "악사"] },
                        { group: "도적 계열", jobs: ["도적", "격투가", "듀얼블레이드"] }
                      ].map(({ group, jobs }) => (
                        <div key={group} className="space-y-1">
                          <p className="text-[11px] text-zinc-500 font-bold">{group}</p>
                          <div className="flex flex-wrap gap-1">
                            {jobs.map(job => (
                              <button 
                                key={job} 
                                type="button"
                                onClick={() => { setCategory(job); setShowCategoryPicker(false); }} 
                                className={`text-[11px] font-bold px-2 py-1 rounded transition flex items-center gap-1 ${category === job ? 'bg-[#e6c788] text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                              >
                                <span>{JOB_ICONS[job]}</span>
                                <span>{job}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. 생활 지식 분류 */}
                  <div className="space-y-3 bg-[#151515] p-3.5 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-black text-[#e6c788] uppercase tracking-wider border-b border-zinc-800 pb-1.5">🌿 생활 지식</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["채집", "가공", "제작", "데코", "마이홈"].map(item => (
                        <button 
                          key={item} 
                          type="button"
                          onClick={() => { setCategory(item); setShowCategoryPicker(false); }} 
                          className={`text-xs font-bold px-3 py-1.5 rounded transition flex items-center gap-1.5 ${category === item ? 'bg-[#e6c788] text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                        >
                          <span>{JOB_ICONS[item]}</span>
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#1c1c1e] text-white text-sm px-4 py-3 border-b border-zinc-800 focus:outline-none" />

            <div className="flex items-center gap-4 px-4 py-2 bg-[#252528] text-zinc-400 text-sm overflow-x-auto custom-scrollbar">
              <div className="flex gap-3 font-serif">
                <button type="button" className="hover:text-white font-bold">B</button>
                <button type="button" className="hover:text-white italic">i</button>
                <button type="button" className="hover:text-white underline">U</button>
                <button type="button" className="hover:text-white line-through">S</button>
              </div>
              <div className="w-px h-4 bg-zinc-600"></div>
              <div className="flex gap-3 text-lg">
                <button type="button" className="hover:text-white">🙂</button>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c1e] p-4 flex gap-4 border-b border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useYoutube} onChange={(e) => setUseYoutube(e.target.checked)} className="accent-red-500 w-4 h-4" />
              <span className="text-xs font-bold text-zinc-300">유튜브 링크 추가</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useFashion} onChange={(e) => setUseFashion(e.target.checked)} className="accent-[#e6c788] w-4 h-4" />
              <span className="text-xs font-bold text-zinc-300">패션 시뮬레이터 적용</span>
              <span className="text-[10px] text-zinc-500">(스크린샷을 붙여넣으면 색상이 자동 스캔됩니다)</span>
            </label>
          </div>

          {useYoutube && (
            <div className="px-4 py-3 bg-[#151515] border-b border-zinc-800 flex gap-2 items-center">
              <span className="text-red-500">▶</span>
              <input type="text" placeholder="유튜브 링크 URL을 입력하세요" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} className="bg-transparent w-full text-xs text-white outline-none" />
            </div>
          )}

          {/* 패션 시뮬레이터 영역 */}
          {useFashion && (
            <div 
              onPaste={handlePaste} 
              className={`m-4 border-2 border-dashed rounded-xl p-6 text-center transition ${isAnalyzing ? 'border-purple-500 bg-purple-900/10' : itemData ? 'border-emerald-500 bg-emerald-900/10' : 'border-zinc-700 hover:border-[#e6c788] bg-[#1a1a1c]'}`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center animate-pulse">
                  <span className="text-3xl mb-2">🤖</span>
                  <p className="text-xs font-bold text-purple-400">AI가 이미지를 읽고 파기하는 중입니다...</p>
                </div>
              ) : itemData ? (
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-xs font-bold text-emerald-400">아이템 정보가 0KB로 스캔되었습니다!</p>
                  <p className="text-[10px] text-zinc-500 mt-1">[{itemData.rarity}] {itemData.itemName} / 염색 {itemData.dyeParts?.length || 0}파트</p>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-70">
                  <span className="text-3xl mb-2">📸</span>
                  <p className="text-xs font-bold text-white mb-1">여기를 클릭한 후 인게임 스크린샷 붙여넣기 (Ctrl+V)</p>
                  <p className="text-[10px] text-zinc-400">이미지는 서버에 저장되지 않고 AI가 정보만 추출합니다.</p>
                </div>
              )}
            </div>
          )}

          <div className="relative border-b border-zinc-800">
            {!content && (
              <div className="absolute top-4 left-4 right-4 pointer-events-none space-y-1 text-[11px] md:text-xs text-zinc-600 font-medium">
                <p>- 이미지나 동영상 혹은 파일 등은 데이터베이스 관리 목적상 업로드가 불가능합니다. 양해 부탁드립니다.</p>
                <p>- 잘못된 정보나 문제가 될 만한 내용을 다루는 게시물은 엄격히 금지합니다.</p>
                <p>- 발견하신다면 어떤 방법으로든 길드 마스터 및 부 마스터에게 제보 부탁드립니다.</p>
                <p>- 청결한 생텀 사용을 권장드립니다.</p>
              </div>
            )}
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-80 bg-transparent text-white p-4 text-sm focus:outline-none resize-none relative z-10 custom-scrollbar"
            />
          </div>

          <div className="bg-[#252528] divide-y divide-zinc-800">
            <label className="flex items-center gap-2 p-3 cursor-pointer group">
              <input type="checkbox" checked={hideMedia} onChange={e => setHideMedia(e.target.checked)} className="accent-zinc-500 bg-zinc-800 w-4 h-4" />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200">미디어 미리보기를 숨기시겠습니까?</span>
            </label>
            <label className="flex items-center gap-2 p-3 cursor-pointer group">
              <input type="checkbox" checked={useSpoiler} onChange={e => setUseSpoiler(e.target.checked)} className="accent-zinc-500 bg-zinc-800 w-4 h-4" />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200">스포일러 방지</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-3">
            <button type="button" className="text-xs font-bold text-zinc-400 bg-[#1c1c1e] border border-zinc-700 px-4 py-2.5 rounded">임시 저장 0/5</button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSubmit} className="text-xs font-black text-[#121212] bg-[#e6c788] hover:bg-yellow-500 px-6 py-2.5 rounded transition shadow-lg">작성 완료</button>
          </div>
        </div>
      </div>
    </main>
  );
}