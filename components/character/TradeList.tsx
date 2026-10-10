"use client";
import { useState } from "react";
import { useBarterFavorites } from "@/hooks/useBarterFavorites";
import { BarterFavoritesFeedback } from "@/components/character/BarterFavoritesFeedback";
import ProgressiveGrid from "./ProgressiveGrid";

interface TradeRow {
  id: number;
  map?: string;
  npc?: string;
  reward?: string;
  reward_cnt?: number;
  cost?: string;
  cost_cnt?: number;
  limit?: number;
  max_count?: number;
  reset_type?: string;
  scope?: string;
}

interface TradeListProps {
  categoryType: "barter" | "shop";
  title: string;
  items?: TradeRow[];
  tradeProgress: Record<number, number>;
  tradeCompletedBy: Record<number, string>;
  accountId: string | null;
  accountNickname?: string;
  updateTradeProgress: (
    tradeId: number,
    delta: number,
    max: number,
    scope: string
  ) => void;
  tradeSearch: string;
  setTradeSearch: (search: string) => void;
  tradeSortOrder: "asc" | "desc";
  setTradeSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
}

export default function TradeList({
  title,
  items = [],
  tradeProgress = {},
  tradeCompletedBy = {},
  accountId,
  accountNickname,
  updateTradeProgress,
  tradeSearch = "",
  setTradeSearch,
  tradeSortOrder = "asc",
  setTradeSortOrder,
}: TradeListProps) {
  const favoritesState = useBarterFavorites(accountId);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const favorites = favoritesState.favorites;
  const filterAndSort = () => {
    const safeItems = Array.isArray(items) ? items : [];
    let list = [...safeItems];

    if (favoritesOnly) {
      list = list.filter((trade) => favorites.includes(trade.id));
    }

    if (tradeSearch && tradeSearch.trim()) {
      const q = tradeSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.npc && t.npc.toLowerCase().includes(q)) ||
          (t.map && t.map.toLowerCase().includes(q)) ||
          (t.reward && t.reward.toLowerCase().includes(q)) ||
          (t.cost && t.cost.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const aPin = favorites.includes(a.id) ? 1 : 0;
      const bPin = favorites.includes(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;

      const mapCompare = (a.map || "").localeCompare(b.map || "", "ko-KR");
      if (mapCompare !== 0)
        return tradeSortOrder === "asc" ? mapCompare : -mapCompare;

      const npcCompare = (a.npc || "").localeCompare(b.npc || "", "ko-KR");
      if (npcCompare !== 0)
        return tradeSortOrder === "asc" ? npcCompare : -npcCompare;

      const rewardCompare = (a.reward || "").localeCompare(
        b.reward || "",
        "ko-KR"
      );
      return tradeSortOrder === "asc" ? rewardCompare : -rewardCompare;
    });
  };

  const filteredItems = filterAndSort();

  return (
    <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 md:p-5 shadow-xs space-y-3">
      {/* 🟡 헤더 및 검색창: 여백 양끝(초록선)까지 유동적 확장 및 글자 가림 시 2줄 전환 */}
      <div className="border-b border-[var(--panel-border)] pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
          <h3 className="font-bold text-[var(--accent)] text-sm md:text-base whitespace-nowrap shrink-0">
            {title}
          </h3>

          {/* flex-1로 양끝 여백을 가득 채우며 min-w-[280px] 이하 감지 시 2줄로 이동 */}
          <div className="flex-1 min-w-0 basis-full md:basis-0 order-3 sm:order-2 w-full sm:w-auto">
            <input
              type="text"
              value={tradeSearch}
              onChange={(e) => setTradeSearch(e.target.value)}
              placeholder="NPC / 맵 / 보상 / 소모품 검색..."
              className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs md:text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-sub)]/70 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setTradeSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="order-2 sm:order-3 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs md:text-sm font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer whitespace-nowrap transition-colors shrink-0"
          >
            {tradeSortOrder === "asc" ? "▲ 오름차순" : "▼ 내림차순"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-sub)] cursor-pointer">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(event) => setFavoritesOnly(event.target.checked)}
              className="accent-[var(--accent)]"
            />
            즐겨찾기만
          </label>
          <BarterFavoritesFeedback
            state={favoritesState}
            accountId={accountId}
            accountNickname={accountNickname}
            legacyImport
          />
        </div>
      </div>

      {/* 카드 그리드 */}
      {filteredItems.length > 0 ? (
        <ProgressiveGrid
          key={`${accountId}:${tradeSearch}:${tradeSortOrder}:${favoritesOnly}`}
          items={filteredItems}
          columns={3}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3.5 items-start"
          renderItem={(trade) => {
            const currentVal = tradeProgress[trade.id] || 0;
            const limit = trade.limit || trade.max_count || 1;
            const isMax = currentVal >= limit;
            const isPinned = favorites.includes(trade.id);
            const favoriteLabel = `${trade.reward || "품목"} · ${trade.npc || "NPC"} 즐겨찾기 ${isPinned ? "해제" : "추가"}`;
            const buyerNick = tradeCompletedBy[trade.id];

            return (
              <div
                aria-label={isMax ? `${trade.npc || "교환"} 완료` : undefined}
                className={`flex min-h-[8.5rem] flex-col p-3 rounded-lg border transition-all ${
                  isPinned
                    ? "bg-[var(--accent-soft)]/20 border-[var(--accent)]"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/40"
                } border-l-[3px] ${isMax ? "!border-[var(--kronos-reward)] !border-l-[var(--kronos-reward)]" : "border-l-[var(--accent)]"}`}
              >
                {/* 상단 NPC 정보 */}
                <div className="flex min-h-10 flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-2 min-w-0">
                  <div className="flex min-w-[9rem] flex-1 items-start gap-1.5">
                    <button
                      type="button"
                      aria-label={favoriteLabel}
                      aria-pressed={isPinned}
                      title={favoriteLabel}
                      disabled={!favoritesState.ready || favoritesState.busy}
                      onClick={() => void favoritesState.toggle(trade.id)}
                      className={`text-xs md:text-sm cursor-pointer shrink-0 disabled:opacity-30 ${favoritesState.busy ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"} ${
                        isPinned ? "opacity-100" : "opacity-30 hover:opacity-70"
                      }`}
                    >
                      {isPinned ? "★" : "☆"}
                    </button>
                    <span className="min-w-0 font-bold text-xs leading-tight md:text-sm text-[var(--accent)] break-words [overflow-wrap:anywhere]">
                      {trade.npc || "NPC"}{" "}
                      <span className="whitespace-nowrap text-[var(--text-main)] font-normal text-xs">
                        ({trade.map || "맵"})
                      </span>
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <span className="kronos-meta-badge">
                      {trade.reset_type || "주간"}
                    </span>

                    {trade.scope === "계정당" && buyerNick && (
                      <span className="kronos-meta-badge">
                        {buyerNick}
                      </span>
                    )}

                    <span className="kronos-meta-badge">
                      {trade.scope || "캐릭당"}
                    </span>
                  </div>
                </div>

                {/* 하단 보상/소모 및 조작부 */}
                <div className="mt-auto pt-1">
                  <div className="space-y-1">
                    <div className="text-xs md:text-sm font-bold text-[var(--kronos-reward)] leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">보상</span>
                      {trade.reward}{trade.reward_cnt ? ` × ${trade.reward_cnt.toLocaleString()}` : ""}
                    </div>
                    <div className="text-xs md:text-sm font-bold text-[var(--kronos-cost)] leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">소모</span>
                      {trade.cost}{trade.cost_cnt ? ` × ${trade.cost_cnt.toLocaleString()}` : ""}
                    </div>
                  </div>

                  <div className="mt-2 flex w-full justify-end items-center gap-1 bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)]">
                    <button
                      type="button"
                      onClick={() =>
                        updateTradeProgress(
                          trade.id,
                          -1,
                          limit,
                          trade.scope || "캐릭당"
                        )
                      }
                      className="w-5 h-5 md:w-6 md:h-6 flex justify-center items-center rounded bg-[var(--inner-box)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span
                      className={`text-xs md:text-sm font-black min-w-[28px] text-center font-mono ${
                        isMax
                          ? "text-[var(--kronos-reward)]"
                          : "text-[var(--text-main)]"
                      }`}
                    >
                      {currentVal}/{limit}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateTradeProgress(
                          trade.id,
                          1,
                          limit,
                          trade.scope || "캐릭당"
                        )
                      }
                      className="w-5 h-5 md:w-6 md:h-6 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs active:scale-95 transition cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label={isMax ? "교환 횟수 모두 초기화" : "교환 횟수 모두 완료"}
                      onClick={() => updateTradeProgress(trade.id, isMax ? -currentVal : limit - currentVal, limit, trade.scope || "캐릭당")}
                      className="h-5 rounded border border-[var(--accent)] px-1 text-[0.6rem] font-black text-[var(--accent)] hover:bg-[var(--accent-soft)] md:h-6 md:px-1.5 md:text-xs"
                    >
                      {isMax ? "MIN" : "MAX"}
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
        />
      ) : (
        <div className="text-center py-10 text-xs md:text-sm text-[var(--text-sub)]">
          {items.length === 0
            ? "등록된 품목이 없습니다."
            : favoritesOnly
              ? !favoritesState.ready
                ? favoritesState.busy ? "즐겨찾기를 불러오는 중이에요." : "즐겨찾기를 먼저 다시 조회해 주세요."
                : favorites.length === 0
                ? "즐겨찾기한 품목이 없습니다. 별표를 눌러 추가해 주세요."
                : "현재 검색 조건에 맞는 즐겨찾기 품목이 없습니다."
              : "검색 조건에 맞는 품목이 없습니다."}
        </div>
      )}
    </div>
  );
}
