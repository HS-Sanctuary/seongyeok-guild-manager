"use client";

import { useState, useEffect } from "react";
import { memberMutation } from "@/lib/memberMutationClient";

export default function SupportPage() {
  const [user, setUser] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 답변 작성용 상태
  const [replyText, setReplyText] = useState("");

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newInquiry, setNewInquiry] = useState({ category: "건의", title: "", content: "" });

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    setUser(currentUser);
    fetchInquiries(currentUser?.nickname);

    // 🛡️ 캡처 및 복사 방지 로직 (우클릭 차단 및 키보드 단축키 차단)
    const preventCopy = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'c') || (e.metaKey && e.key === 'c')) {
        e.preventDefault();
        alert("보안 정책상 캡처 및 복사가 금지된 페이지입니다.");
      }
    };
    
    document.addEventListener("contextmenu", preventCopy);
    document.addEventListener("selectstart", preventCopy);
    window.addEventListener("keydown", preventKeys);

    return () => {
      document.removeEventListener("contextmenu", preventCopy);
      document.removeEventListener("selectstart", preventCopy);
      window.removeEventListener("keydown", preventKeys);
    };
  }, []);

  // 🟢 1:1 맞춤형 데이터 불러오기 (한설 = 전부 다 보임 / 일반유저 = 내 것만 보임)
  const fetchInquiries = async (_nickname: string) => {
    setIsLoading(true);
    const response = await fetch('/api/inquiries');
    if (response.ok) {
      const result = await response.json();
      setInquiries(result.data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!newInquiry.title.trim() || !newInquiry.content.trim()) return alert("제목과 내용을 모두 입력해주세요!");
    
    const { error } = await memberMutation({ table: "inquiries", action: "insert", payload: newInquiry });

    if (!error) {
      setIsWriteModalOpen(false);
      setNewInquiry({ category: "건의", title: "", content: "" });
      fetchInquiries(user?.nickname);
    } else {
      alert("등록에 실패했습니다.");
    }
  };

  // 🟢 길드마스터 답변 등록 기능
  const handleReplySubmit = async (id: number) => {
    if (!replyText.trim()) return alert("답변 내용을 입력해주세요!");

    const { error } = await memberMutation({ table: "inquiries", action: "update", filter: { column: "id", value: id }, payload: { reply: replyText } });

    if (!error) {
      alert("답변이 등록되었습니다.");
      setReplyText("");
      fetchInquiries(user?.nickname);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toISOString().split('T')[0];

  return (
    // 🛡️ select-none 클래스로 드래그 차단 및 전역 테마 동기화
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 pt-6 select-none transition-colors duration-200">
      <div className="max-w-[1300px] mx-auto p-3 sm:p-6 space-y-4 relative">
        
        {/* 🟢 LOGOS 헤더 배너 (전역 테마 적용) */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-4 px-5 sm:px-6 shadow-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-black text-[var(--text-main)] tracking-widest leading-none flex items-center gap-2">
                  <span>💌</span> LOGOS
                </h1>
                <span className="text-[var(--accent)] text-[12px] sm:text-[13px] font-extrabold tracking-wide mt-1.5 leading-none">
                  로고스 : 1:1 문의함
                </span>
              </div>
            </div>
            
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-4 py-2 rounded-xl w-full max-w-[750px] backdrop-blur-sm flex items-start gap-2.5">
              <span className="text-sm mt-0.5 opacity-80">💡</span>
              <div className="flex flex-col text-[11px] sm:text-[12px] font-bold leading-tight w-full">
                <span className="text-[var(--text-main)] w-full">로고스는 고대 그리스어로 ‘말’과 ‘이성’, 생각을 뜻하는 말입니다.</span>
                <span className="text-[var(--accent)] mt-0.5">성역의 목소리를 듣고 더 나은 길을 함께 만들어가는 공간입니다.</span>
              </div>
            </div>

            <button 
              onClick={() => setIsWriteModalOpen(true)} 
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition transform hover:scale-[1.02] flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>📝</span> 새 문의 작성
            </button>
          </div>
        </header>

        {/* 안내 바 및 카운트 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--panel-border)] shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-main)] font-black text-xs sm:text-sm flex items-center gap-2">
              💌 1:1 비밀 문의 내역
            </span>
            <span className="text-[var(--accent)] text-[11px] font-black bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/20">
              {inquiries.length}개의 문의
            </span>
          </div>
          <span className="text-[var(--text-sub)] text-[11px] font-bold">
            작성하신 문의 내역은 본인과 길드마스터만 확인할 수 있습니다.
          </span>
        </div>

        {/* 메인 리스트 영역 */}
        <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] overflow-hidden shadow-lg min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-[var(--text-sub)] font-bold text-xs sm:text-sm">
              <span className="animate-pulse">불러오는 중...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-16 text-center text-[var(--text-sub)] font-medium flex flex-col items-center gap-3">
              <span className="text-4xl opacity-60">📭</span>
              <p className="text-xs font-bold text-[var(--text-main)]">문의하신 내역이 없습니다.</p>
              <p className="text-[11px] opacity-70">궁금한 점이나 건의사항이 있다면 편하게 작성해 주세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--panel-border)]">
              {inquiries.map((inquiry) => {
                const isExpanded = expandedId === inquiry.id;
                const isMaster = user?.nickname === "한설";

                return (
                  <div key={inquiry.id} className="flex flex-col border-b border-[var(--panel-border)] last:border-b-0">
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : inquiry.id)} 
                      className={`group flex items-center justify-between p-3.5 px-4 sm:px-6 transition cursor-pointer ${
                        isExpanded ? 'bg-[var(--inner-box)]' : 'hover:bg-[var(--inner-box)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="shrink-0 w-16 sm:w-20 text-center">
                          <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md whitespace-nowrap ${
                            inquiry.category === "버그" 
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                              : inquiry.category === "질문" 
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" 
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {inquiry.category}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          <span className="text-[var(--text-sub)] text-xs shrink-0">🔒</span>
                          <h3 className={`text-xs sm:text-sm font-bold truncate transition ${
                            isExpanded ? "text-[var(--accent)]" : "text-[var(--text-main)] group-hover:text-[var(--accent)]"
                          }`}>
                            {inquiry.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs">
                        <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md ${
                          inquiry.status === "답변완료" 
                            ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40" 
                            : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                        }`}>
                          {inquiry.status}
                        </span>
                        {isMaster && (
                          <span className="text-[var(--accent)] font-black w-16 sm:w-24 text-center truncate text-[11px] sm:text-xs hidden sm:inline-block">
                            {inquiry.author}
                          </span>
                        )}
                        <span className="text-[var(--text-sub)] font-mono text-[10px] sm:text-xs w-16 sm:w-20 text-right">
                          {formatDate(inquiry.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 본문 및 답변 펼쳐짐 영역 */}
                    {isExpanded && (
                      <div className="bg-[var(--inner-box)] border-t border-[var(--panel-border)] p-4 sm:p-6 md:px-16 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                        
                        {/* 1. 유저 질문 내용 */}
                        <div className="bg-[var(--panel)] p-4 rounded-xl border border-[var(--panel-border)] shadow-xs">
                          <div className="text-[11px] font-black text-[var(--text-sub)] mb-2.5 flex items-center gap-2">
                            <span className="bg-[var(--inner-box)] px-2 py-0.5 rounded text-[var(--accent)] border border-[var(--panel-border)]">
                              {inquiry.author}님의 문의
                            </span>
                          </div>
                          <div className="text-[var(--text-main)] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {inquiry.content}
                          </div>
                        </div>

                        {/* 2. 답변 내용 표시 (답변이 있을 때만) */}
                        {inquiry.reply && (
                          <div className="bg-[var(--accent-soft)]/50 p-4 rounded-xl border border-[var(--accent)]/30 shadow-xs">
                            <div className="text-[11px] text-[var(--accent)] font-black mb-2 flex items-center gap-1.5">
                              <span>👑 길드마스터 한설의 답변</span>
                            </div>
                            <div className="text-[var(--text-main)] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {inquiry.reply}
                            </div>
                          </div>
                        )}

                        {/* 3. 길드마스터 전용 답변 작성칸 (대기중일 때만) */}
                        {isMaster && inquiry.status === "대기중" && (
                          <div className="pt-3 border-t border-[var(--panel-border)]">
                            <textarea 
                              placeholder="여기에 답변을 작성해주세요..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full bg-[var(--panel)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl p-3 text-[var(--text-main)] outline-none h-24 resize-none text-xs sm:text-sm mb-2 shadow-xs placeholder:[var(--text-sub)]"
                            />
                            <div className="flex justify-end">
                              <button 
                                onClick={() => handleReplySubmit(inquiry.id)} 
                                className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black px-5 py-2 rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
                              >
                                답변 등록하기
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 새 문의 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[var(--inner-box)] px-5 py-3.5 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                <span>📝</span> 1:1 문의 작성
              </h2>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xl font-bold leading-none cursor-pointer">&times;</button>
            </div>
            
            <div className="p-5 space-y-3.5">
              <div className="flex gap-2.5">
                <select 
                  value={newInquiry.category} 
                  onChange={(e) => setNewInquiry({...newInquiry, category: e.target.value})} 
                  className="bg-[var(--inner-box)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--text-main)] outline-none font-black cursor-pointer"
                >
                  <option value="건의">건의</option>
                  <option value="버그">버그</option>
                  <option value="질문">질문</option>
                </select>
                <input 
                  type="text" 
                  placeholder="제목을 입력하세요" 
                  value={newInquiry.title} 
                  onChange={(e) => setNewInquiry({...newInquiry, title: e.target.value})} 
                  className="flex-1 bg-[var(--inner-box)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[var(--text-main)] outline-none placeholder:[var(--text-sub)]" 
                />
              </div>
              <textarea 
                placeholder="내용을 자세히 적어주세요..." 
                value={newInquiry.content} 
                onChange={(e) => setNewInquiry({...newInquiry, content: e.target.value})} 
                className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl p-3.5 text-[var(--text-main)] outline-none h-44 resize-none text-xs sm:text-sm shadow-xs placeholder:[var(--text-sub)] leading-relaxed" 
              />
            </div>

            <div className="bg-[var(--inner-box)] px-5 py-3.5 border-t border-[var(--panel-border)] flex justify-end gap-2.5">
              <button 
                onClick={() => setIsWriteModalOpen(false)} 
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] transition cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={handleSubmit} 
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent)]/90 transition shadow-md cursor-pointer"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
