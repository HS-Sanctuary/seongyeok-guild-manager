"use client";

import './globals.css'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const navItems = [
  { name: '공지사항', path: '/notice' },
  { name: '캐릭터 관리', path: '/character' },
  { name: '길드원 목록', path: '/members' },
  { name: '파티 매칭', path: '/party' },
  { name: '직업 공략', path: '/guide' },
  { name: '성역 랭킹', path: '/ranking' },
  { name: '문의/건의', path: '/support' },
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

  // 🟢 긴급 배너 실시간 동기화 (5초 주기) - 꼼수 없이 원초적으로 다 긁어와서 찾습니다!
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
          // 배열에서 가장 마지막에 추가된(id가 제일 큰) 배너를 무조건 선택
          const activeBanner = data.sort((a, b) => b.id - a.id)[0];
          setBanner(activeBanner);
        } else {
          setBanner(null);
        }
      } catch (err) {
        console.error("배너 로직 에러:", err);
      }
    };

    fetchBanner(); // 마운트 되자마자 1번 실행
    const bannerInterval = setInterval(fetchBanner, 5000); // 이후 5초마다 무한 갱신
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
        
        {/* 🟢 상단 네비게이션 자체를 통째로 관리하는 영역 */}
        <nav className="sticky top-0 z-[9999] flex flex-col shadow-lg">
          
          {/* 🚨 긴급 배너: Nav 영역 안쪽 제일 꼭대기에 강제 이식 (절대 안 가려짐) */}
          {banner && (
            <div className="w-full py-2.5 bg-red-600 text-white text-center text-sm font-black animate-pulse flex items-center justify-center gap-2 border-b border-red-800">
              <span className="text-lg">🚨</span>
              <span>{banner.message}</span>
              <span className="text-lg">🚨</span>
            </div>
          )}

          {/* 기존 메뉴 바 영역 */}
          <div className="border-b border-zinc-800 bg-[#1c1c1e] w-full">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="bg-[#2a2a2d] px-2 py-1 rounded"><span className="font-black text-[#e6c788] text-sm tracking-tighter">NX</span></div>
                    <span className="font-bold text-lg text-[#e6c788] tracking-tight">Sanctuary Nexus</span>
                  </Link>

                  <div className="hidden lg:flex space-x-1">
                    {navItems.map((item) => (
                      <Link key={item.name} href={item.path} className={`px-3 xl:px-4 py-2 rounded-md text-sm font-bold transition-colors ${pathname === item.path ? 'text-white border-b-2 border-[#e6c788] pb-[6px]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  {user ? (
                    <>
                      <span className="text-sm font-bold text-zinc-300"><span className="text-[#e6c788] mr-1">👑</span>{user.nickname}</span>
                      {isAdmin && (
                        <Link href="/admin" className="text-zinc-500 hover:text-[#e6c788] transition-colors p-1" title="넥서스 관리">
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

        <div className={`fixed top-0 right-0 h-full w-64 bg-[#1c1c1e] z-[10001] transform transition-transform duration-300 ease-in-out border-l border-zinc-800 shadow-2xl lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <span className="font-black text-[#e6c788] text-lg tracking-tight">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.path} className={`block px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === item.path ? 'text-white bg-zinc-800 border-l-4 border-[#e6c788]' : 'text-zinc-400 hover:text-white hover:bg-[#252528]'}`}>
                {item.name}
              </Link>
            ))}
          </div>

          <div className="p-5 border-t border-zinc-800 bg-[#252528]">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">👑</span><span className="text-base font-bold text-white">{user.nickname}</span>
                </div>
                {isAdmin && (
                  <Link href="/admin" className="w-full text-sm text-[#e6c788] hover:text-white transition-colors bg-yellow-900/20 hover:bg-yellow-900/40 px-4 py-2.5 rounded-lg border border-yellow-700/50 font-bold flex items-center justify-center gap-2">
                    <span>⚙️</span> 넥서스 관리
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