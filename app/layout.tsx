"use client";

import './globals.css'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const navItems = [
  { en: 'KERYGMA', kr: '케리그마', sub: '공지사항', path: '/notice' },
  { en: 'CHRONOS', kr: '크로노스', sub: '캐릭터 관리', path: '/character' },
  { en: 'AGORA', kr: '아고라', sub: '길드 라운지', path: '/lounge' },
  { en: 'EMPORION', kr: '엠포리온', sub: '거래소 정보', path: '/market' },
  { en: 'SYNAXIS', kr: '시낙시스', sub: '파티 매칭', path: '/party' },
  { en: 'GNOSIS', kr: '그노시스', sub: '정보 공유', path: '/gnosis' },
  { en: 'LOGOS', kr: '로고스', sub: '문의/건의', path: '/support' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

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

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase.from('nexus_banners').select('*').eq('is_active', true);
        if (!error && data && data.length > 0) {
          setBanner(data.sort((a, b) => b.id - a.id)[0]);
        } else {
          setBanner(null);
        }
      } catch (err) {}
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
        <nav className="sticky top-0 z-[9999] flex flex-col shadow-lg border-b border-zinc-800 bg-[#1c1c1e] w-full">
          {banner && (
            <div className="w-full py-2.5 bg-red-600 text-white text-center text-sm font-black animate-pulse flex items-center justify-center gap-2 border-b border-red-800">
              <span className="text-lg">🚨</span><span>{banner.message}</span><span className="text-lg">🚨</span>
            </div>
          )}
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="flex items-center justify-between h-16">
              
              <div className="flex items-center gap-2 lg:gap-6">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-1 lg:mr-2">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#e6c788] to-yellow-600 rounded flex items-center justify-center shadow-lg shadow-yellow-900/20 shrink-0">
                    <span className="text-black font-black text-xs lg:text-sm tracking-tighter">SC</span>
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="font-black text-base lg:text-lg text-white leading-none tracking-wider drop-shadow-md">SANCTUM</span>
                    <span className="text-[8px] lg:text-[9px] text-[#e6c788] font-bold tracking-widest mt-0.5 opacity-90 hidden sm:block">데이안 성역 길드</span>
                  </div>
                </Link>

                {/* 🟢 기존 호버 애니메이션 100% 복구 + 창 크기에 따라 폭/글자크기만 쫀득하게 줄어듦 */}
                <div className="hidden md:flex space-x-0.5 lg:space-x-1 xl:space-x-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link 
                        key={item.en} 
                        href={item.path} 
                        className={`group relative flex items-center justify-center rounded-md transition-all overflow-hidden h-10 lg:h-11 xl:h-12 w-14 lg:w-20 xl:w-24 ${
                          isActive ? 'bg-zinc-800/80 border-b-2 border-[#e6c788]' : 'hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className={`absolute font-black tracking-widest text-[8px] lg:text-[10px] xl:text-xs transition-all duration-300 transform group-hover:-translate-y-8 group-hover:opacity-0 ${
                          isActive ? 'text-white' : 'text-zinc-400'
                        }`}>
                          {item.en}
                        </span>
                        <div className="absolute flex flex-col items-center transition-all duration-300 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-none">
                          <span className="font-black text-[9px] lg:text-[11px] xl:text-[13px] text-white leading-tight whitespace-nowrap">{item.kr}</span>
                          <span className="text-[7px] lg:text-[8px] xl:text-[9px] font-bold text-[#e6c788] whitespace-nowrap">{item.sub}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 🟢 우측 유저 프로필 및 햄버거 버튼 영역 */}
              <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                {user ? (
                  <div className="hidden md:flex items-center gap-1.5 lg:gap-2 whitespace-nowrap">
                    <span className="text-xs lg:text-sm font-bold text-zinc-300 flex items-center gap-1">
                      <span className="text-[#e6c788]">👑</span>
                      <span>{user.nickname}</span>
                    </span>
                    
                    {isAdmin && (
                      <Link href="/admin" className="text-zinc-500 hover:text-[#e6c788] transition-colors p-1" title="SANCTUM 관리">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors p-1 flex items-center justify-center" title="로그아웃">
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="hidden md:block text-xs lg:text-sm font-bold text-[#e6c788] hover:text-yellow-400 whitespace-nowrap">로그인</Link>
                )}
                
                {/* 🟢 햄버거 버튼은 모바일(스마트폰) 사이즈에서만 나오도록 md:hidden 적용 */}
                <div className="flex md:hidden items-center shrink-0">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 hover:text-white p-2 focus:outline-none transition-colors">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[10000] transition-opacity md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <div className={`fixed top-0 right-0 h-full w-72 bg-[#1c1c1e] z-[10001] transform transition-transform duration-300 ease-in-out border-l border-zinc-800 shadow-2xl md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
                    isActive ? 'bg-zinc-800 border-l-4 border-[#e6c788]' : 'hover:bg-[#252528]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-black text-sm tracking-wider ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.en}</span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-0.5">{item.kr}</span>
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-[#e6c788]' : 'text-zinc-500'}`}>{item.sub}</span>
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
                <button onClick={handleLogout} className="w-full text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-lg border border-zinc-700 font-bold flex items-center justify-center gap-2">
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="block w-full text-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg transition-colors">로그인</Link>
            )}
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}