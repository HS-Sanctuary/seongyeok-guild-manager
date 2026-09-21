"use client";

import { useMemo, useState, useEffect } from "react";
import MarkIcon from "@/components/common/MarkIcon";
import { CONTENT_DB, ContentItem, ABYSS_SUB_DUNGEONS, AbyssSubDungeon, ContentPowerReq } from "@/components/party/types";
import { parseAbyssInfo } from "@/lib/busUtils";

const cleanContentName = (name: string) => {
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .replace("3종", "다중")
    .trim();
};

interface ContentSelectModalProps {
  showContentModal: boolean;
  setShowContentModal: (val: boolean) => void;
  tempContentCategory: "어비스" | "레이드";
  setTempContentCategory: (val: "어비스" | "레이드") => void;
  tempContent: ContentItem;
  setTempContent: (val: ContentItem) => void;
  tempDiff: string;
  setTempDiff: (val: string) => void;
  applyContentModal: (selectedSubContents?: string[]) => void;
  tempSubContents?: string[];
  setTempSubContents?: (val: string[]) => void;
  powerReqs?: ContentPowerReq[];
}

export default function ContentSelectModal({
  showContentModal,
  setShowContentModal,
  tempContentCategory,
  setTempContentCategory,
  tempContent,
  setTempContent,
  tempDiff,
  setTempDiff,
  applyContentModal,
  tempSubContents,
  setTempSubContents,
  powerReqs
}: ContentSelectModalProps) {
  const abyssContents = useMemo(() => CONTENT_DB.filter((c: ContentItem) => c.category === "어비스"), []);
  const raidContents = useMemo(() => CONTENT_DB.filter((c: ContentItem) => c.category === "레이드"), []);

  const [localSubContents, setLocalSubContents] = useState<string[]>(
    tempSubContents && tempSubContents.length > 0 ? tempSubContents : ["abyss_1", "abyss_2", "abyss_3"]
  );

  useEffect(() => {
    if (showContentModal) {
      if (tempSubContents && tempSubContents.length > 0) {
        setLocalSubContents(tempSubContents);
      } else {
        setLocalSubContents(["abyss_1", "abyss_2", "abyss_3"]);
      }
    }
  }, [showContentModal, tempSubContents]);

  const activeSubContents = localSubContents;

  const toggleSubContent = (id: string) => {
    let next: string[];
    if (activeSubContents.includes(id)) {
      if (activeSubContents.length <= 1) return;
      next = activeSubContents.filter((subId) => subId !== id);
    } else {
      next = [...activeSubContents, id];
    }
    setLocalSubContents(next);
    if (setTempSubContents) {
      setTempSubContents(next);
    }
  };

  const abyssInfo = useMemo(() => {
    if (tempContentCategory !== "어비스") return null;
    return parseAbyssInfo({ content_name: tempContent.name, category: tempContentCategory }, activeSubContents);
  }, [tempContent, tempContentCategory, activeSubContents]);

  // 🛡️ Supabase DB 연동 정격 인원수 동적 계산
  const getContentSize = (item: ContentItem) => {
    if (powerReqs && powerReqs.length > 0) {
      const match = powerReqs.find(r => r.content_name === item.name || item.name.includes(r.content_name));
      if (match?.max_members) return match.max_members;
    }
    return item.name.includes("카브락") ? 8 : 4;
  };

  const currentSelectedSize = getContentSize(tempContent);

  const handleApply = () => {
    if (setTempSubContents) {
      setTempSubContents(activeSubContents);
    }
    applyContentModal(tempContentCategory === "어비스" ? activeSubContents : undefined);
  };

  if (!showContentModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none"
      onClick={() => setShowContentModal(false)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95 cursor-default max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3 shrink-0">
          <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
            <MarkIcon src="/svgs/contens mark/여신상 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
            <span>목표 컨텐츠 선택</span>
          </h3>
          <button type="button" onClick={() => setShowContentModal(false)} className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 gap-2.5 sm:gap-3.5 min-h-0 overscroll-contain">
          {/* 어비스 영역 */}
          <div className="space-y-2 pr-1 sm:pr-2 border-r border-[var(--panel-border)]/70">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
              <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
              <span>어비스</span>
            </div>
            <div className="space-y-2">
              {abyssContents.map((c: ContentItem) => {
                const isSelected = tempContent.id === c.id || tempContent.name === c.name;
                const displayName = cleanContentName(c.name);
                const isMultiAbyssCard = c.id === "abyss_all" || c.name.includes("다중") || c.name.includes("3종");
                const itemSize = getContentSize(c);

                return (
                  <div
                    key={c.id}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--inner-box)] shadow-md"
                        : "border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTempContent(c);
                        setTempContentCategory("어비스");
                        if (tempContent.id !== c.id) {
                          setTempDiff(c.defaultDiff);
                        }
                      }}
                      className={`w-full p-2 sm:p-2.5 text-left text-xs font-black transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                          : "bg-[var(--inner-box)] text-[var(--text-main)] hover:bg-[var(--panel-border)]/50"
                      }`}
                    >
                      <span className="truncate">{displayName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1 ${
                        isSelected ? "bg-black/20 text-[var(--accent-fg)]" : "bg-[var(--panel)] text-[var(--text-sub)]"
                      }`}>
                        {itemSize}인
                      </span>
                    </button>

                    {isSelected && (
                      <div className="p-2 sm:p-2.5 bg-[var(--inner-box)]/90 border-t border-[var(--accent)]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="text-[10px] font-black text-[var(--text-sub)] block">
                          난이도 선택
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {c.diffs.map((d: string) => {
                            const isDiffSelected = tempDiff === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setTempDiff(d)}
                                className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-black rounded-lg border transition-all cursor-pointer text-center whitespace-nowrap break-keep ${
                                  isDiffSelected
                                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs scale-[1.02]"
                                    : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white hover:border-[var(--accent)]/50"
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>

                        {/* 어비스 다중 카드 */}
                        {isMultiAbyssCard && (
                          <div className="pt-2 border-t border-[var(--panel-border)]/50 space-y-1">
                            <span className="text-[10px] font-black text-[var(--accent)] block">
                              목표 던전 (다중 선택)
                            </span>
                            <div className="flex flex-col gap-1">
                              {ABYSS_SUB_DUNGEONS.map((dungeon: AbyssSubDungeon) => {
                                const isSubSelected = activeSubContents.includes(dungeon.id);
                                return (
                                  <button
                                    key={dungeon.id}
                                    type="button"
                                    onClick={() => toggleSubContent(dungeon.id)}
                                    className={`py-1 px-1.5 text-[10px] font-black rounded-md border transition-all cursor-pointer text-left flex items-center justify-between ${
                                      isSubSelected
                                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
                                        : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"
                                    }`}
                                  >
                                    <span>{dungeon.name}</span>
                                    <span className="text-[9px]">{isSubSelected ? "✓" : ""}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 레이드 영역 */}
          <div className="space-y-2 pl-1 sm:pl-2">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
              <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
              <span>레이드</span>
            </div>
            <div className="space-y-2">
              {raidContents.map((c: ContentItem) => {
                const isSelected = tempContent.id === c.id || tempContent.name === c.name;
                const displayName = cleanContentName(c.name);
                const itemSize = getContentSize(c);

                return (
                  <div
                    key={c.id}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--inner-box)] shadow-md"
                        : "border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTempContent(c);
                        setTempContentCategory("레이드");
                        if (tempContent.id !== c.id) {
                          setTempDiff(c.defaultDiff);
                        }
                      }}
                      className={`w-full p-2 sm:p-2.5 text-left text-xs font-black transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                          : "bg-[var(--inner-box)] text-[var(--text-main)] hover:bg-[var(--panel-border)]/50"
                      }`}
                    >
                      <span className="truncate">{displayName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1 ${
                        isSelected ? "bg-black/20 text-[var(--accent-fg)]" : "bg-[var(--panel)] text-[var(--text-sub)]"
                      }`}>
                        {itemSize}인
                      </span>
                    </button>

                    {isSelected && (
                      <div className="p-2 sm:p-2.5 bg-[var(--inner-box)]/90 border-t border-[var(--accent)]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="text-[10px] font-black text-[var(--text-sub)] block">
                          난이도 선택
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {c.diffs.map((d: string) => {
                            const isDiffSelected = tempDiff === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setTempDiff(d)}
                                className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-black rounded-lg border transition-all cursor-pointer text-center whitespace-nowrap break-keep ${
                                  isDiffSelected
                                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs scale-[1.02]"
                                    : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white hover:border-[var(--accent)]/50"
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 요약 바 */}
        <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <MarkIcon 
              src={
                tempContentCategory === "어비스"
                  ? "/svgs/contens mark/어비스 마크.svg"
                  : "/svgs/contens mark/레이드 마크.svg"
              } 
              size="sm" 
              scale={1.8} 
              colorClass="bg-[var(--accent)]" 
            />
            <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate">
              {tempContentCategory === "어비스" && abyssInfo?.title
                ? abyssInfo.title
                : cleanContentName(tempContent.name)}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] font-black shrink-0 whitespace-nowrap">
              {tempDiff}
            </span>
          </div>
          <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">
            {currentSelectedSize}인
          </span>
        </div>

        <div className="flex gap-2 pt-1 border-t border-[var(--panel-border)] shrink-0">
          <button
            type="button"
            onClick={() => setShowContentModal(false)}
            className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white font-bold text-xs rounded-xl cursor-pointer transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:brightness-110 transition text-center"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}