"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
  "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "🔥", "✨", "🌟", "⭐", "🎉", "🎊", "🎈", "🎁", "🏆", "💯"
];

// 대댓글 컴포넌트
function CommentItem({ comment, guide, onReplySubmit, onLike }: any) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-3 relative">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-[#e6c788]">{comment.title_name}</span>
          <span className="text-xs font-bold text-white">{comment.author}</span>
          <span className="text-[10px] text-zinc-500">{comment.timestamp}</span>
        </div>
      </div>
      <p className="text-sm text-zinc-300 pl-1 whitespace-pre-wrap">{comment.content}</p>
      <div className="flex gap-4 text-xs font-bold text-zinc-500">
        <button onClick={() => onLike(comment.id)} className="hover:text-pink-400">❤️ {comment.likes || 0}</button>
        <button onClick={() => setShowReplyInput(!showReplyInput)} className="hover:text-white">답글달기</button>
      </div>

      {/* 대댓글 입력창 */}
      {showReplyInput && (
        <div className="flex flex-col gap-2 ml-6 mt-2 bg-[#121212] p-3 rounded-xl border border-zinc-700 relative">
          <textarea 
            value={replyText} 
            onChange={e => setReplyText(e.target.value)}
            placeholder="데이터베이스 관리 목적상 텍스트와 이모지만 가능합니다."
            className="w-full bg-transparent border-none text-xs text-white outline-none resize-none h-16"
          />

          {/* 자체 이모지 팔레트 팝업 (닫기 버튼 추가) */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 right-3 bg-[#1c1c1e] border border-zinc-700 p-3 rounded-xl shadow-2xl z-50 w-72">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400">이모지 선택</span>
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-zinc-400 hover:text-white text-xs font-black px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {EMOJI_LIST.map((emoji, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded text-sm transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              😀 이모지
            </button>
            <button 
              onClick={() => {
                if (!replyText.trim()) return;
                onReplySubmit(comment.id, replyText);
                setReplyText("");
                setShowReplyInput(false);
                setShowEmojiPicker(false);
              }} 
              className="bg-[#e6c788] hover:bg-yellow-500 text-[#121212] px-4 py-1.5 rounded-lg text-xs font-black transition shadow-lg"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* 대대대...댓글 무한 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 space-y-3 pl-4 border-l-2 border-zinc-800">
          {comment.replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              guide={guide} 
              onReplySubmit={onReplySubmit} 
              onLike={onLike} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GnosisDetailPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [guide, setGuide] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [params.id]);

  const loadData = () => {
    const localData = localStorage.getItem('gnosis_mock_db');
    if (localData) {
      const parsedData = JSON.parse(localData);
      const foundGuide = parsedData.find((g: any) => g.id.toString() === params.id?.toString());
      if (foundGuide) {
        if (!foundGuide.comments) foundGuide.comments = [];
        setGuide(foundGuide);
      }
    }
  };

  const saveToLocalStorage = (updatedGuide: any) => {
    const localData = localStorage.getItem('gnosis_mock_db');
    const parsedData = JSON.parse(localData || '[]');
    const newData = parsedData.map((g: any) => g.id === updatedGuide.id ? updatedGuide : g);
    localStorage.setItem('gnosis_mock_db', JSON.stringify(newData));
    setGuide(updatedGuide);
  };

  const countTotalComments = (comments: any[]): number => {
    if (!comments) return 0;
    let count = comments.length;
    for (const c of comments) {
      if (c.replies && c.replies.length > 0) {
        count += countTotalComments(c.replies);
      }
    }
    return count;
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author: "한설",
      title_name: "성역 길드마스터",
      content: commentText,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      replies: []
    };
    saveToLocalStorage({ ...guide, comments: [...(guide.comments || []), newComment] });
    setCommentText("");
    setShowMainEmojiPicker(false);
  };

  const addReplyRecursively = (commentList: any[], targetId: number, newReply: any): any[] => {
    return commentList.map(c => {
      if (c.id === targetId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: addReplyRecursively(c.replies, targetId, newReply) };
      }
      return c;
    });
  };

  const handleReplySubmit = (targetCommentId: number, text: string) => {
    const newReply = {
      id: Date.now(),
      author: "한설",
      title_name: "성역 길드마스터",
      content: text,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      replies: []
    };
    const updatedComments = addReplyRecursively(guide.comments, targetCommentId, newReply);
    saveToLocalStorage({ ...guide, comments: updatedComments });
  };

  const handleLikeRecursively = (commentList: any[], targetId: number): any[] => {
    return commentList.map(c => {
      if (c.id === targetId) {
        return { ...c, likes: (c.likes || 0) + 1 };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: handleLikeRecursively(c.replies, targetId) };
      }
      return c;
    });
  };

  const handleCommentLike = (commentId: number) => {
    const updatedComments = handleLikeRecursively(guide.comments, commentId);
    saveToLocalStorage({ ...guide, comments: updatedComments });
  };

  const handleMainEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    setShowMainEmojiPicker(false);
  };

  if (!mounted || !guide) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pt-8 pb-20">
      <div className="max-w-[900px] mx-auto p-4 md:p-8 space-y-6">
        
        <button onClick={() => window.close()} className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-2">
          <span>←</span> 현재 창 닫기
        </button>

        <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-zinc-800 bg-[#1a1a1c]">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-snug mb-6">{guide.title}</h1>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm border border-zinc-600">👤</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#e6c788]">{guide.title_name}</span>
                  <span className="text-sm font-bold text-white">{guide.author}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 min-h-[300px] text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap">
            {guide.youtube_id && (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-8 shadow-lg border border-zinc-700">
                <iframe src={`https://www.youtube.com/embed/${guide.youtube_id}?mute=1`} className="w-full h-full" allowFullScreen></iframe>
              </div>
            )}
            <p className={`${guide.is_spoiler ? 'blur-md hover:blur-none transition-all' : ''}`}>{guide.content}</p>
          </div>

          {/* 댓글 영역 */}
          <div className="p-6 md:p-8 bg-[#1a1a1c] border-t border-zinc-800">
            <h3 className="text-sm font-black text-white mb-4">댓글 {countTotalComments(guide.comments)}</h3>
            
            {/* 메인 댓글 입력창 */}
            <div className="flex gap-2 mb-8 bg-[#121212] border border-zinc-700 rounded-xl p-3 relative">
              <textarea 
                value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="데이터베이스 관리 목적상 텍스트와 이모지만 가능합니다."
                className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none resize-none h-20"
              />

              {/* 자체 이모지 팔레트 팝업 (메인 - 닫기 버튼 추가) */}
              {showMainEmojiPicker && (
                <div className="absolute bottom-16 right-3 bg-[#1c1c1e] border border-zinc-700 p-3 rounded-xl shadow-2xl z-50 w-72">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                    <span className="text-[11px] font-bold text-zinc-400">이모지 선택</span>
                    <button 
                      type="button"
                      onClick={() => setShowMainEmojiPicker(false)}
                      className="text-zinc-400 hover:text-white text-xs font-black px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {EMOJI_LIST.map((emoji, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => handleMainEmojiSelect(emoji)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded text-sm transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 justify-between">
                <button 
                  type="button"
                  onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap"
                >
                  😀 이모지
                </button>
                <button 
                  type="button"
                  onClick={handleCommentSubmit} 
                  className="bg-[#e6c788] text-[#121212] font-black px-5 py-2 rounded-lg hover:bg-yellow-500 shadow-lg transition"
                >
                  등록
                </button>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {(guide.comments || []).map((c: any) => (
                <CommentItem 
                  key={c.id} 
                  comment={c} 
                  guide={guide} 
                  onReplySubmit={handleReplySubmit} 
                  onLike={handleCommentLike} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}