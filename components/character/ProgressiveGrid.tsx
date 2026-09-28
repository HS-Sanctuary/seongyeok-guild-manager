"use client";

import { useState, type ReactNode } from "react";

const ROW_STEP = 3;

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
        className={`${responsiveClass} kronos-more-divider`}
        aria-label="더보기: 다음 3줄 표시"
        onClick={() => setVisibleRows((rows) => rows + ROW_STEP)}
      >
        <span className="kronos-more-shadow" aria-hidden="true" />
        <span className="kronos-more-mark" aria-hidden="true" />
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
      {items.length > visibleRows && (
        <div className="kronos-more-slot">
          {moreButton(visibleRows, "inline-flex md:hidden")}
          {moreButton(visibleRows * 2, columns === 3 ? "hidden md:inline-flex xl:hidden" : "hidden md:inline-flex")}
          {columns === 3 && moreButton(visibleRows * 3, "hidden xl:inline-flex")}
        </div>
      )}
    </>
  );
}
