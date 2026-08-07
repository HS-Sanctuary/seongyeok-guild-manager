"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["전체", "필독", "안내", "이벤트"];

export default function NoticePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 게시글 본문 확장을 위한 상태 (열려있는 게시글 ID)
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ type: "안내", title: "", content: "", isPinned: false });

  // 1️⃣ DB에서 공지사항 불러오기
  const fetchNotices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setNotices(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchNotices();
  }, []);

  // 2️⃣ 공지사항 작성
  const handleSubmit = async () => {
    if (!newNotice.title.trim()) return alert("공지사항 제목을 입력해주세요!");
    const authorName = user?.nickname || "한설"; 

    const { error } = await supabase.from('notices').insert([{
      type: newNotice.type, title: newNotice.title, content: newNotice.content, author: authorName, is_pinned: newNotice.isPinned
    }]);

    if (!error) {
      setIsWriteModalOpen(false);
      setNewNotice({ type: "안내", title: "", content: "", isPinned: false });
      fetchNotices();
    } else {
      alert("공지사항 등록에 실패했습니다.");
    }
  };

  // 🟢 3️⃣ 상단 고정 토글 (해제/등록) 기능
  const togglePin = async (id: number, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭(게시글 닫기) 방지
    const { error } = await supabase.from('notices').update({ is_pinned: !currentPinned }).eq('id', id);
    if (!error) fetchNotices();
  };

  // 🟢 4️⃣ 게시글 삭제 기능
  const deleteNotice = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭(게시글 닫기) 방지
    if (!confirm("이 공지사항을 정말 삭제하시겠습니까?")) return;
    
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) {
      setExpandedId(null); // 열려있던 창 닫기
      fetchNotices();
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toISOString().split('T')[0];

  const filteredNotices = notices.filter((notice) => {
    const matchCategory = activeCategory === "전체" || notice.type === activeCategory;
    const matchSearch = notice.title.includes(searchTerm) || notice.author.includes(searchTerm);
    return matchCategory && matchSearch;
  });

  const pinnedNotices = filteredNotices.filter((n) => n.is_pinned);
  const normalNotices = filteredNotices.filter((n) => !n.is_pinned);

  // 🟢 게시글(행) 렌더링 함수 (고정글, 일반글 중복 코드 방지)
  const renderNoticeRow = (notice: any, isPinnedStyle: boolean) => {
    const isExpanded = expandedId === notice.id;

    return (
      <div key={notice.id} className="flex flex-col border-b border-zinc-800 last:border-b-0">
        {/* 게시글 제목 줄 (클릭 시 본문 열림) */}
        <div 
          onClick={() => setExpandedId(isExpanded ? null : notice.id)}
          onMouseEnter={() => setHoveredId(notice.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-4 px-6 transition cursor-pointer ${
            isExpanded ? (isPinnedStyle ? 'bg-yellow-900/20' : 'bg-[#2a2a2e]') : 
            isPinnedStyle ? 'bg-yellow-900/10 hover:bg-yellow-900/20' : 'hover:bg-[#2a2a2e]'
          }`}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0 w-20 text-center">
              <span className={`text-xs font-bold px-2.5 py-1 rounded whitespace-nowrap ${
                isPinnedStyle ? "bg-red-500/20 text-red-400 border border-red-500/30 font-black" :
                notice.type === "이벤트" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
                notice.type === "필독" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                "bg-zinc-700/30 text-zinc-400 border border-zinc-600/30"
              }`}>
                {isPinnedStyle ? `📌 ${notice.type}` : notice.type}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-[15px] font-medium truncate transition ${
                isPinnedStyle ? (hoveredId === notice.id || isExpanded ? "text-yellow-400" : "text-[#e6c788]") :
                (hoveredId === notice.id || isExpanded ? "text-white" : "text-zinc-300")
              }`}>
                {notice.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-2 md:mt-0 ml-24 md:ml-0 flex-shrink-0 text-sm">
            <div className="flex items-center gap-1.5">
              {notice.author === "한설" && (
                <div className={`w-5 h-5 rounded-full bg-[#121212] flex items-center justify-center border ${isPinnedStyle ? 'border-yellow-600/50' : 'border-zinc-600'}`}>
                  <span className={`text-[8px] ${!isPinnedStyle && 'grayscale'}`}>👑</span>
                </div>
              )}
              <span className={`font-medium ${isPinnedStyle ? 'text-zinc-300' : 'text-zinc-400'}`}>{notice.author}</span>
            </div>
            <span className="text-zinc-500 font-mono text-xs w-20 text-right">{formatDate(notice.created_at)}</span>
          </div>
        </div>

        {/* 🟢 게시글 본문 영역 (열렸을 때만 렌더링) */}
        {isExpanded && (
          <div className="bg-[#1a1a1c] border-t border-zinc-800/50 p-6 px-8 md:px-28 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* 본문 내용 (줄바꿈 유지) */}
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
              {notice.content || "내용이 없습니다."}
            </div>
            
            {/* 🟢 관리자용 제어 버튼 (작성자이거나 한설일 때만 표시) */}
            {(user?.nickname === notice.author || user?.nickname === "한설") && (
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-zinc-800/50">
                <button 
                  onClick={(e) => togglePin(notice.id, notice.is_pinned, e)}
                  className="px-4 py-1.5 bg-[#252528] hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded border border-zinc-700 transition"
                >
                  {notice.is_pinned ? "📌 고정 해제" : "📌 상단 고정"}
                </button>
                <button 
                  onClick={(e) => deleteNotice(notice.id, e)}
                  className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded border border-red-500/20 transition"
                >
                  🗑️ 삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-20 pt-8">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 relative">
        
        {/* 🟢 KERYGMA 시그니처 헤더 (아고라/크로노스와 완벽 통일) */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c1e] via-[#151515] to-[#1a1a1c] border border-zinc-800 py-3 px-6 shadow-xl mb-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e6c788] shadow-[0_0_15px_#e6c788]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#e6c788] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md leading-none">
                  KERYGMA
                </h1>
                <span className="text-[#e6c788] text-[13px] font-bold tracking-wide mt-1.5 leading-none">
                  케뤼그마 : 길드 공지사항
                </span>
              </div>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-700/50 px-4 py-2 rounded-lg w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">📢</span>
              <div className="flex flex-col text-[11px] md:text-[12px] font-bold leading-tight w-full">
                <span className="text-zinc-300 w-full truncate md:whitespace-normal">
                  케뤼그마는 고대 그리스어로 ‘선포’와 ‘공표’를 뜻하는 말입니다.
                </span>
                <span className="text-[#e6c788] mt-0.5">
                  성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsWriteModalOpen(true)} 
              className="bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-4 py-2.5 rounded-lg text-xs md:text-sm shadow-[0_0_15px_rgba(230,199,136,0.3)] transition transform hover:scale-105 flex items-center gap-2 flex-shrink-0"
            >
              <span>✍️</span> 새 공지 작성
            </button>
          </div>
        </header>

        {/* 검색 및 필터 바 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1c1c1e] p-4 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${activeCategory === cat ? "bg-[#e6c788] text-[#121212]" : "bg-[#121212] text-zinc-400 hover:text-white border border-zinc-800"}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="제목이나 작성자로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#121212] border border-zinc-800 text-xs text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-[#e6c788] outline-none transition placeholder-zinc-600" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
          </div>
        </div>

        {/* 공지사항 목록 컨테이너 */}
        <div className="bg-[#1c1c1e] rounded-xl border border-zinc-800 overflow-hidden shadow-lg min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-zinc-500 font-bold text-sm">데이터를 불러오는 중입니다...</div>
          ) : notices.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 font-medium flex flex-col items-center gap-4">
              <span className="text-5xl opacity-80">📭</span>
              <p className="text-sm">등록된 공지사항이 없습니다.<br/>첫 번째 공지사항을 작성해보세요!</p>
            </div>
          ) : (
            <>
              {pinnedNotices.length > 0 && (
                <div className="border-b-[3px] border-zinc-700/50">
                  {pinnedNotices.map(notice => renderNoticeRow(notice, true))}
                </div>
              )}
              <div className="divide-y divide-zinc-800">
                {normalNotices.map(notice => renderNoticeRow(notice, false))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#252528] px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>✍️</span> 새 공지사항 작성</h2>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <select value={newNotice.type} onChange={(e) => setNewNotice({...newNotice, type: e.target.value})} className="bg-[#121212] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#e6c788] outline-none font-bold">
                  <option value="안내">안내</option><option value="필독">필독</option><option value="이벤트">이벤트</option>
                </select>
                <input type="text" placeholder="공지사항 제목을 입력하세요" value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-700 rounded-lg px-4 py-2 text-xs text-white focus:border-[#e6c788] outline-none" />
              </div>
              <textarea placeholder="공지사항 내용을 입력하세요... (길드원들에게 전할 메시지)" value={newNotice.content} onChange={(e) => setNewNotice({...newNotice, content: e.target.value})} className="w-full bg-[#121212] border border-zinc-700 rounded-lg p-4 text-xs text-white focus:border-[#e6c788] outline-none h-48 resize-none custom-scrollbar" />
              <label className="flex items-center gap-2 cursor-pointer w-fit group mt-2">
                <input type="checkbox" checked={newNotice.isPinned} onChange={(e) => setNewNotice({...newNotice, isPinned: e.target.checked})} className="w-4 h-4 accent-amber-500 bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition">이 글을 최상단에 고정합니다 (📌 필독 전용 권장)</span>
              </label>
            </div>
            <div className="bg-[#252528] px-6 py-4 border-t border-zinc-700 flex justify-end gap-3">
              <button onClick={() => setIsWriteModalOpen(false)} className="px-5 py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-[#121212] border border-zinc-700 hover:border-zinc-500 transition">취소</button>
              <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg text-xs font-black text-[#121212] bg-[#e6c788] hover:bg-yellow-500 transition shadow-lg">등록하기</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </main>
  );
}