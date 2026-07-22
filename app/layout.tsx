"use client";

import './globals.css'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // DB 연결 추가

const navItems = [
  { name: '공지사항', path: '/notice' },
  { name: '캐릭터 관리', path: '/character' },
  { name: '길드원 목록', path: '/members' }, // 🟢 새로 추가된 길드원 목록 메뉴!
  { name: '파티 매칭', path: '/party' },
  { name: '직업 공략', path: '/guide' },
  { name: '성역 랭킹', path: '/ranking' },
  { name: '문의/건의', path: '/support' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0); // 🟢 알림 개수 상태

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // 🟢 길드마스터(한설)일 경우에만 '대기중'인 문의 개수를 실시간으로 가져옵니다.
      if (parsedUser.nickname === "한설") {
        checkPendingInquiries();
        // 10초마다 알림 확인 (새로고침 안 해도 됨!)
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

  // 로그인 페이지일 경우 메뉴바와 알림이를 숨김
  if (pathname === '/login') {
    return (
      <html lang="ko">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body className="bg-[#121212] text-zinc-200">
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

                <div className="hidden md:flex space-x-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
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

              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-zinc-300">
                    <span className="text-[#e6c788] mr-1">👑</span>{user.nickname}
                  </span>
                  <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-bold text-[#e6c788] hover:text-yellow-400">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </nav>

        {children}

        {/* 🟢 항상 따라다니는 '마스터 전용 알림이' */}
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