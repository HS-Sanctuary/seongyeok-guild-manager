"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
  const fetchInquiries = async (nickname: string) => {
    setIsLoading(true);
    let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    
    if (nickname !== "한설") {
      query = query.eq('author', nickname);
    }

    const { data, error } = await query;
    if (!error) setInquiries(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!newInquiry.title.trim() || !newInquiry.content.trim()) return alert("제목과 내용을 모두 입력해주세요!");
    
    const authorName = user?.nickname || "길드원"; 
    const { error } = await supabase.from('inquiries').insert([{
      category: newInquiry.category, title: newInquiry.title, content: newInquiry.content, author: authorName, status: "대기중"
    }]);

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

    const { error } = await supabase.from('inquiries').update({ 
      reply: replyText, 
      status: "답변완료" 
    }).eq('id', id);

    if (!error) {
      alert("답변이 등록되었습니다.");
      setReplyText("");
      fetchInquiries(user?.nickname);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toISOString().split('T')[0];

  return (
    // 🛡️ select-none 클래스로 드래그 차단
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-6 select-none">
      <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-6 relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-700/50 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <span>💌</span> 1:1 문의함
            </h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">
              작성하신 문의 내역은 본인과 길드마스터만 확인할 수 있습니다.
            </p>
          </div>
          
          <button onClick={() => setIsWriteModalOpen(true)} className="bg-zinc-200 hover:bg-white text-[#121212] font-black px-6 py-2.5 rounded-lg text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] transition transform hover:scale-105 flex items-center gap-2">
            <span>📝</span> 새 문의 작성
          </button>
        </div>

        <div className="bg-[#252528] rounded-xl border border-zinc-800 overflow-hidden shadow-lg min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-zinc-500 font-bold">불러오는 중...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 font-medium flex flex-col items-center gap-4">
              <span className="text-5xl opacity-80">📭</span>
              <p>문의하신 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {inquiries.map((inquiry) => {
                const isExpanded = expandedId === inquiry.id;
                const isMaster = user?.nickname === "한설";

                return (
                  <div key={inquiry.id} className="flex flex-col border-b border-zinc-800 last:border-b-0">
                    <div onClick={() => setExpandedId(isExpanded ? null : inquiry.id)} className={`group flex items-center justify-between p-4 px-6 transition cursor-pointer ${isExpanded ? 'bg-[#2a2a2e]' : 'hover:bg-[#2a2a2e]'}`}>
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0 w-20 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded whitespace-nowrap ${inquiry.category === "버그" ? "bg-red-500/10 text-red-400 border border-red-500/20" : inquiry.category === "질문" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                            {inquiry.category}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-zinc-500 text-xs">🔒</span>
                          <h3 className={`text-[15px] font-medium truncate transition ${isExpanded ? "text-white" : "text-zinc-300"}`}>
                            {inquiry.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${inquiry.status === "답변완료" ? "bg-[#e6c788]/20 text-[#e6c788]" : "bg-zinc-700 text-zinc-300"}`}>{inquiry.status}</span>
                        {isMaster && <span className="text-zinc-400 w-20 text-center truncate">{inquiry.author}</span>}
                        <span className="text-zinc-500 font-mono text-xs w-20 text-right">{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>

                    {/* 본문 및 답변 영역 */}
                    {isExpanded && (
                      <div className="bg-[#1a1a1c] border-t border-zinc-800/50 p-6 px-8 md:px-28 animate-in fade-in slide-in-from-top-2 duration-200 space-y-6">
                        
                        {/* 1. 유저 질문 내용 */}
                        <div className="bg-[#252528] p-5 rounded-lg border border-zinc-700/50">
                          <div className="text-xs text-zinc-500 font-bold mb-3 flex items-center gap-2">
                            <span className="bg-zinc-800 px-2 py-1 rounded">{inquiry.author}님의 문의</span>
                          </div>
                          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.content}</div>
                        </div>

                        {/* 2. 답변 내용 표시 (답변이 있을 때만) */}
                        {inquiry.reply && (
                          <div className="bg-[#e6c788]/10 p-5 rounded-lg border border-[#e6c788]/30">
                            <div className="text-xs text-[#e6c788] font-bold mb-3 flex items-center gap-2">
                              <span>👑 길드마스터 한설의 답변</span>
                            </div>
                            <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.reply}</div>
                          </div>
                        )}

                        {/* 3. 길드마스터 전용 답변 작성칸 (대기중일 때만) */}
                        {isMaster && inquiry.status === "대기중" && (
                          <div className="pt-4 border-t border-zinc-800">
                            <textarea 
                              placeholder="여기에 답변을 작성해주세요..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full bg-[#121212] border border-zinc-700 rounded-lg p-3 text-white focus:border-[#e6c788] outline-none h-24 resize-none text-sm mb-3"
                            />
                            <div className="flex justify-end">
                              <button onClick={() => handleReplySubmit(inquiry.id)} className="bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-6 py-2 rounded text-sm transition">
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

      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#252528] px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><span>📝</span> 1:1 문의 작성</h2>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <select value={newInquiry.category} onChange={(e) => setNewInquiry({...newInquiry, category: e.target.value})} className="bg-[#121212] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-zinc-500 outline-none font-bold">
                  <option value="건의">건의</option><option value="버그">버그</option><option value="질문">질문</option>
                </select>
                <input type="text" placeholder="제목을 입력하세요" value={newInquiry.title} onChange={(e) => setNewInquiry({...newInquiry, title: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-zinc-500 outline-none" />
              </div>
              <textarea placeholder="내용을 자세히 적어주세요..." value={newInquiry.content} onChange={(e) => setNewInquiry({...newInquiry, content: e.target.value})} className="w-full bg-[#121212] border border-zinc-700 rounded-lg p-4 text-white focus:border-zinc-500 outline-none h-48 resize-none text-sm" />
            </div>
            <div className="bg-[#252528] px-6 py-4 border-t border-zinc-700 flex justify-end gap-3">
              <button onClick={() => setIsWriteModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-zinc-400 hover:text-white bg-[#1c1c1e] border border-zinc-700 hover:border-zinc-500 transition">취소</button>
              <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg text-sm font-black text-[#121212] bg-zinc-200 hover:bg-white transition shadow-lg">등록하기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}