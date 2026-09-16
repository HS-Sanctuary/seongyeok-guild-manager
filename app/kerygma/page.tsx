"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Notice, CommentItem, LINK_ONLY_CATEGORIES } from "@/types/kerygma";
import KerygmaHeader from "@/components/kerygma/KerygmaHeader";
import KerygmaCategoryTabs from "@/components/kerygma/KerygmaCategoryTabs";
import KerygmaTableList from "@/components/kerygma/KerygmaTableList";
import KerygmaReaderView from "@/components/kerygma/KerygmaReaderView";

export default function KerygmaPage() {
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

  const formatNoticeDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yy = String(d.getFullYear()).slice(2);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return `${yy}. ${mm}. ${dd}.`;
  };

  const getBadgeStyle = (type: string, isPinned: boolean) => {
    if (isPinned) return "text-red-400 font-semibold";
    switch (type) {
      case "생텀 가이드":
        return "text-purple-400";
      case "모비노기 공식":
        return "text-blue-400";
      case "생텀 업데이트":
        return "text-emerald-400";
      case "길드 이벤트":
        return "text-amber-400";
      default:
        return "text-[var(--accent)]";
    }
  };

  const buildCommentsTree = (flatComments: CommentItem[]) => {
    const map = new Map<number, CommentItem>();
    const roots: CommentItem[] = [];
    flatComments.forEach((c) => map.set(c.id, { ...c, children: [] }));
    flatComments.forEach((c) => {
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
    const allComments: CommentItem[] = JSON.parse(
      localStorage.getItem("sanctum_notice_comments") || "[]"
    );
    const noticeComments = allComments.filter((c) => c.notice_id === noticeId);
    setCommentsTree(buildCommentsTree(noticeComments));
  };

  const fetchNotices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("notices").select("*");
    const localData = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
    let combined: Notice[] = !error && data ? [...data] : [];
    combined = [...combined, ...localData].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setNotices(combined);

    // 🎯 [작성 완료 직후 바로 보기 자동 바인딩] URL 쿼리 파라미터 id 체크
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("id");
      if (targetId) {
        const found = combined.find((n) => String(n.id) === String(targetId));
        if (found) {
          setSelectedNotice(found);
          loadComments(found.id);
        }
      }
    }

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
  const isSubMaster =
    user?.role === "부길드마스터" || user?.role === "부마스터" || user?.role === "admin";
  const canWriteNotice = isMaster || isSubMaster;

  const togglePin = async (id: number, currentPinned: boolean) => {
    if (!canWriteNotice) return;
    const mockDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
    const updated = mockDb.map((n) => (n.id === id ? { ...n, is_pinned: !currentPinned } : n));
    localStorage.setItem("notices_mock_db", JSON.stringify(updated));
    if (selectedNotice && selectedNotice.id === id)
      setSelectedNotice({ ...selectedNotice, is_pinned: !currentPinned });
    await supabase.from("notices").update({ is_pinned: !currentPinned }).eq("id", id);
    fetchNotices();
  };

  const deleteNotice = async (id: number) => {
    if (!canWriteNotice) return;
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    const mockDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
    localStorage.setItem(
      "notices_mock_db",
      JSON.stringify(mockDb.filter((n) => n.id !== id))
    );
    await supabase.from("notices").delete().eq("id", id);
    setSelectedNotice(null);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/kerygma");
    }
    fetchNotices();
  };

  const openNotice = (notice: Notice) => {
    if (LINK_ONLY_CATEGORIES.includes(notice.type) && notice.link) {
      window.open(notice.link, "_blank");
      return;
    }
    setSelectedNotice(notice);
    loadComments(notice.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddComment = (parentId: number | null = null) => {
    if (!selectedNotice) return;
    const text = parentId === null ? newCommentText : replyText;
    if (!text.trim()) return;

    const allComments: CommentItem[] = JSON.parse(
      localStorage.getItem("sanctum_notice_comments") || "[]"
    );
    const newEntry: CommentItem = {
      id: Date.now(),
      notice_id: selectedNotice.id,
      author: currentNickname,
      content: text.trim(),
      created_at: new Date().toISOString(),
      parent_id: parentId,
    };

    const updated = [...allComments, newEntry];
    localStorage.setItem("sanctum_notice_comments", JSON.stringify(updated));

    if (parentId === null) setNewCommentText("");
    else {
      setReplyingTo(null);
      setReplyText("");
    }
    loadComments(selectedNotice.id);
  };

  const handleReaction = (type: "like" | "dislike") => {
    if (!selectedNotice) return;
    const currentReaction = selectedNotice.userReaction;
    let newLikes = selectedNotice.likes || 0;
    let newDislikes = selectedNotice.dislikes || 0;
    let newReaction: "like" | "dislike" | null = type;

    if (currentReaction === type) {
      newReaction = null;
      if (type === "like") newLikes = Math.max(0, newLikes - 1);
      else newDislikes = Math.max(0, newDislikes - 1);
    } else {
      if (currentReaction === "like") newLikes = Math.max(0, newLikes - 1);
      if (currentReaction === "dislike") newDislikes = Math.max(0, newDislikes - 1);
      if (type === "like") newLikes += 1;
      else newDislikes += 1;
    }

    const updatedNotice = {
      ...selectedNotice,
      likes: newLikes,
      dislikes: newDislikes,
      userReaction: newReaction,
    };
    setSelectedNotice(updatedNotice);
    setNotices((prev) => prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n)));
    const mockDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
    localStorage.setItem(
      "notices_mock_db",
      JSON.stringify(mockDb.map((n) => (n.id === updatedNotice.id ? updatedNotice : n)))
    );
  };

  const handleVoteOption = (optionId: string) => {
    if (!selectedNotice || !selectedNotice.poll) return;
    const poll = selectedNotice.poll;
    const userVotes = poll.userVotes || [];
    let updatedVotes = [...userVotes];

    if (poll.allowMultiple) {
      if (updatedVotes.includes(optionId))
        updatedVotes = updatedVotes.filter((id) => id !== optionId);
      else updatedVotes.push(optionId);
    } else {
      updatedVotes = [optionId];
    }

    const updatedOptions = poll.options.map((opt) => {
      let voters = (opt.voters || []).filter((v) => v !== currentNickname);
      if (updatedVotes.includes(opt.id)) voters.push(currentNickname);
      return { ...opt, votes: voters.length, voters };
    });

    const updatedNotice = {
      ...selectedNotice,
      poll: { ...poll, options: updatedOptions, userVotes: updatedVotes },
    };
    setSelectedNotice(updatedNotice);
    setNotices((prev) => prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n)));
  };

  const filteredList = notices.filter(
    (n) => activeCategory === "전체" || n.type === activeCategory
  );
  const recentNoticesList = notices
    .filter((n) => n.id !== selectedNotice?.id)
    .slice(0, 8);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 pt-4 overflow-x-hidden">
      {/* 1. 메인 리스트 뷰 */}
      <div
        className={`max-w-[1400px] mx-auto px-4 md:px-6 space-y-4 transition-all duration-300 ${
          selectedNotice
            ? "opacity-0 pointer-events-none h-0 overflow-hidden"
            : "opacity-100"
        }`}
      >
        <KerygmaHeader />

        <KerygmaCategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          canWriteNotice={canWriteNotice}
        />

        <KerygmaTableList
          isLoading={isLoading}
          notices={filteredList}
          onOpenNotice={openNotice}
          formatNoticeDate={formatNoticeDate}
          getBadgeStyle={getBadgeStyle}
        />
      </div>

      {/* 2. 리더(Reader) 뷰 */}
      {selectedNotice && (
        <KerygmaReaderView
          selectedNotice={selectedNotice}
          onCloseReader={() => {
            setSelectedNotice(null);
            if (typeof window !== "undefined") {
              window.history.replaceState({}, "", "/kerygma");
            }
          }}
          canWriteNotice={canWriteNotice}
          onTogglePin={togglePin}
          onDeleteNotice={deleteNotice}
          getBadgeStyle={getBadgeStyle}
          formatNoticeDate={formatNoticeDate}
          onVoteOption={handleVoteOption}
          onReaction={handleReaction}
          commentsTree={commentsTree}
          currentNickname={currentNickname}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          onAddComment={handleAddComment}
          recentNoticesList={recentNoticesList}
          onOpenNotice={openNotice}
        />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose-editor table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--panel-border); }
        .prose-editor td { border: 1px solid var(--panel-border); padding: 8px 12px; overflow-wrap: break-word; word-break: break-all; min-width: 48px; }
        .prose-editor [contenteditable=true]:empty:before { content: attr(data-placeholder); color: var(--text-sub); opacity: 0.5; cursor: text; }
      `,
        }}
      />
    </main>
  );
}