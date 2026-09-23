"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Notice, CommentItem, PollData } from "@/types/kerygma";

import KerygmaHeader from "@/components/kerygma/KerygmaHeader";
import KerygmaCategoryTabs from "@/components/kerygma/KerygmaCategoryTabs";
import KerygmaTableList from "@/components/kerygma/KerygmaTableList";
import KerygmaReaderView from "@/components/kerygma/KerygmaReaderView";
import KerygmaPollModal from "@/components/kerygma/KerygmaPollModal";

function KerygmaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeIdParam = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, { role?: string; equipped_title?: string; titles?: string[]; job?: string; main_class?: string }>>({});
  const [dbCharacters, setDbCharacters] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 댓글 상태 관리 (DB 연동)
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

  // DB 계정, 직업, 칭호 데이터 및 캐릭터 스탯 일괄 수집
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts/directory', { cache: 'no-store' });
      const { accounts: data } = await response.json();
      if (response.ok && data) {
        const map: Record<string, any> = {};
        data.forEach((acc: any) => {
          map[acc.nickname] = {
            role: acc.role,
            equipped_title: acc.equipped_title,
            titles: Array.isArray(acc.titles) ? acc.titles : typeof acc.titles === "string" ? [acc.titles] : [],
            job: acc.job || acc.main_class || "댄서",
          };
        });
        setAccountsMap(map);
      }
    } catch (err) {
      console.error("Accounts fetch exception:", err);
    }
  };

  // 판테온 칭호 실시간 연동용 캐릭터 스탯 수집
  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase.from("characters").select("*");
      if (!error && data) {
        const mappedData = data.map((c: any) => ({
          id: c.nickname,
          name: c.nickname,
          owner: c.owner || c.nickname,
          job: c.job || "전사",
          combatPower: Number(c.combat_power) || 0,
          magicResist: Number(c.magic_resistance) || 0,
          lifePower: Number(c.life_energy) || 0,
          charm: Number(c.charm) || 0,
          contribution: Number(c.contribution) || 0,
          isMain: c.is_main || false,
          rankings: c.rankings || {},
          serverRankOverall: c.rankings?.TELOS?.overall ?? c.server_rank_overall ?? 0,
          serverRankDeian: c.rankings?.TELOS?.deian ?? c.server_rank_deian ?? 0,
        }));
        setDbCharacters(mappedData);
      }
    } catch (err) {
      console.error("Characters fetch exception:", err);
    }
  };

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

    fetchAccounts();
    fetchCharacters();
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

  // 공지 선택 및 DB 댓글 트리 동기화
  useEffect(() => {
    if (noticeIdParam && notices.length > 0) {
      const found = notices.find((n) => Number(n.id) === Number(noticeIdParam));
      if (found) {
        setSelectedNotice(found);
        const rawComments = (found as any).comments || [];
        setCommentsTree(Array.isArray(rawComments) ? rawComments : []);
      } else {
        supabase
          .from("notices")
          .select("*")
          .eq("id", Number(noticeIdParam))
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              const n = data as Notice;
              setSelectedNotice(n);
              const rawComments = (n as any).comments || [];
              setCommentsTree(Array.isArray(rawComments) ? rawComments : []);
            }
          });
      }
    } else {
      setSelectedNotice(null);
      setCommentsTree([]);
    }
  }, [noticeIdParam, notices]);

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
    setCommentsTree([]);
  };

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

  // 대대대댓글 재귀 탐색 삽입
  const insertRecursive = (nodes: CommentItem[], targetParentId: number, newItem: CommentItem): CommentItem[] => {
    return nodes.map((node) => {
      if (node.id === targetParentId) {
        return {
          ...node,
          children: [...(node.children || []), newItem],
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: insertRecursive(node.children, targetParentId, newItem),
        };
      }
      return node;
    });
  };

  // 대대대댓글 재귀 삭제
  const deleteRecursive = (nodes: CommentItem[], targetId: number): CommentItem[] => {
    return nodes
      .filter((node) => node.id !== targetId)
      .map((node) => ({
        ...node,
        children: node.children ? deleteRecursive(node.children, targetId) : [],
      }));
  };

  // 댓글 / 답글 DB 연동 작성
  const handleAddComment = async (parentId: number | null = null) => {
    if (!selectedNotice) return;
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return alert("댓글 내용을 입력해주세요.");

    const newComment: CommentItem = {
      id: Date.now(),
      author: currentNickname,
      content: text,
      created_at: new Date().toISOString(),
      parentId: parentId || undefined,
      parent_id: parentId || null,
      children: [],
    };

    let updatedTree: CommentItem[] = [];

    if (parentId) {
      updatedTree = insertRecursive(commentsTree, parentId, newComment);
    } else {
      updatedTree = [...commentsTree, newComment];
    }

    const { error } = await supabase
      .from("notices")
      .update({ comments: updatedTree })
      .eq("id", selectedNotice.id);

    if (error) {
      console.error("댓글 DB 저장 실패:", error);
      alert(`⚠️ 댓글 DB 저장 실패: ${error.message}\n\nSupabase 'notices' 테이블에 'comments' (jsonb) 컬럼을 생성해 주셨는지 확인해 주세요!`);
      return;
    }

    setCommentsTree(updatedTree);
    setSelectedNotice({ ...selectedNotice, comments: updatedTree } as any);
    if (parentId) {
      setReplyText("");
      setReplyingTo(null);
    } else {
      setNewCommentText("");
    }
    fetchNotices();
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!selectedNotice) return;
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const updatedTree = deleteRecursive(commentsTree, commentId);

    const { error } = await supabase
      .from("notices")
      .update({ comments: updatedTree })
      .eq("id", selectedNotice.id);

    if (error) {
      alert(`댓글 삭제 실패: ${error.message}`);
      return;
    }

    setCommentsTree(updatedTree);
    setSelectedNotice({ ...selectedNotice, comments: updatedTree } as any);
    fetchNotices();
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
        <KerygmaHeader />

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
            commentsTree={commentsTree}
            accountsMap={accountsMap}
            dbCharacters={dbCharacters}
            currentNickname={currentNickname}
            newCommentText={newCommentText}
            setNewCommentText={setNewCommentText}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            recentNoticesList={notices.slice(0, 5)}
            onOpenNotice={handleOpenNotice}
          />
        ) : (
          <div className="space-y-3">
            <KerygmaCategoryTabs
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              canWriteNotice={canWriteNotice}
            />

            <KerygmaTableList
              isLoading={loading}
              notices={filteredNotices}
              onOpenNotice={handleOpenNotice}
              formatNoticeDate={formatNoticeDate}
              getBadgeStyle={getBadgeStyle}
            />
          </div>
        )}

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

export default function KerygmaMainPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center text-[var(--text-sub)] font-bold text-xs">
        📜 케리그마 시공간 동기화 중...
      </div>
    }>
      <KerygmaContent />
    </Suspense>
  );
}
