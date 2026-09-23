"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MarkIcon from "@/components/common/MarkIcon";
import "./admin.css";

// 통폐합 어드민 탭 컴포넌트 목록
import AccountApprovalTab from "./components/AccountApprovalTab";
import BannerAdminTab from "./components/BannerAdminTab";
import TaskAdminTab from "./components/TaskAdminTab";
import ContentAdminTab from "./components/ContentAdminTab";
import ClassAdminTab from "./components/ClassAdminTab";
import TradeAdminTab from "./components/TradeAdminTab";
import MissionAdminTab from "./components/MissionAdminTab";
import GnosisAdminTab from "./components/GnosisAdminTab";

interface MainTab {
  id: string;
  label: string;
  markSrc?: string;
  emoji?: string;
}

const MAIN_TABS: MainTab[] = [
  { id: "approval", label: "가입 승인 & 권한 관리", emoji: "👥" },
  { id: "banner", label: "긴급 공지 배너", emoji: "🚨" },
  { id: "tasks", label: "일일/주간/반복 숙제 관리", emoji: "📝" },
  { id: "contents", label: "어비스/레이드 관리", markSrc: "/svgs/contens mark/레이드 마크.svg" },
  { id: "classes", label: "클래스 & 역할군 관리", emoji: "🪖" },
  { id: "trade", label: "물물교환 카탈로그", emoji: "⚖️" },
  { id: "mission", label: "임무 게시판 관리", emoji: "📜" },
  { id: "gnosis", label: "그노시스 공략 관리", emoji: "📖" },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeMainTab, setActiveMainTab] = useState("classes");

  useEffect(() => {
    setMounted(true);
    if (new URLSearchParams(window.location.search).get("tab") === "approval") setActiveMainTab("approval");
    void fetch('/api/auth/session', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('세션 확인 실패');
      const { account } = await response.json();
      if (!account) return router.push('/login');
      if (!["길드마스터", "부마스터", "부마스터 대행"].includes(account.role)) {
        alert('관리자 권한이 필요합니다.');
        router.push('/');
        return;
      }
      setUser(account);
    }).catch(() => router.push('/login'));
  }, [router]);

  if (!mounted || !user) return null;

  return (
    <main className="sanctum-admin min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 pt-6 transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto p-3 sm:p-6 space-y-4">
        
        {/* 🟢 슬림 컴팩트 헤더 배너 (이모지 및 성역 넥서스 문구 제거 / 전역 테마 동기화) */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-3.5 px-5 sm:px-6 shadow-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight leading-none">
                생텀 관리자 페이지
              </h1>
              <span className="text-[var(--accent)] text-[11px] sm:text-[12px] font-extrabold bg-[var(--inner-box)] px-2.5 py-0.5 rounded-full border border-[var(--panel-border)] shrink-0">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-[var(--text-sub)] font-medium leading-none">
              가입 승인, 숙제/컨텐츠/클래스 카탈로그 및 플랫폼 시스템 설정을 통합 제어합니다.
            </p>
          </div>
        </header>

        {/* 탭 네비게이션 (전역 테마 변수 바인딩) */}
        <div className="flex gap-2 flex-wrap">
          {MAIN_TABS.map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`max-w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 break-keep ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] shadow-md"
                    : "bg-[var(--panel)] text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)] border border-[var(--panel-border)]"
                }`}
              >
                {tab.markSrc ? (
                  <MarkIcon
                    src={tab.markSrc}
                    size="xs"
                    colorClass={isActive ? "bg-[var(--accent-fg)]" : "bg-[var(--text-sub)]"}
                  />
                ) : (
                  <span>{tab.emoji}</span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 독립 모듈 렌더링 영역 (전역 테마 패널) */}
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-6 shadow-xl min-h-[550px] transition-colors duration-200">
          {activeMainTab === "approval" && <AccountApprovalTab currentUser={user} />}
          {activeMainTab === "banner" && <BannerAdminTab />}
          {activeMainTab === "tasks" && <TaskAdminTab />}
          {activeMainTab === "contents" && <ContentAdminTab />}
          {activeMainTab === "classes" && <ClassAdminTab />}
          {activeMainTab === "trade" && <TradeAdminTab />}
          {activeMainTab === "mission" && <MissionAdminTab />}
          {activeMainTab === "gnosis" && <GnosisAdminTab />}
        </div>
      </div>
    </main>
  );
}
