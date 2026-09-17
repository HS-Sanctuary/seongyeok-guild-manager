"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Notice, CommentItem, PollData } from "@/types/kerygma";

// 🎯 사전에 분리 작성해둔 케리그마 전용 서브 모듈 컴포넌트군 정식 조립
import KerygmaHeader from "@/components/kerygma/KerygmaHeader";
import KerygmaCategoryTabs from "@/components/kerygma/KerygmaCategoryTabs";
import KerygmaTableList from "@/components/kerygma/KerygmaTableList";
import KerygmaReaderView from "@/components/kerygma/KerygmaReaderView";
import KerygmaPollModal from "@/components/kerygma/KerygmaPollModal";

export default function KerygmaMainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeIdParam = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 댓글 상태 관리
  const [commentsTree, setCommentsTree] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // 투표 모달 상태 관리
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollForm, setPollForm] = useState<PollData>({
    title: "",
    isAnonymous: false,
    options: [
      { id: "opt-1", text: "", votes: 0, voters: [] },
      { id: "opt-2", text: "", votes: 0, voters: [] },
    ],
    allowMultiple: false,
    endDate: "1일",
  });

  const isMaster =
    user?.nickname === "한설" ||
    user?.role === "길드마스터" ||
    user?.role === "길드 마스터" ||
    user?.role === "마스터" ||
    user?.role === "admin";

  const isSubMaster =
    user?.role === "부길드마스터" ||
    user?.role === "부마스터" ||
    user?.role === "admin";

  const canWriteNotice = isMaster || isSubMaster;
  const currentNickname = user?.nickname || "방문자";

  // Supabase DB 게시글 조회
  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase notices fetch error:", error);
      } else if (data) {
        setNotices(data as Notice[]);
      }
    } catch (err) {
      console.error("Notices fetch exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchNotices();

    const channel = supabase
      .channel("public:notices")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notices" },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // URL ID 감지 및 읽기 모드 전환
  useEffect(() => {
    if (noticeIdParam && notices.length > 0) {
      const found = notices.find((n) => Number(n.id) === Number(noticeIdParam));
      if (found) {
        setSelectedNotice(found);
      } else {
        supabase
          .from("notices")
          .select("*")
          .eq("id", Number(noticeIdParam))
          .single()
          .then(({ data }) => {
            if (data) setSelectedNotice(data as Notice);
          });
      }
    } else {
      setSelectedNotice(null);
    }
  }, [noticeIdParam, notices]);

  // 필독 고정 토글
  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    if (!canWriteNotice) return alert("필독 고정 권한이 없습니다.");

    const { error } = await supabase
      .from("notices")
      .update({ is_pinned: !currentPinned })
      .eq("id", id);

    if (error) {
      alert(`고정 변경 실패: ${error.message}`);
    } else {
      fetchNotices();
    }
  };

  // 공지 삭제
  const handleDeleteNotice = async (id: number) => {
    if (!canWriteNotice) return alert("삭제 권한이 없습니다.");
    if (!confirm("정말 이 공지글을 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
    } else {
      alert("공지글이 삭제되었습니다.");
      router.replace("/kerygma");
      fetchNotices();
    }
  };

  const handleOpenNotice = (notice: Notice) => {
    router.push(`/kerygma?id=${notice.id}`);
  };

  const handleCloseReader = () => {
    router.replace("/kerygma");
    setSelectedNotice(null);
  };

  // 투표 기능 연동
  const handleVoteOption = async (optionId: string) => {
    if (!selectedNotice || !selectedNotice.poll) return;

    const currentPoll = selectedNotice.poll;
    const userVotes = currentPoll.userVotes || [];
    let updatedVotes: string[] = [];

    if (currentPoll.allowMultiple) {
      if (userVotes.includes(optionId)) {
        updatedVotes = userVotes.filter((id) => id !== optionId);
      } else {
        updatedVotes = [...userVotes, optionId];
      }
    } else {
      updatedVotes = userVotes.includes(optionId) ? [] : [optionId];
    }

    const updatedOptions = currentPoll.options.map((opt) => {
      const wasVoted = userVotes.includes(opt.id);
      const isNowVoted = updatedVotes.includes(opt.id);

      let votesCount = opt.votes || 0;
      if (!wasVoted && isNowVoted) votesCount += 1;
      if (wasVoted && !isNowVoted) votesCount = Math.max(0, votesCount - 1);

      return { ...opt, votes: votesCount };
    });

    const updatedPoll = {
      ...currentPoll,
      options: updatedOptions,
      userVotes: updatedVotes,
    };

    const { error } = await supabase
      .from("notices")
      .update({ poll: updatedPoll })
      .eq("id", selectedNotice.id);

    if (!error) {
      setSelectedNotice({ ...selectedNotice, poll: updatedPoll });
    }
  };

  // 좋아요 연동
  const handleReaction = async (type: "like" | "dislike") => {
    if (!selectedNotice) return;

    const currentLikes = selectedNotice.likes || 0;
    const isAlreadyLiked = selectedNotice.userReaction === "like";
    const newLikes = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newReaction = isAlreadyLiked ? null : "like";

    const { error } = await supabase
      .from("notices")
      .update({ likes: newLikes })
      .eq("id", selectedNotice.id);

    if (!error) {
      setSelectedNotice({
        ...selectedNotice,
        likes: newLikes,
        userReaction: newReaction,
      });
    }
  };

  // 댓글 등록
  const handleAddComment = (parentId: number | null = null) => {
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return alert("댓글 내용을 입력해주세요.");

    const newComment: CommentItem = {
      id: Date.now(),
      author: currentNickname,
      content: text,
      created_at: new Date().toISOString(),
      parentId: parentId || undefined,
    };

    if (parentId) {
      setCommentsTree((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, children: [...(c.children || []), newComment] }
            : c
        )
      );
      setReplyText("");
      setReplyingTo(null);
    } else {
      setCommentsTree((prev) => [...prev, newComment]);
      setNewCommentText("");
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (selectedCategory === "전체") return true;
    return n.type === selectedCategory;
  });

  const formatNoticeDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return `${yy}. ${mm}. ${dd}.`;
  };

  const getBadgeStyle = (type: string, isPinned: boolean) => {
    if (isPinned) {
      return "bg-rose-950/80 border-rose-500/70 text-rose-300 font-extrabold shadow-xs";
    }
    return "bg-purple-950/60 border-purple-500/60 text-purple-300 font-bold";
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] sm:min-h-[calc(100vh-5rem)] bg-[var(--background)] text-[var(--text-main)] p-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto space-y-3 sm:space-y-3.5">
        
        {/* 1. 크로노스 동기화 인라인 헤더 모듈 */}
        <KerygmaHeader />

        {/* 2. 본문 컨텐츠 (ReaderView vs TableList) */}
        {selectedNotice ? (
          <KerygmaReaderView
            selectedNotice={selectedNotice}
            onCloseReader={handleCloseReader}
            canWriteNotice={canWriteNotice}
            onTogglePin={handleTogglePin}
            onDeleteNotice={handleDeleteNotice}
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
            recentNoticesList={notices.slice(0, 5)}
            onOpenNotice={handleOpenNotice}
          />
        ) : (
          <div className="space-y-3">
            {/* 2-1. 카테고리 탭 모듈 */}
            <KerygmaCategoryTabs
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              canWriteNotice={canWriteNotice}
            />

            {/* 2-2. 공지사항 테이블 리스트 모듈 */}
            <KerygmaTableList
              isLoading={loading}
              notices={filteredNotices}
              onOpenNotice={handleOpenNotice}
              formatNoticeDate={formatNoticeDate}
              getBadgeStyle={getBadgeStyle}
            />
          </div>
        )}

        {/* 3. 투표 모달 모듈 */}
        <KerygmaPollModal
          isOpen={isPollModalOpen}
          onClose={() => setIsPollModalOpen(false)}
          pollForm={pollForm}
          setPollForm={setPollForm}
          onInsertPoll={() => setIsPollModalOpen(false)}
        />
      </div>
    </main>
  );
}