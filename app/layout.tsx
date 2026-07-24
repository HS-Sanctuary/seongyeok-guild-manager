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
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

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
    fetchActiveBanner();
  }, [pathname]);

  // 🟢 활성화된 긴급 배너 가져오기
  const fetchActiveBanner = async () => {
    const { data, error } = await supabase
      .from('nexus_banners')
      .select('message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setBannerMessage(data.message);
    else setBannerMessage(null);
  };

  const checkPendingInquiries = async () => {
    const { count, error } = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', '대기중');
    if (!error && count !== null) setPendingCount(count);
  };

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    window.location.href = "/login";
  };

  const isAdmin = user?.nickname === "한설"; // 🟢 마스터 권한 체크

  if (pathname === '/login') {
    return (
      <html lang="ko"><body>{children}</body></html>
    );
  }

  return (
    <html lang="ko">
      <body className="bg-[#121212] text-zinc-200 overflow-x-hidden">
        
        {/* 🟢 긴급 배너 영역 (활성화 시에만 보임) */}
        {bannerMessage && (
          <div className="w-full bg-red-600 text-white text-center py-2 px-4 font-bold text-sm tracking-wide z-50 relative animate-pulse flex items-center justify-center gap-2">
            <span>🚨</span>
            <span>{bannerMessage}</span>
            <span>🚨</span>
          </div>
        )}

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

                <div className="hidden lg:flex space-x-1">
                  {navItems.map((item) => (
                    <Link key={item.name} href={item.path} className={`px-3 xl:px-4 py-2 rounded-md text-sm font-bold transition-colors ${pathname === item.path ? 'text-white border-b-2 border-[#e6c788] pb-[6px]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 🟢 데스크탑 유저 정보 & 관리자 아이콘 */}
              <div className="hidden lg:flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-4">
                    {/* 관리자 전용 톱니바퀴 */}
                    {isAdmin && (
                      <Link href="/admin" className="text-zinc-400 hover:text-amber-400 transition-colors bg-zinc-800 p-1.5 rounded border border-zinc-700 shadow-inner group relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    )}
                    <span className="text-sm font-bold text-zinc-300"><span className="text-[#e6c788] mr-1">👑</span>{user.nickname}</span>
                    <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">로그아웃</button>
                  </div>
                ) : (
                  <Link href="/login" className="text-sm font-bold text-[#e6c788] hover:text-yellow-400">로그인</Link>
                )}
              </div>

              <div className="flex lg:hidden items-center">
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 hover:text-white p-2 focus:outline-none transition-colors">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>

            </div>
          </div>
        </nav>

        {/* 모바일 우측 슬라이드 서랍 */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 transition-opacity lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <div className={`fixed top-0 right-0 h-full w-64 bg-[#1c1c1e] z-50 transform transition-transform duration-300 ease-in-out border-l border-zinc-800 shadow-2xl lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

          <div className="p-5 border-t border-zinc-800 bg-[#252528] flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-2"><span className="text-xl">👑</span><span className="text-base font-bold text-white">{user.nickname}</span></div>
                </div>
                {/* 🟢 모바일 전용 관리자 메뉴 버튼 */}
                {isAdmin && (
                  <Link href="/admin" className="w-full flex items-center justify-center gap-2 bg-amber-900/30 text-amber-500 hover:bg-amber-900/50 hover:text-amber-400 border border-amber-700/50 py-2 rounded-lg font-black transition-colors">
                    ⚙️ 넥서스 관리
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-lg border border-zinc-700 font-bold">로그아웃</button>
              </>
            ) : (
              <Link href="/login" className="block w-full text-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg transition-colors">로그인</Link>
            )}
          </div>
        </div>

        {children}

        {/* 🟢 마스터 전용 알림이 */}
        {isAdmin && pendingCount > 0 && (
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