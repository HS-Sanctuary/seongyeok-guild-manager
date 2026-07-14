"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // 현재 우리가 어떤 페이지에 있는지 알아내는 마법의 훅!
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [pathname]); // 페이지를 이동할 때마다 유저 정보를 다시 체크합니다.

  // 💡 로그인 페이지에서는 상단 메뉴바를 숨깁니다!
  if (pathname === "/login") return null;
  if (!mounted || !user) return null;

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    router.push("/login");
  };

  // 💡 여기에 메뉴를 추가하면 모든 페이지에 자동으로 반영됩니다.
  const navLinks = [
    { name: "공지사항", path: "/notice" },
    { name: "캐릭터 관리", path: "/character" },
    { name: "파티 매칭", path: "/party" },
    { name: "직업 공략", path: "/guide" },
    { name: "성역 랭킹", path: "/ranking" },
    { name: "문의/건의", path: "/support" },
  ];

  return (
    <div className="w-full bg-[#252528] border-b border-zinc-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-8">
        <a href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 bg-[#121212] border border-yellow-600/50 rounded flex items-center justify-center shadow-inner group-hover:border-yellow-400 transition">
            <span className="text-white font-black text-[10px] tracking-tighter">NX</span>
          </div>
          <span className="text-[#e6c788] font-serif font-black text-xl tracking-tight group-hover:text-yellow-400 transition">
            Sanctuary Nexus
          </span>
        </a>
        
        {/* 상단 메뉴바 (자동으로 밑줄 활성화 기능 포함) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-400">
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`hover:text-white transition cursor-pointer ${
                pathname === link.path ? "text-white border-b-2 border-[#e6c788] pb-1" : ""
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-3 text-xs">
        <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-bold">{user.nickname}</span>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition">로그아웃</button>
      </div>
    </div>
  );
}