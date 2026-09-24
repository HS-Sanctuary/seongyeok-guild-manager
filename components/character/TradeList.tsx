"use client";

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
      </div>

      {/* 카드 그리드 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3.5 items-start">
          {filteredItems.map((trade) => {
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
                <div className="flex flex-wrap items-center justify-between mb-2 min-w-0 gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      aria-label="즐겨찾기"
                      aria-pressed={isPinned}
                      title={isPinned ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      onClick={() => togglePinTrade(trade.id)}
                      className={`text-xs md:text-sm cursor-pointer shrink-0 ${
                        isPinned ? "opacity-100" : "opacity-30 hover:opacity-70"
                      }`}
                    >
                      {isPinned ? "★" : "☆"}
                    </button>
                    <span className="font-bold text-xs md:text-sm text-[var(--accent)] break-words [overflow-wrap:anywhere]">
                      {trade.npc || "NPC"}{" "}
                      <span className="text-[var(--text-main)] font-normal text-xs">
                        ({trade.map || "맵"})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
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
                <div className="flex flex-wrap items-end justify-between gap-2 mt-1">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs md:text-sm font-bold text-[var(--kronos-reward)] leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">보상</span>
                      {trade.reward}{trade.reward_cnt ? ` × ${trade.reward_cnt.toLocaleString()}` : ""}
                    </div>
                    <div className="text-xs md:text-sm font-bold text-[var(--kronos-cost)] leading-tight break-keep">
                      <span className="text-xs text-[var(--text-sub)] mr-1.5 font-normal">소모</span>
                      {trade.cost}{trade.cost_cnt ? ` × ${trade.cost_cnt.toLocaleString()}` : ""}
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
