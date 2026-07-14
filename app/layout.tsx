import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // 👈 방금 만든 메뉴바 부품을 가져옵니다.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sanctuary Nexus",
  description: "성역 길드 매니저",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Navbar /> {/* 👈 모든 페이지의 최상단에 메뉴바를 고정! */}
        {children} {/* 👈 이 아래에 각 페이지들(캐릭터, 파티 등)이 들어갑니다. */}
      </body>
    </html>
  );
}