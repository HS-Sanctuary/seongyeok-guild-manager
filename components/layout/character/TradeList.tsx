"use client";

interface TradeListProps {
  categoryType: "barter" | "shop";
  title: string;
  items?: any[];
  tradeProgress: Record<number, number>;
  tradeCompletedBy: Record<number, string>;
  pinnedTrades: number[];
  togglePinTrade: (id: number) => void;
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
  categoryType,
  title,
  items = [],
  tradeProgress = {},
  tradeCompletedBy = {},
  pinnedTrades = [],
  togglePinTrade,
  updateTradeProgress,
  tradeSearch = "",
  setTradeSearch,
  tradeSortOrder = "asc",
  setTradeSortOrder,
}: TradeListProps) {
  const filterAndSort = () => {
    const safeItems = Array.isArray(items) ? items : [];
    let list = [...safeItems];

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
      const aPin = pinnedTrades.includes(a.id) ? 1 : 0;
      const bPin = pinnedTrades.includes(b.id) ? 1 : 0;
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
      {/* 🟡 헤더 및 검색창: 와이드 뷰 전역 폰트 스케일 적용 */}
      <div className="space-y-2 border-b border-[var(--panel-border)] pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-[var(--accent)] text-sm md:text-base whitespace-nowrap">
            {title}
          </h3>
          <button
            type="button"
            onClick={() =>
              setTradeSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs md:text-sm font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer whitespace-nowrap transition-colors"
          >
            {tradeSortOrder === "asc" ? "▲ 오름차순" : "▼ 내림차순"}
          </button>
        </div>

        {/* 🟡 노란 영역: 검색창 글자 크기 및 패딩 가독성 상향 */}
        <input
          type="text"
          value={tradeSearch}
          onChange={(e) => setTradeSearch(e.target.value)}
          placeholder="NPC / 맵 / 보상 / 소모품 검색..."
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-xs md:text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-sub)]/70 transition-all"
        />
      </div>

      {/* 카드 그리드: 전역 스케일 반영 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3.5 items-start">
          {filteredItems.map((trade: any) => {
            const currentVal = tradeProgress[trade.id] || 0;
            const limit = trade.limit || trade.max_count || 1;
            const isMax = currentVal >= limit;
            const isPinned = pinnedTrades.includes(trade.id);
            const buyerNick = tradeCompletedBy[trade.id];

            return (
              <div
                key={trade.id}
                className={`flex flex-col justify-between p-3 rounded-lg border transition-all ${
                  isPinned
                    ? "bg-[var(--accent-soft)]/20 border-[var(--accent)]"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/40"
                }`}
              >
                {/* 상단 NPC 정보 */}
                <div className="flex items-center justify-between mb-2 min-w-0 gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => togglePinTrade(trade.id)}
                      className={`text-xs md:text-sm cursor-pointer shrink-0 ${
                        isPinned ? "opacity-100" : "opacity-30 hover:opacity-70"
                      }`}
                    >
                      📌
                    </button>
                    <span className="font-bold text-xs md:text-sm text-[var(--accent)] truncate">
                      {trade.npc || "NPC"}{" "}
                      <span className="text-[var(--text-main)] font-normal text-xs">
                        ({trade.map || "맵"})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded border bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] whitespace-nowrap">
                      {trade.reset_type || "주간"}
                    </span>

                    {trade.scope === "계정당" && buyerNick && (
                      <span className="text-xs font-bold text-purple-200 bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-700/80 whitespace-nowrap">
                        {buyerNick}
                      </span>
                    )}

                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        trade.scope === "계정당"
                          ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                          : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)]"
                      }`}
                    >
                      {trade.scope || "캐릭당"}
                    </span>
                  </div>
                </div>

                {/* 하단 보상/소모 및 조작부 */}
                <div className="flex items-end justify-between gap-2 mt-1">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs md:text-sm font-bold text-emerald-400 leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">보상</span>
                      {trade.reward} {trade.reward_cnt ? `(${trade.reward_cnt}개)` : ""}
                    </div>
                    <div className="text-xs md:text-sm font-bold text-amber-400 leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">소모</span>
                      {trade.cost} {trade.cost_cnt ? `(${trade.cost_cnt}개)` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)] shrink-0 self-end">
                    <button
                      type="button"
                      onClick={() =>
                        updateTradeProgress(
                          trade.id,
                          -1,
                          limit,
                          trade.scope
                        )
                      }
                      className="w-5 h-5 md:w-6 md:h-6 flex justify-center items-center rounded bg-[var(--inner-box)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span
                      className={`text-xs md:text-sm font-black min-w-[28px] text-center font-mono ${
                        isMax
                          ? "text-emerald-400"
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
                          trade.scope
                        )
                      }
                      className="w-5 h-5 md:w-6 md:h-6 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs active:scale-95 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-xs md:text-sm text-[var(--text-sub)]">
          등록되거나 검색된 품목이 없습니다.
        </div>
      )}
    </div>
  );
}