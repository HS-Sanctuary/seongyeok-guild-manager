"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MarkIcon from "@/components/common/MarkIcon";

// 통폐합 어드민 탭 컴포넌트 목록
import AccountApprovalTab from "./components/AccountApprovalTab";
import BannerAdminTab from "./components/BannerAdminTab";
import TaskAdminTab from "./components/TaskAdminTab";
import ContentAdminTab from "./components/ContentAdminTab";
import ClassAdminTab from "./components/ClassAdminTab";
import TradeAdminTab from "./components/TradeAdminTab";
import MissionAdminTab from "./components/MissionAdminTab";
import ClassTitleAdminTab from "./components/ClassTitleAdminTab";
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
  { id: "class_title", label: "칭호 & 역할 관리", emoji: "🛡️" },
  { id: "gnosis", label: "그노시스 공략 관리", emoji: "📖" },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeMainTab, setActiveMainTab] = useState("approval");

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(savedUser);

    const isAdmin =
      parsedUser.nickname === "한설" ||
      parsedUser.role === "길드마스터" ||
      parsedUser.role === "부마스터" ||
      parsedUser.role === "부마스터 대행" ||
      parsedUser.role === "admin" ||
      parsedUser.role === "master";

    if (!isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[var(--bg-main,#121212)] text-[var(--text-main,#d4d4d8)] font-sans pb-20 pt-8">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="text-4xl">⚙️</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--accent,#e6c788)]">
              성역 넥서스 통합 관제 센터
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              SANCTUM 길드 플랫폼의 가입 승인, 숙제/컨텐츠/클래스 카탈로그 및 시스템 설정을 제어합니다.
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 flex-wrap">
          {MAIN_TABS.map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-[var(--panel,#1c1c1e)] text-[var(--accent,#e6c788)] border border-[var(--panel-border,rgba(255,255,255,0.1))] shadow-md"
                    : "bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                }`}
              >
                {tab.markSrc ? (
                  <MarkIcon
                    src={tab.markSrc}
                    size="xs"
                    colorClass={isActive ? "bg-[var(--accent,#e6c788)]" : "bg-zinc-500"}
                  />
                ) : (
                  <span>{tab.emoji}</span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 독립 모듈 렌더링 영역 */}
        <div className="bg-[var(--panel,#1c1c1e)] border border-zinc-800 rounded-2xl p-6 shadow-xl min-h-[550px]">
          {activeMainTab === "approval" && <AccountApprovalTab currentUser={user} />}
          {activeMainTab === "banner" && <BannerAdminTab />}
          {activeMainTab === "tasks" && <TaskAdminTab />}
          {activeMainTab === "contents" && <ContentAdminTab />}
          {activeMainTab === "classes" && <ClassAdminTab />}
          {activeMainTab === "trade" && <TradeAdminTab />}
          {activeMainTab === "mission" && <MissionAdminTab />}
          {activeMainTab === "class_title" && <ClassTitleAdminTab />}
          {activeMainTab === "gnosis" && <GnosisAdminTab />}
        </div>
      </div>
    </main>
  );
}