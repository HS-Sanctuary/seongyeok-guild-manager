"use client";

import { useState, type ReactNode } from "react";

const ROW_STEP = 6;

export default function ProgressiveGrid<T extends { id: number }>({
  items,
  columns,
  className,
  renderItem,
}: {
  items: T[];
  columns: 2 | 3;
  className: string;
  renderItem: (item: T) => ReactNode;
}) {
  const [visibleRows, setVisibleRows] = useState(ROW_STEP);

  const moreButton = (minItems: number, responsiveClass: string) =>
    items.length > minItems && (
      <button
        type="button"
        className={`${responsiveClass} mx-auto min-h-10 rounded-lg border border-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`}
        onClick={() => setVisibleRows((rows) => rows + ROW_STEP)}
      >
        더보기 ↓
      </button>
    );

  return (
    <>
      <div className={className}>
        {items.map((item, index) => {
          const visibility = index < visibleRows
            ? ""
            : index < visibleRows * 2
              ? "hidden md:block"
              : columns === 3 && index < visibleRows * 3
                ? "hidden xl:block"
                : "hidden";
          return <div key={item.id} className={visibility}>{renderItem(item)}</div>;
        })}
      </div>
      <div className="flex justify-center pt-2">
        {moreButton(visibleRows, "inline-flex md:hidden")}
        {moreButton(visibleRows * 2, columns === 3 ? "hidden md:inline-flex xl:hidden" : "hidden md:inline-flex")}
        {columns === 3 && moreButton(visibleRows * 3, "hidden xl:inline-flex")}
      </div>
    </>
  );
}
