"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // 🟢 경로 수정 완료 (../ -> ../../)

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  category: string;
  likes: number;
  created_at: string;
}

export default function LoungePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("전체");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("자유");

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(savedUser));
      fetchPosts();
    }
  }, [router]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setPosts([
        { id: '1', title: '이번 주 일요일 CBT 다들 준비되셨나요?', content: '성역 길드원들 파이팅!', author_name: '한설', category: '공지', likes: 5, created_at: '2026-06-05' },
        { id: '2', title: '방금 어비스 구멍 2채널 컷했습니다 ㅎㅎ', content: '득템 기원 1일차', author_name: '영겁', category: '자유', likes: 2, created_at: '2026-06-05' }
      ]);
    } else if (data) {
      setPosts(data);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해주세요!');

    const { error } = await supabase.from('lounge_posts').insert([
      { title, content, author_name: user.nickname, category, likes: 0 }
    ]);

    if (error) {
      alert('게시글 등록 중 오류가 발생했습니다.');
    } else {
      alert('성공적으로 등록되었습니다!');
      setTitle('');
      setContent('');
      setIsWriting(false);
      fetchPosts();
    }
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-10 relative">
      
      {/* 🟢 라이트 모델이 넣었던 중복 글로벌 네비게이션(상단바) 삭제 완료 */}
      
      <div className="p-4 md:p-8 max-w-[1000px] mx-auto space-y-6">
        
        {/* 🟢 라운지 통합 서브 탭 (커뮤니티 / 캐릭터 관리 / 랭킹) */}
        <div className="flex gap-2 bg-[#1c1c1e] p-2 rounded-xl border border-zinc-800 shadow-md overflow-x-auto custom-scrollbar">
          <button className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-[#e6c788] text-black font-black text-sm transition shadow">
            💬 커뮤니티
          </button>
          <button onClick={() => router.push('/character')} className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-[#121212] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 font-bold text-sm transition">
            📋 캐릭터 관리
          </button>
          <button onClick={() => router.push('/ranking')} className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-[#121212] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 font-bold text-sm transition">
            🏆 성역 랭킹
          </button>
        </div>

        {/* 상단 타이틀 */}
        <header className="flex justify-between items-center bg-[#1c1c1e] border border-zinc-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              💬 성역 <span className="text-[#e6c788]">길드 라운지</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">길드원들과 자유롭게 소통하고 정보를 나누는 공간입니다.</p>
          </div>
          <button 
            onClick={() => setIsWriting(!isWriting)}
            className="bg-[#e6c788] hover:bg-yellow-500 text-black font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md"
          >
            {isWriting ? '목록으로' : '✏️ 글쓰기'}
          </button>
        </header>

        {/* 글쓰기 폼 영역 */}
        {isWriting ? (
          <section className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-white mb-4">새 게시글 작성</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-4">
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#121212] border border-zinc-700 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#e6c788]"
                >
                  <option value="자유">자유</option>
                  <option value="공지">공지</option>
                  <option value="정보">정보/공략</option>
                  <option value="질문">질문</option>
                </select>
                <input 
                  type="text" 
                  placeholder="제목을 입력하세요" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-[#121212] border border-zinc-700 text-white text-sm p-3 rounded-xl focus:outline-none focus:border-[#e6c788]"
                />
              </div>
              <textarea 
                placeholder="내용을 입력하세요..." 
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#121212] border border-zinc-700 text-white text-sm p-3 rounded-xl focus:outline-none focus:border-[#e6c788] resize-none"
              ></textarea>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsWriting(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="bg-[#e6c788] hover:bg-yellow-500 text-black px-6 py-2 rounded-xl text-xs font-black transition shadow"
                >
                  등록하기
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* 게시글 목록 영역 */
          <section className="space-y-4">
            <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto custom-scrollbar">
              {["전체", "자유", "공지", "정보", "질문"].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === tab ? 'bg-zinc-800 text-[#e6c788] border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {posts.filter(p => activeTab === '전체' || p.category === activeTab).map(post => (
                <div key={post.id} className="bg-[#1c1c1e] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition shadow flex justify-between items-center cursor-pointer">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${post.category === '공지' ? 'bg-amber-900/40 text-amber-400 border border-amber-700/50' : 'bg-zinc-800 text-zinc-400'}`}>
                        {post.category}
                      </span>
                      <h3 className="text-white font-bold text-sm">{post.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-xs line-clamp-1">{post.content}</p>
                  </div>
                  <div className="flex flex-col items-end text-[10px] text-zinc-500 space-y-1">
                    <span className="font-bold text-zinc-300">{post.author_name}</span>
                    <span>{post.created_at.split('T')[0]}</span>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-10 text-zinc-500 text-xs font-bold">
                  아직 등록된 게시글이 없습니다.
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e6c788; }
      `}} />
    </main>
  );
}