"use client";

import './globals.css'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // DB 연결 추가

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 햄버거 메뉴 상태

  // 🟢 메뉴 클릭해서 이동하면 열려있던 서랍 메뉴 자동 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      if (parsedUser.nickname === "한설") {
        checkPendingInquiries();
        const interval = setInterval(checkPendingInquiries, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [pathname]);

  const checkPendingInquiries = async () => {
    const { count, error } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', '대기중');
    
    if (!error && count !== null) {
      setPendingCount(count);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    window.location.href = "/login";
  };

  if (pathname === '/login') {
    return (
      <html lang="ko">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body className="bg-[#121212] text-zinc-200 overflow-x-hidden">
        <nav className="border-b border-zinc-800 bg-[#1c1c1e] sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-[#2a2a2d] px-2 py-1 rounded">
                    <span className="font-black text-[#e6c788] text-sm tracking-tighter">NX</span>
                  </div>
                  <span className="font-bold text-lg text-[#e6c788] tracking-tight">Sanctuary Nexus</span>
                </Link>

                {/* 🟢 데스크탑 전용 메뉴 (lg: 1024px 이상에서만 표시되도록 수정하여 깨짐 방지) */}
                <div className="hidden lg:flex space-x-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`px-3 xl:px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                        pathname === item.path
                          ? 'text-white border-b-2 border-[#e6c788] pb-[6px]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 데스크탑 전용 유저 정보 */}
              <div className="hidden lg:flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-sm font-bold text-zinc-300">
                      <span className="text-[#e6c788] mr-1">👑</span>{user.nickname}
                    </span>
                    <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="text-sm font-bold text-[#e6c788] hover:text-yellow-400">
                    로그인
                  </Link>
                )}
              </div>

              {/* 🟢 모바일 햄버거 버튼 (lg 미만 해상도에서 더 일찍 나타나도록 수정) */}
              <div className="flex lg:hidden items-center">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-zinc-400 hover:text-white p-2 focus:outline-none transition-colors"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </nav>

        {/* 🟢 우측 슬라이드 서랍(Drawer) 메뉴 */}
        
        {/* 1. 뒷배경 어둡게 (클릭 시 서랍 닫힘) */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-50 transition-opacity lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* 2. 우측에서 나오는 서랍 본체 */}
        <div 
          className={`fixed top-0 right-0 h-full w-64 bg-[#1c1c1e] z-50 transform transition-transform duration-300 ease-in-out border-l border-zinc-800 shadow-2xl lg:hidden flex flex-col ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* 서랍 상단 닫기 버튼 */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <span className="font-black text-[#e6c788] text-lg tracking-tight">Menu</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 서랍 중앙 메뉴 리스트 */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`block px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                  pathname === item.path
                    ? 'text-white bg-zinc-800 border-l-4 border-[#e6c788]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#252528]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 서랍 하단 유저/로그아웃 영역 */}
          <div className="p-5 border-t border-zinc-800 bg-[#252528]">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <span className="text-base font-bold text-white">{user.nickname}</span>
                </div>
                <button onClick={handleLogout} className="w-full text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-lg border border-zinc-700 font-bold">
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="block w-full text-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                로그인
              </Link>
            )}
          </div>
        </div>

        {children}

        {/* 마스터 전용 알림이 */}
        {user?.nickname === "한설" && pendingCount > 0 && (
          <Link href="/support">
            <div className="fixed bottom-8 right-8 bg-[#e6c788] hover:bg-yellow-500 text-[#121212] px-5 py-3 rounded-full shadow-[0_0_20px_rgba(230,199,136,0.4)] cursor-pointer transition transform hover:scale-105 flex items-center gap-3 z-50 animate-bounce">
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