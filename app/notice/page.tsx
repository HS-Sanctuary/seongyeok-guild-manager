"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["전체", "길드 공지사항", "길드 이벤트", "생텀 공지사항", "생텀 업데이트", "생텀 가이드", "모비노기 공식"];
const LINK_ONLY_CATEGORIES = ["생텀 가이드", "모비노기 공식"];

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

interface PollData {
  title: string;
  options: PollOption[];
  allowMultiple: boolean;
  endDate: string;
  isAnonymous: boolean;
  userVotes?: string[];
}

interface CommentItem {
  id: number;
  notice_id: number;
  author: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  children?: CommentItem[];
}

interface Notice {
  id: number;
  type: string;
  title: string;
  content: string;
  author: string;
  is_pinned: boolean;
  link?: string;
  created_at: string;
  poll?: PollData;
  likes?: number;
  dislikes?: number;
  userReaction?: 'like' | 'dislike' | null;
}

export default function NoticePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 리더(Reader) & 댓글 상태
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [commentsTree, setCommentsTree] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [activeCategory, setActiveCategory] = useState("전체");

  // 글쓰기(Editor) 뷰 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ type: "길드 공지사항", title: "", content: "", link: "", isPinned: false });
  const editorRef = useRef<HTMLDivElement>(null);
  
  // 툴바 상태
  const [activePopover, setActivePopover] = useState<"fontSize" | "lineHeight" | "textColor" | "bgColor" | "table" | "symbol" | null>(null);
  const [tableGrid, setTableGrid] = useState({ r: 0, c: 0 });

  // 투표 생성 상태
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pendingPoll, setPendingPoll] = useState<PollData | null>(null);
  const [pollForm, setPollForm] = useState<PollData>({ 
    title: "", 
    options: [{ id: "opt-1", text: "", votes: 0, voters: [] }, { id: "opt-2", text: "", votes: 0, voters: [] }], 
    allowMultiple: false, 
    endDate: "1일",
    isAnonymous: false 
  });

  const SPECIAL_CHARS = [
    "★", "☆", "♥", "♡", "♠", "♤", "♣", "♧",
    "●", "○", "■", "□", "▲", "△", "▼", "▽", "◆", "◇",
    "◎", "◈", "▣", "◐", "◑", "▒", "▤", "▥", "▨", "▧", "▦", "▩",
    "→", "←", "↑", "↓", "↔", "↕", "↗", "↙", "↖", "↘",
    "⇒", "⇔", "✓", "✔", "✕", "✖", "✗", "✘",
    "©", "®", "™", "±", "×", "÷", "≠", "≤", "≥", "∞", "∴", "∵",
    "½", "⅓", "⅔", "¼", "¾", "⅛", "⅜", "⅝", "⅞",
    "℃", "℉", "㎎", "㎏", "㎜", "㎝", "㎞", "㎡", "㎥", "㏄",
    "Ω", "i", "A", "É", "—", "€", "£", "¥"
  ];
  
  const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
  const LINE_HEIGHTS = [1.1, 1.3, 1.5, 1.7, 1.9, 2.1];

  // 작성일 포맷팅: 앞의 20을 제거하여 '26. 9. 15.' 형태로 포맷
  const formatNoticeDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yy = String(d.getFullYear()).slice(2);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return `${yy}. ${mm}. ${dd}.`;
  };

  const fetchNotices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('notices').select('*');
    const localData = JSON.parse(localStorage.getItem('notices_mock_db') || '[]');
    let combined: Notice[] = (!error && data) ? [...data] : [];
    combined = [...combined, ...localData].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setNotices(combined);
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchNotices();
  }, []);

  const currentNickname = user?.nickname || "방문자";
  const isMaster = user?.nickname === "한설" || user?.role === "길드마스터";
  const isSubMaster = user?.role === "부길드마스터" || user?.role === "부마스터" || user?.role === "admin";
  const canWriteNotice = isMaster || isSubMaster;

  const openWriteModal = () => {
    const draft = localStorage.getItem("notice_draft");
    if (draft) {
      if (window.confirm("임시저장된 글을 가지고 오시겠습니까?")) {
        const parsed = JSON.parse(draft);
        setNewNotice(parsed);
      } else {
        localStorage.removeItem("notice_draft");
        setNewNotice({ type: "길드 공지사항", title: "", content: "", link: "", isPinned: false });
      }
    } else {
      setNewNotice({ type: "길드 공지사항", title: "", content: "", link: "", isPinned: false });
    }
    setPendingPoll(null);
    setIsWriteModalOpen(true);
  };

  useEffect(() => {
    if (isWriteModalOpen && editorRef.current) {
      if (editorRef.current.innerHTML !== newNotice.content) {
        editorRef.current.innerHTML = newNotice.content;
      }
    }
  }, [isWriteModalOpen]);

  const handleSaveDraft = () => {
    const currentContent = editorRef.current ? editorRef.current.innerHTML : newNotice.content;
    const draftData = { ...newNotice, content: currentContent };
    localStorage.setItem("notice_draft", JSON.stringify(draftData));
    alert("임시저장 되었습니다.");
  };

  const handleEditorInput = () => {
    if (editorRef.current) setNewNotice({ ...newNotice, content: editorRef.current.innerHTML });
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u', 's'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'b') executeCommand("bold");
      if (key === 'i') executeCommand("italic");
      if (key === 'u') executeCommand("underline");
      if (key === 's') executeCommand("strikeThrough");
    }
  };

  const insertCustomHTML = (html: string) => {
    document.execCommand("insertHTML", false, html);
    handleEditorInput();
    setActivePopover(null);
  };

  const applyFontSize = (sz: number) => {
    executeCommand("fontSize", "7");
    const els = editorRef.current?.querySelectorAll('font[size="7"], span[style*="xxx-large"]');
    els?.forEach(el => {
      el.removeAttribute("size");
      (el as HTMLElement).style.fontSize = `${sz}px`;
    });
    handleEditorInput();
    setActivePopover(null);
  };

  const applyLineHeight = (lh: number) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    let node = selection.focusNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        (node as HTMLElement).style.lineHeight = `${lh}`;
        break;
      }
      node = node.parentNode;
    }
    handleEditorInput();
    setActivePopover(null);
  };

  const handleTableInsert = (rows: number, cols: number) => {
    let html = `<table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--panel-border);"><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="border: 1px solid var(--panel-border); padding: 8px 12px; overflow-wrap: break-word; word-break: break-all;"><br></td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;
    insertCustomHTML(html);
  };

  const insertPoll = () => {
    if (!pollForm.title.trim()) return alert("투표 주제를 입력하세요.");
    const validOptions = pollForm.options.filter(o => o.text.trim() !== "");
    if (validOptions.length < 2) return alert("선택 항목을 2개 이상 입력하세요.");
    
    const finalPoll: PollData = { 
      ...pollForm, 
      options: validOptions.map((opt, i) => ({ ...opt, id: `opt-${Date.now()}-${i}`, votes: 0, voters: [] })) 
    };
    setPendingPoll(finalPoll);
    insertCustomHTML(`<div class="p-3 my-3 border border-[var(--accent)]/50 rounded-lg bg-[var(--inner-box)] text-[0.8rem] font-bold">📊 [투표 삽입됨: ${finalPoll.title}]</div><p><br></p>`);
    setIsPollModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!newNotice.title.trim()) return alert("제목을 입력해주세요.");
    const currentContent = editorRef.current ? editorRef.current.innerHTML : newNotice.content;
    
    if (LINK_ONLY_CATEGORIES.includes(newNotice.type) && !newNotice.link?.trim()) return alert("외부 링크(URL)를 입력해주세요.");
    if (!LINK_ONLY_CATEGORIES.includes(newNotice.type) && !currentContent.trim()) return alert("내용을 입력해주세요.");
    if ((newNotice.type === "생텀 업데이트" || newNotice.type === "생텀 공지사항") && !isMaster) return alert("해당 카테고리는 길드마스터 전용입니다.");

    const payload: Omit<Notice, 'id'> = {
      type: newNotice.type,
      title: newNotice.title,
      content: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? "" : currentContent,
      link: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? newNotice.link : undefined,
      author: user?.nickname || "관리자",
      is_pinned: newNotice.isPinned,
      created_at: new Date().toISOString(),
      poll: pendingPoll || undefined,
      likes: 0,
      dislikes: 0
    };

    await supabase.from('notices').insert([payload]);

    const localDb: Notice[] = JSON.parse(localStorage.getItem('notices_mock_db') || '[]');
    const newEntry: Notice = { id: Date.now(), ...payload };
    localStorage.setItem('notices_mock_db', JSON.stringify([newEntry, ...localDb]));
    
    localStorage.removeItem("notice_draft");
    setIsWriteModalOpen(false);
    setNewNotice({ type: "길드 공지사항", title: "", content: "", link: "", isPinned: false });
    setPendingPoll(null);
    fetchNotices();
  };

  const togglePin = async (id: number, currentPinned: boolean) => {
    if (!canWriteNotice) return;
    const mockDb: Notice[] = JSON.parse(localStorage.getItem('notices_mock_db') || '[]');
    const updated = mockDb.map(n => n.id === id ? { ...n, is_pinned: !currentPinned } : n);
    localStorage.setItem('notices_mock_db', JSON.stringify(updated));
    if (selectedNotice && selectedNotice.id === id) setSelectedNotice({ ...selectedNotice, is_pinned: !currentPinned });
    await supabase.from('notices').update({ is_pinned: !currentPinned }).eq('id', id);
    fetchNotices();
  };

  const deleteNotice = async (id: number) => {
    if (!canWriteNotice) return;
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    const mockDb: Notice[] = JSON.parse(localStorage.getItem('notices_mock_db') || '[]');
    localStorage.setItem('notices_mock_db', JSON.stringify(mockDb.filter(n => n.id !== id)));
    await supabase.from('notices').delete().eq('id', id);
    setSelectedNotice(null);
    fetchNotices();
  };

  const buildCommentsTree = (flatComments: CommentItem[]) => {
    const map = new Map<number, CommentItem>();
    const roots: CommentItem[] = [];
    flatComments.forEach(c => map.set(c.id, { ...c, children: [] }));
    flatComments.forEach(c => {
      const node = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children!.push(node!);
      } else {
        roots.push(node!);
      }
    });
    return roots;
  };

  const loadComments = (noticeId: number) => {
    const allComments: CommentItem[] = JSON.parse(localStorage.getItem('sanctum_notice_comments') || '[]');
    const noticeComments = allComments.filter(c => c.notice_id === noticeId);
    setCommentsTree(buildCommentsTree(noticeComments));
  };

  const openNotice = (notice: Notice) => {
    if (LINK_ONLY_CATEGORIES.includes(notice.type) && notice.link) {
      window.open(notice.link, '_blank');
      return;
    }
    setSelectedNotice(notice);
    loadComments(notice.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddComment = (parentId: number | null = null) => {
    if (!selectedNotice) return;
    const text = parentId === null ? newCommentText : replyText;
    if (!text.trim()) return;

    const allComments: CommentItem[] = JSON.parse(localStorage.getItem('sanctum_notice_comments') || '[]');
    const newEntry: CommentItem = {
      id: Date.now(),
      notice_id: selectedNotice.id,
      author: currentNickname,
      content: text.trim(),
      created_at: new Date().toISOString(),
      parent_id: parentId
    };

    const updated = [...allComments, newEntry];
    localStorage.setItem('sanctum_notice_comments', JSON.stringify(updated));

    if (parentId === null) setNewCommentText("");
    else {
      setReplyingTo(null);
      setReplyText("");
    }
    loadComments(selectedNotice.id);
  };

  const handleReaction = (type: 'like' | 'dislike') => {
    if (!selectedNotice) return;
    const currentReaction = selectedNotice.userReaction;
    let newLikes = selectedNotice.likes || 0;
    let newDislikes = selectedNotice.dislikes || 0;
    let newReaction: 'like' | 'dislike' | null = type;

    if (currentReaction === type) {
      newReaction = null;
      if (type === 'like') newLikes = Math.max(0, newLikes - 1);
      else newDislikes = Math.max(0, newDislikes - 1);
    } else {
      if (currentReaction === 'like') newLikes = Math.max(0, newLikes - 1);
      if (currentReaction === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
      if (type === 'like') newLikes += 1;
      else newDislikes += 1;
    }

    const updatedNotice = { ...selectedNotice, likes: newLikes, dislikes: newDislikes, userReaction: newReaction };
    setSelectedNotice(updatedNotice);
    setNotices(prev => prev.map(n => n.id === updatedNotice.id ? updatedNotice : n));
    const mockDb: Notice[] = JSON.parse(localStorage.getItem('notices_mock_db') || '[]');
    localStorage.setItem('notices_mock_db', JSON.stringify(mockDb.map(n => n.id === updatedNotice.id ? updatedNotice : n)));
  };

  const handleVoteOption = (optionId: string) => {
    if (!selectedNotice || !selectedNotice.poll) return;
    const poll = selectedNotice.poll;
    const userVotes = poll.userVotes || [];
    let updatedVotes = [...userVotes];

    if (poll.allowMultiple) {
      if (updatedVotes.includes(optionId)) updatedVotes = updatedVotes.filter(id => id !== optionId);
      else updatedVotes.push(optionId);
    } else {
      updatedVotes = [optionId];
    }

    const updatedOptions = poll.options.map(opt => {
      let voters = (opt.voters || []).filter(v => v !== currentNickname);
      if (updatedVotes.includes(opt.id)) voters.push(currentNickname);
      return { ...opt, votes: voters.length, voters };
    });

    const updatedNotice = { ...selectedNotice, poll: { ...poll, options: updatedOptions, userVotes: updatedVotes } };
    setSelectedNotice(updatedNotice);
    setNotices(prev => prev.map(n => n.id === updatedNotice.id ? updatedNotice : n));
  };

  const filteredList = notices.filter(n => activeCategory === "전체" || n.type === activeCategory);
  const recentNoticesList = notices.filter(n => n.id !== selectedNotice?.id).slice(0, 8);

  const getBadgeStyle = (type: string, isPinned: boolean) => {
    if (isPinned) return "text-red-400 font-semibold";
    switch (type) {
      case "생텀 가이드": return "text-purple-400";
      case "모비노기 공식": return "text-blue-400";
      case "생텀 업데이트": return "text-emerald-400";
      case "길드 이벤트": return "text-amber-400";
      default: return "text-[var(--accent)]";
    }
  };

  const renderCategoryButton = (cat: string) => {
    const isSelected = activeCategory === cat;
    let activeClasses = "";
    let glowColor = "";

    if (cat === "전체") {
      activeClasses = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_4px_12px_rgba(16,185,129,0.3)]";
      glowColor = "rgba(16, 185, 129, 0.85)";
    } else if (cat.startsWith("길드")) {
      activeClasses = "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_4px_12px_rgba(245,158,11,0.3)]";
      glowColor = "rgba(245, 158, 11, 0.85)";
    } else if (cat.startsWith("생텀")) {
      activeClasses = "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_4px_12px_rgba(168,85,247,0.3)]";
      glowColor = "rgba(168, 85, 247, 0.85)";
    } else if (cat === "모비노기 공식") {
      activeClasses = "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_4px_12px_rgba(59,130,246,0.3)]";
      glowColor = "rgba(59, 130, 246, 0.85)";
    }

    return (
      <button
        key={cat}
        onClick={() => setActiveCategory(cat)}
        className={`relative px-3.5 py-1.5 rounded-lg text-[0.75rem] font-bold transition-all duration-300 border whitespace-nowrap shrink-0 ${
          isSelected
            ? activeClasses
            : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)]"
        }`}
      >
        <span>{cat}</span>
        {isSelected && (
          <span
            className="absolute -bottom-1 left-2 right-2 h-[2.5px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: glowColor,
              boxShadow: `0 0 10px ${glowColor}, 0 0 4px ${glowColor}`
            }}
          />
        )}
      </button>
    );
  };

  const renderCommentNode = (node: CommentItem, depth = 0) => (
    <div key={node.id} className="space-y-1.5" style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 60)}px` : '0px' }}>
      <div className={`p-3 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-md space-y-1.5 ${depth > 0 ? 'border-l-2 border-l-[var(--accent)]/50' : ''}`}>
        <div className="flex justify-between items-center text-[0.7rem]">
          <div className="flex items-center gap-1.5">
            {depth > 0 && <span className="text-[var(--accent)] opacity-70">↳</span>}
            <span className="font-bold text-[var(--text-main)]">{node.author}</span>
            <span className="text-[var(--text-sub)] opacity-50">• {formatNoticeDate(node.created_at)}</span>
          </div>
          <button 
            onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
            className="text-[0.7rem] font-semibold text-[var(--accent)] hover:underline"
          >
            답글
          </button>
        </div>
        <p className="text-[0.85rem] text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">{node.content}</p>
      </div>

      {replyingTo === node.id && (
        <div className="ml-4 flex gap-1.5 pt-1">
          <input 
            type="text" 
            placeholder="답글을 남겨주세요..." 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-[0.8rem] text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
          />
          <button onClick={() => handleAddComment(node.id)} className="bg-[var(--accent)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-3 py-1.5 rounded-md">등록</button>
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {node.children.map(child => renderCommentNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 pt-4 overflow-x-hidden">
      
      {/* ==============================================================================
          1. 게시판 메인 리스트 뷰 (넓은 가로 스케일 적용: max-w-[1400px])
          ============================================================================== */}
      <div className={`max-w-[1400px] mx-auto px-4 md:px-6 space-y-4 transition-all duration-300 ${selectedNotice || isWriteModalOpen ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}>
        
        {/* 통합 상단 헤더 박스 */}
        <header className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 md:px-5 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden border-l-4 border-l-[var(--accent)] shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-main)] leading-none">KERYGMA</h1>
            <p className="text-[0.75rem] font-semibold text-[var(--accent)] mt-1.5">케리그마 : 길드 공지사항</p>
          </div>
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <div className="flex items-start sm:items-center gap-2 px-3 py-2 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[0.7rem] text-[var(--text-sub)] max-w-xl">
              <span className="shrink-0 text-base mt-0.5 sm:mt-0">📢</span>
              <div className="flex flex-col leading-snug break-words">
                <span>케리그마는 고대 그리스어로 '선포'와 '공표'를 뜻하는 말입니다.</span>
                <span className="text-[var(--accent)] font-medium">성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.</span>
              </div>
            </div>
            {canWriteNotice && (
              <button onClick={openWriteModal} className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 whitespace-nowrap ml-auto md:ml-0">
                <span>✏️</span>
                <span>새 공지 작성</span>
              </button>
            )}
          </div>
        </header>

        {/* 🟢 카테고리 탭 바 */}
        <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] shadow-sm">
          <div className="flex items-center gap-2 text-[0.75rem] overflow-x-auto pb-1.5 custom-scrollbar">
            {renderCategoryButton("전체")}
            <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
            {renderCategoryButton("길드 공지사항")}
            {renderCategoryButton("길드 이벤트")}
            <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
            {renderCategoryButton("생텀 공지사항")}
            {renderCategoryButton("생텀 업데이트")}
            {renderCategoryButton("생텀 가이드")}
            <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
            {renderCategoryButton("모비노기 공식")}
          </div>
        </div>

        {/* 🟢 정밀 레이아웃 수정된 초록 영역: 분류(w-[110px]) | 넓은 제목 | 작성자(w-[85px]) | 작성일(w-[90px]) */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm">
          {/* 테이블 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--inner-box)] border-b border-[var(--panel-border)] text-[0.7rem] font-semibold text-[var(--text-sub)] select-none">
            <div className="w-[110px] shrink-0 text-center">분류</div>
            <div className="flex-1 min-w-0 px-3 text-left">제목</div>
            <div className="w-[85px] shrink-0 text-center">작성자</div>
            <div className="w-[90px] shrink-0 text-center">작성일</div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40 text-[var(--text-sub)] text-[0.8rem]">데이터 로드 중...</div>
          ) : filteredList.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-[var(--text-sub)] text-[0.8rem]">등록된 게시글이 없습니다.</div>
          ) : (
            <div className="flex flex-col">
              {filteredList.map((notice) => (
                <div key={notice.id} onClick={() => openNotice(notice)} className="flex items-center justify-between px-4 py-3 border-b border-[var(--panel-border)] hover:bg-[var(--panel-hover)] cursor-pointer transition-colors group last:border-0 text-[0.85rem]">
                  {/* 분류: w-[110px]로 확충하여 '길드 공지사항' 등도 1줄로 축소생략 없이 완벽 노출 */}
                  <div className="w-[110px] shrink-0 text-center flex justify-center items-center">
                    <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded border border-[var(--panel-border)] whitespace-nowrap ${getBadgeStyle(notice.type, notice.is_pinned)}`}>
                      {notice.is_pinned ? "필독" : notice.type}
                    </span>
                  </div>

                  {/* 우측으로 이동된 시원한 제목 영역 */}
                  <div className="flex-1 min-w-0 px-3 flex items-center gap-2 overflow-hidden">
                    <h3 className={`truncate whitespace-nowrap text-[0.85rem] ${notice.is_pinned ? "font-bold text-[var(--text-main)]" : "font-medium text-[var(--text-sub)] group-hover:text-[var(--text-main)]"}`}>
                      {notice.title}
                    </h3>
                    {notice.poll && <span className="text-[0.65rem] bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap">📊투표</span>}
                  </div>

                  {/* 작성자: 정중앙 배치 & 작성일과의 명확한 거리를 두어 겹침 철저 차단 */}
                  <div className="w-[85px] shrink-0 text-center text-[0.75rem] text-[var(--text-sub)] truncate whitespace-nowrap font-medium">
                    {notice.author}
                  </div>

                  {/* 작성일: 헤더 문구와 직렬 세로 맞춤 정렬, 앞 20 제외한 26. 9. 15. 형태 포맷 */}
                  <div className="w-[90px] shrink-0 text-center text-[0.75rem] text-[var(--text-sub)] opacity-75 font-mono whitespace-nowrap">
                    {formatNoticeDate(notice.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================================
          2. 리더(Reader) 뷰 (넓은 가로 스케일 적용: max-w-[1200px])
          ============================================================================== */}
      {selectedNotice && (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 space-y-4 animate-in fade-in duration-200">
          
          {/* 상단 브레드크럼 및 관리 액션바 */}
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3 text-[0.75rem]">
            <button onClick={() => setSelectedNotice(null)} className="flex items-center gap-1.5 text-[var(--text-sub)] hover:text-[var(--text-main)] transition font-semibold group">
              <span className="transition-transform group-hover:-translate-x-0.5 text-base">←</span>
              <span>목록으로 돌아가기</span>
            </button>
            {canWriteNotice && (
              <div className="flex items-center gap-2">
                <button onClick={() => togglePin(selectedNotice.id, selectedNotice.is_pinned)} className="px-3 py-1 rounded-lg text-[0.75rem] font-semibold text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)]">
                  {selectedNotice.is_pinned ? "고정해제" : "상단고정"}
                </button>
                <button onClick={() => deleteNotice(selectedNotice.id)} className="px-3 py-1 rounded-lg text-[0.75rem] font-semibold text-red-400 bg-[var(--panel)] border border-red-500/20 hover:bg-red-500/10">
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 메인 아티클 카드 */}
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl overflow-hidden shadow-sm">
            {/* 글 헤더 */}
            <div className="p-5 md:p-6 border-b border-[var(--panel-border)] space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-[0.75rem] font-bold px-2 py-0.5 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] ${getBadgeStyle(selectedNotice.type, selectedNotice.is_pinned)}`}>
                  {selectedNotice.type}
                </span>
                {selectedNotice.is_pinned && <span className="text-[0.75rem] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">필독 공지</span>}
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] leading-snug tracking-tight">
                {selectedNotice.title}
              </h1>

              <div className="flex items-center justify-between text-[0.75rem] text-[var(--text-sub)] pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-main)]">{selectedNotice.author}</span>
                  <span className="opacity-30">•</span>
                  <span>{formatNoticeDate(selectedNotice.created_at)} {new Date(selectedNotice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* 본문 컨텐츠 */}
            <div className="p-5 md:p-6 min-h-[200px] text-[0.95rem] text-[var(--text-main)] leading-[1.65] break-words prose-editor">
              <div dangerouslySetInnerHTML={{ __html: selectedNotice.content || "" }} />

              {/* 투표 위젯 */}
              {selectedNotice.poll && (
                <div className="my-5 p-4 bg-[var(--inner-box)] border border-[var(--accent)]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-[0.75rem]">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[var(--accent)] text-[var(--accent-fg)] text-[0.65rem] font-black px-2 py-0.5 rounded">POLL</span>
                      <span className="text-[var(--text-sub)]">{selectedNotice.poll.isAnonymous ? '🔒 익명 투표' : '👁️ 실명 투표'}</span>
                    </div>
                    <span className="text-[var(--text-sub)]">{selectedNotice.poll.allowMultiple ? '복수선택' : '단일선택'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-main)]">{selectedNotice.poll.title}</h3>

                  <div className="space-y-2">
                    {selectedNotice.poll.options.map((opt) => {
                      const totalVotes = selectedNotice.poll!.options.reduce((acc, cur) => acc + (cur.votes || 0), 0);
                      const percent = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                      const isSelected = selectedNotice.poll!.userVotes?.includes(opt.id);

                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => handleVoteOption(opt.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-[var(--accent)]/15 border-[var(--accent)]' 
                              : 'bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--text-sub)]/35'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[0.8rem] font-semibold text-[var(--text-main)] mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[0.65rem] ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-zinc-500'}`}>
                                {isSelected ? '✓' : ''}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            <span className="text-[0.75rem] font-mono text-[var(--text-sub)]">{opt.votes || 0}표 ({percent}%)</span>
                          </div>
                          <div className="w-full bg-[var(--background)] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[var(--accent)] h-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 추천 / 비추천 리액션 바 */}
            <div className="px-5 py-3 bg-[var(--inner-box)]/50 border-t border-[var(--panel-border)] flex items-center justify-center gap-3">
              <button 
                onClick={() => handleReaction('like')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.75rem] font-bold border transition ${
                  selectedNotice.userReaction === 'like'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                    : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)]'
                }`}
              >
                <span>👍 추천</span>
                <span className="font-mono">{selectedNotice.likes || 0}</span>
              </button>
              <button 
                onClick={() => handleReaction('dislike')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.75rem] font-bold border transition ${
                  selectedNotice.userReaction === 'dislike'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:bg-[var(--panel-hover)]'
                }`}
              >
                <span>👎 비추천</span>
                <span className="font-mono">{selectedNotice.dislikes || 0}</span>
              </button>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
              <span 
                className="w-4 h-4 bg-[var(--text-main)] shrink-0 inline-block opacity-85" 
                style={{
                  maskImage: 'url("/svgs/UI mark/채팅 마크.svg")',
                  WebkitMaskImage: 'url("/svgs/UI mark/채팅 마크.svg")',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center'
                }}
              />
              <h3 className="text-sm font-bold text-[var(--text-main)]">댓글</h3>
            </div>

            <div className="space-y-2">
              {commentsTree.length === 0 ? (
                <p className="text-[0.75rem] text-[var(--text-sub)] text-center py-4">첫 번째 댓글을 남겨보세요!</p>
              ) : (
                commentsTree.map((comment) => renderCommentNode(comment, 0))
              )}
            </div>

            <div className="pt-3 border-t border-[var(--panel-border)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[0.7rem] font-semibold text-[var(--text-sub)]">
                <span>작성자: <span className="text-[var(--text-main)]">{currentNickname}</span></span>
              </div>
              <textarea 
                placeholder="댓글을 남겨주세요..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-3 text-[0.85rem] text-[var(--text-main)] outline-none focus:border-[var(--accent)] resize-none"
              />
              <div className="flex justify-end">
                <button onClick={() => handleAddComment(null)} className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-4 py-1.5 rounded-lg transition shadow-sm">
                  등록
                </button>
              </div>
            </div>
          </div>

          {/* 최근 공지사항 빠른 이동 */}
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 md:p-5 space-y-3">
            <div className="text-[0.8rem] font-bold text-[var(--text-main)] flex items-center justify-between">
              <span>📋 최근 공지사항 빠른 이동</span>
              <span className="text-[0.7rem] font-normal text-[var(--text-sub)]">클릭 시 즉시 이동</span>
            </div>
            <div className="divide-y divide-[var(--panel-border)] border border-[var(--panel-border)] rounded-lg overflow-hidden bg-[var(--inner-box)]/30">
              {recentNoticesList.length === 0 ? (
                <div className="p-3 text-center text-[0.75rem] text-[var(--text-sub)]">다른 게시물이 없습니다.</div>
              ) : (
                recentNoticesList.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => openNotice(n)}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--panel-hover)] cursor-pointer transition-colors text-[0.8rem]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`text-[0.7rem] font-bold shrink-0 ${getBadgeStyle(n.type, n.is_pinned)}`}>{n.is_pinned ? "필독" : n.type}</span>
                      <span className="text-[var(--text-main)] truncate font-medium">{n.title}</span>
                    </div>
                    <span className="text-[0.7rem] text-[var(--text-sub)] shrink-0 ml-3">{formatNoticeDate(n.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ==============================================================================
          3. 자체 구축 "Sanctum Rich Editor"
          ============================================================================== */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[var(--background)] min-h-screen animate-in fade-in duration-150 overflow-y-auto pb-16">
          <div className="max-w-[1200px] mx-auto px-4 py-5 space-y-3">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--panel-border)] pb-3 gap-3">
              <h1 className="text-lg font-bold text-[var(--text-main)]">새 공지 작성</h1>
              
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button onClick={handleSaveDraft} className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition">
                  임시저장
                </button>
                <button onClick={() => setIsWriteModalOpen(false)} className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition">
                  취소
                </button>
                <button onClick={handleSubmit} className="flex-1 sm:flex-none bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-5 py-1.5 rounded-lg transition shadow">
                  작성완료
                </button>
              </div>
            </header>

            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm flex flex-col">
              <div className="bg-[var(--inner-box)] border-b border-[var(--panel-border)] p-3 flex flex-wrap items-center gap-1.5">
                {CATEGORIES.filter(c => c !== "전체").map(cat => (
                  <button
                    key={cat} onClick={() => setNewNotice({...newNotice, type: cat, link: LINK_ONLY_CATEGORIES.includes(cat) ? newNotice.link : ""})}
                    disabled={(cat.includes("생텀") && !isMaster && !cat.includes("가이드"))}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-bold transition border ${newNotice.type === cat ? "bg-[var(--text-main)] text-[var(--panel)] border-[var(--text-main)]" : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:border-[var(--text-sub)] disabled:opacity-30"}`}
                  >
                    {cat}
                  </button>
                ))}
                <label className="ml-auto flex items-center gap-1.5 cursor-pointer group px-2">
                  <input type="checkbox" checked={newNotice.isPinned} onChange={(e) => setNewNotice({...newNotice, isPinned: e.target.checked})} className="w-3.5 h-3.5 rounded cursor-pointer accent-red-500" />
                  <span className="text-[0.75rem] font-bold text-[var(--text-sub)] group-hover:text-[var(--text-main)]">📌 필독</span>
                </label>
              </div>

              <input type="text" placeholder="제목을 입력하세요" value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} className="w-full bg-[var(--panel)] text-[var(--text-main)] text-[0.95rem] font-bold px-4 py-3 border-b border-[var(--panel-border)] focus:outline-none placeholder-[var(--text-sub)]/50" />
              
              {LINK_ONLY_CATEGORIES.includes(newNotice.type) ? (
                <div className="p-4 flex flex-col gap-1.5 bg-[var(--inner-box)] min-h-[200px]">
                  <label className="text-[0.8rem] font-bold text-[var(--text-main)]">🔗 외부 이동 URL 링크</label>
                  <input type="url" placeholder="https://..." value={newNotice.link || ""} onChange={(e) => setNewNotice({...newNotice, link: e.target.value})} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-main)] focus:border-[var(--accent)] outline-none" />
                </div>
              ) : (
                <div className="flex flex-col flex-1 relative">
                  <div className="flex items-center flex-wrap gap-1.5 px-3 py-2 bg-[#252528] border-b border-[var(--panel-border)] text-zinc-300 relative z-10" onMouseDown={e => e.preventDefault()}>
                    <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden">
                      <button onClick={() => executeCommand("bold")} className="w-7 h-7 font-serif font-black hover:bg-zinc-700 transition text-[0.75rem]">B</button>
                      <button onClick={() => executeCommand("italic")} className="w-7 h-7 font-serif italic hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem]">i</button>
                      <button onClick={() => executeCommand("underline")} className="w-7 h-7 font-serif underline hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem]">U</button>
                      <button onClick={() => executeCommand("strikeThrough")} className="w-7 h-7 font-serif line-through hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem]">S</button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <button onClick={() => setActivePopover(activePopover === "fontSize" ? null : "fontSize")} className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.7rem] font-bold">크기 <span className="text-[0.6rem]">▼</span></button>
                        {activePopover === "fontSize" && (
                          <div className="absolute top-full mt-1 left-0 bg-[#1c1c1e] border border-zinc-700 rounded shadow-xl w-16 max-h-40 overflow-y-auto flex flex-col py-1 z-50">
                            {FONT_SIZES.map((sz: number) => (
                              <button key={sz} onClick={() => applyFontSize(sz)} className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-zinc-700 text-white">{sz}px</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button onClick={() => setActivePopover(activePopover === "lineHeight" ? null : "lineHeight")} className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.7rem] font-bold">간격 <span className="text-[0.6rem]">▼</span></button>
                        {activePopover === "lineHeight" && (
                          <div className="absolute top-full mt-1 left-0 bg-[#1c1c1e] border border-zinc-700 rounded shadow-xl w-16 flex flex-col py-1 z-50">
                            {LINE_HEIGHTS.map((lh: number) => (
                              <button key={lh} onClick={() => applyLineHeight(lh)} className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-zinc-700 text-white">{lh}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-zinc-700 pl-2">
                      <button onClick={() => setActivePopover(activePopover === "table" ? null : "table")} className="flex items-center justify-center w-7 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.75rem]" title="표">🔲</button>
                      {activePopover === "table" && (
                        <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded shadow-xl p-3 z-50 flex flex-col items-center w-[200px]">
                          <span className="text-[0.7rem] font-bold text-[#3498db] mb-2">{tableGrid.r > 0 ? `${tableGrid.r}x${tableGrid.c}` : "행x열"}</span>
                          <div className="grid grid-cols-10 gap-0.5" onMouseLeave={() => setTableGrid({r:0, c:0})}>
                            {Array.from({length: 10}).map((_, r) => (
                              Array.from({length: 10}).map((_, c) => (
                                <div key={`${r}-${c}`} onMouseEnter={() => setTableGrid({r:r+1, c:c+1})} onClick={() => handleTableInsert(r+1, c+1)} 
                                     className={`w-3.5 h-3.5 border cursor-pointer ${r < tableGrid.r && c < tableGrid.c ? 'bg-[#3498db]/40 border-[#3498db]' : 'border-zinc-600'}`} />
                              ))
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => setActivePopover(activePopover === "symbol" ? null : "symbol")} className="flex items-center justify-center w-7 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.75rem] text-white" title="특수문자">Ω</button>
                      {activePopover === "symbol" && (
                        <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded shadow-xl w-[280px] p-2 z-50 grid grid-cols-10 gap-1 h-48 overflow-y-auto">
                          {SPECIAL_CHARS.map(char => (
                            <button key={char} onClick={() => insertCustomHTML(char)} className="w-6 h-6 flex items-center justify-center bg-[#1c1c1e] border border-zinc-700 hover:bg-zinc-600 rounded text-[0.75rem] text-white">{char}</button>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setIsPollModalOpen(true)} className="flex items-center gap-1.5 px-3 h-7 bg-[#1c1c1e] border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded text-[0.7rem] font-bold">
                        📊 투표
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    onKeyDown={handleKeyDown}
                    onClick={() => setActivePopover(null)}
                    className="w-full flex-1 min-h-[300px] p-4 bg-[var(--panel)] text-[0.95rem] leading-[1.65] text-[var(--text-main)] outline-none custom-scrollbar prose-editor"
                    data-placeholder="내용을 작성해주세요..."
                    style={{ minHeight: "300px" }}
                  />
                  
                  {isPollModalOpen && (
                    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-[#252528] border border-zinc-700 rounded-xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-zinc-700 pb-2.5">
                          <h3 className="text-sm font-bold text-white">📊 투표 생성</h3>
                          <button onClick={() => setIsPollModalOpen(false)} className="text-zinc-400 hover:text-white text-lg">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">투표 주제</label>
                            <input type="text" placeholder="예: 레이드 시간" value={pollForm.title} onChange={e => setPollForm({...pollForm, title: e.target.value})} className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none" />
                          </div>
                          
                          <div className="flex items-center justify-between p-2.5 bg-[#1c1c1e] border border-zinc-700 rounded-lg">
                            <div>
                              <span className="text-[0.8rem] font-bold text-white block">익명 투표</span>
                              <span className="text-[0.65rem] text-zinc-400">비활성화 시 닉네임 공개</span>
                            </div>
                            <input type="checkbox" checked={pollForm.isAnonymous} onChange={e => setPollForm({...pollForm, isAnonymous: e.target.checked})} className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]" />
                          </div>

                          <div>
                            <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">선택 항목</label>
                            <div className="space-y-1.5 mb-2">
                              {pollForm.options.map((opt, idx) => (
                                <input key={opt.id} type="text" placeholder={`선택 ${idx+1}`} value={opt.text} onChange={e => {
                                  const newOpts = [...pollForm.options];
                                  newOpts[idx].text = e.target.value;
                                  setPollForm({...pollForm, options: newOpts});
                                }} className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none" />
                              ))}
                            </div>
                            <button onClick={() => setPollForm({...pollForm, options: [...pollForm.options, {id: `opt-${Date.now()}`, text:"", votes:0, voters:[]}]})} className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[0.75rem] font-bold rounded border border-zinc-700">+ 항목 추가</button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">복수 선택</label>
                              <select onChange={e => setPollForm({...pollForm, allowMultiple: e.target.value==="multi"})} className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none">
                                <option value="single">단일 선택</option>
                                <option value="multi">복수 허용</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">기간</label>
                              <select onChange={e => setPollForm({...pollForm, endDate: e.target.value})} className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none">
                                <option value="1일">1일</option>
                                <option value="3일">3일</option>
                                <option value="7일">7일</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <button onClick={insertPoll} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] font-black py-2.5 rounded text-[0.8rem] shadow-md mt-2">에디터에 삽입</button>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 스타일 주입 */}
      <style dangerouslySetInnerHTML={{__html: `
        .prose-editor table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--panel-border); }
        .prose-editor td { border: 1px solid var(--panel-border); padding: 8px 12px; overflow-wrap: break-word; word-break: break-all; min-width: 48px; }
        .prose-editor [contenteditable=true]:empty:before { content: attr(data-placeholder); color: var(--text-sub); opacity: 0.5; cursor: text; }
      `}} />
    </main>
  );
}