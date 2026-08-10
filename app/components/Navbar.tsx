"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  // 컴포넌트가 로드될 때와 storage 이벤트(로그인 변경 신호) 발생 시 유저 정보 체크
  const checkUser = () => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    // 다른 탭이나 로그인 시점에서 상태가 바뀌면 즉시 반응
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, [pathname]);

  if (pathname === "/login") return null;
  // 유저가 없으면 일단 빈 화면을 보여주거나 로그인 버튼만 보이게 처리
  if (!user) return null; 

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    window.dispatchEvent(new Event("storage")); // 로그아웃 신호 전송
    router.push("/login");
  };

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
            SANCTUM
          </span>
        </a>
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