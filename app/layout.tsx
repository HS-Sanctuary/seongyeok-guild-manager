"use client";

import './globals.css'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 🟢 CHRONOS(캐릭터 관리)가 KERYGMA와 AGORA 사이에 추가된 그리스어 테마 메뉴
const navItems = [
  { en: 'KERYGMA', kr: '공지사항', path: '/notice' },
  { en: 'CHRONOS', kr: '캐릭터 관리', path: '/character' }, // 🟢 추가된 크로노스 메뉴
  { en: 'AGORA', kr: '라운지', path: '/lounge' },
  { en: 'EMPORION', kr: '거래소 정보', path: '/market' },
  { en: 'SYNAXIS', kr: '파티 매칭', path: '/party' },
  { en: 'GNOSIS', kr: '정보 공유', path: '/guide' },
  { en: 'LOGOS', kr: '문의/건의', path: '/support' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [banner, setBanner] = useState<any>(null);

  // 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 유저 정보 세팅 및 문의 알림 (10초 주기)
  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      if (parsedUser.nickname === "한설" || parsedUser.role === "마스터") {
        checkPendingInquiries();
        const interval = setInterval(checkPendingInquiries, 10000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const checkPendingInquiries = async () => {
    const { count, error } = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', '대기중');
    if (!error && count !== null) setPendingCount(count);
  };

  // 긴급 배너 실시간 동기화
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('nexus_banners')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error("배너 에러:", error);
          return;
        }

        if (data && data.length > 0) {
          const activeBanner = data.sort((a, b) => b.id - a.id)[0];
          setBanner(activeBanner);
        } else {
          setBanner(null);
        }
      } catch (err) {
        console.error("배너 로직 에러:", err);
      }
    };

    fetchBanner();
    const bannerInterval = setInterval(fetchBanner, 5000); 
    return () => clearInterval(bannerInterval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    window.location.href = "/login";
  };

  if (pathname === '/login') return <html lang="ko"><body>{children}</body></html>;

  const isAdmin = user?.nickname === "한설" || user?.role === "마스터";

  return (
    <html lang="ko">
      <body className="bg-[#121212] text-zinc-200 overflow-x-hidden">
        
        <nav className="sticky top-0 z-[9999] flex flex-col shadow-lg">
          
          {/* 🚨 긴급 배너 */}
          {banner && (
            <div className="w-full py-2.5 bg-red-600 text-white text-center text-sm font-black animate-pulse flex items-center justify-center gap-2 border-b border-red-800">
              <span className="text-lg">🚨</span>
              <span>{banner.message}</span>
              <span className="text-lg">🚨</span>
            </div>
          )}

          {/* 메인 헤더 바 */}
          <div className="border-b border-zinc-800 bg-[#1c1c1e] w-full">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                
                <div className="flex items-center gap-8">
                  {/* SANCTUM 로고 */}
                  <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity mr-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#e6c788] to-yellow-600 rounded flex items-center justify-center shadow-lg shadow-yellow-900/20">
                      <span className="text-black font-black text-sm tracking-tighter">SC</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-white leading-none tracking-wider drop-shadow-md">SANCTUM</span>
                      <span className="text-[9px] text-[#e6c788] font-bold tracking-widest mt-0.5 opacity-90">데이안 성역 길드</span>
                    </div>
                  </Link>

                  {/* 데스크톱 네비게이션 (마우스 오버 시 한글 설명 슬라이드 업) */}
                  <div className="hidden lg:flex space-x-1 xl:space-x-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <Link 
                          key={item.en} 
                          href={item.path} 
                          className={`group relative h-12 px-3 xl:px-4 rounded-md flex flex-col items-center justify-center transition-all ${
                            isActive 
                              ? 'bg-zinc-800/80 border-b-2 border-[#e6c788]' 
                              : 'hover:bg-zinc-800/50'
                          }`}
                        >
                          {/* 영단어 */}
                          <span className={`font-black tracking-widest text-xs xl:text-sm transition-transform duration-200 ${
                            isActive ? 'text-white -translate-y-2' : 'text-zinc-400 group-hover:text-white group-hover:-translate-y-2'
                          }`}>
                            {item.en}
                          </span>
                          
                          {/* 마우스 오버 시 아래에서 올라오는 한글 설명 */}
                          <span className="absolute bottom-1 text-[9px] font-bold text-[#e6c788] opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
                            {item.kr}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  {user ? (
                    <>
                      <span className="text-sm font-bold text-zinc-300"><span className="text-[#e6c788] mr-1">👑</span>{user.nickname}</span>
                      {isAdmin && (
                        <Link href="/admin" className="text-zinc-500 hover:text-[#e6c788] transition-colors p-1" title="SANCTUM 관리">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </Link>
                      )}
                      <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-1">로그아웃</button>
                    </>
                  ) : (
                    <Link href="/login" className="text-sm font-bold text-[#e6c788] hover:text-yellow-400">로그인</Link>
                  )}
                </div>
                
                {/* 모바일 햄버거 버튼 */}
                <div className="flex lg:hidden items-center">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 hover:text-white p-2 focus:outline-none transition-colors">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* 모바일 슬라이드 메뉴 */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[10000] transition-opacity lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <div className={`fixed top-0 right-0 h-full w-72 bg-[#1c1c1e] z-[10001] transform transition-transform duration-300 ease-in-out border-l border-zinc-800 shadow-2xl lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <span className="font-black text-[#e6c788] text-lg tracking-tight">SANCTUM MENU</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.en} 
                  href={item.path} 
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-white bg-zinc-800 border-l-4 border-[#e6c788]' 
                      : 'text-zinc-400 hover:text-white hover:bg-[#252528]'
                  }`}
                >
                  <span className="font-black text-sm tracking-wider">{item.en}</span>
                  <span className="text-xs font-bold text-[#e6c788] bg-black/30 px-2 py-0.5 rounded">{item.kr}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-5 border-t border-zinc-800 bg-[#252528]">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">👑</span><span className="text-base font-bold text-white">{user.nickname}</span>
                </div>
                {isAdmin && (
                  <Link href="/admin" className="w-full text-sm text-[#e6c788] hover:text-white transition-colors bg-yellow-900/20 hover:bg-yellow-900/40 px-4 py-2.5 rounded-lg border border-yellow-700/50 font-bold flex items-center justify-center gap-2">
                    <span>⚙️</span> SANCTUM 관리
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-lg border border-zinc-700 font-bold">로그아웃</button>
              </div>
            ) : (
              <Link href="/login" className="block w-full text-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg transition-colors">로그인</Link>
            )}
          </div>
        </div>

        {/* 본문 콘텐츠 렌더링 */}
        {children}

        {/* 문의사항 알림 아이콘 */}
        {isAdmin && pendingCount > 0 && (
          <Link href="/support">
            <div className="fixed bottom-8 right-8 bg-[#e6c788] hover:bg-yellow-500 text-[#121212] px-5 py-3 rounded-full shadow-[0_0_20px_rgba(230,199,136,0.4)] cursor-pointer transition transform hover:scale-105 flex items-center gap-3 z-[9999] animate-bounce">
              <span className="text-2xl">💌</span>
              <div className="flex flex-col">
                <span className="font-black text-sm">새로운 문의 도착!</span>
                <span className="text-xs font-bold opacity-80">답변 대기중: {pendingCount}건</span>
              </div>
            </div>
          </Link>
        )}
      </body>
    </html>
  );
}