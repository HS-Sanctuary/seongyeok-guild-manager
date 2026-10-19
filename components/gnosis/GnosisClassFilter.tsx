"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ClassIcon from "@/components/common/ClassIcon";

type Group = { name: string; classes: string[] };
type MenuPosition = { left: number; width: number; maxHeight: number; top?: number; bottom?: number };
type Props = {
  classLabel?: string;
  groups: Group[];
  selectedGroup: string | null;
  activeClass: string;
  onChooseGroup: (name: string | null) => void;
  onChooseClass: (name: string) => void;
};

export function classGroupLabel(name: string) { return name.replace(/\s*계열$/, ""); }

export default function GnosisClassFilter({ classLabel = "클래스", groups, selectedGroup, activeClass, onChooseGroup, onChooseClass }: Props) {
  const [menuGroup, setMenuGroup] = useState<string | null>(null);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, width: 0, maxHeight: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const group = groups.find(item => item.name === menuGroup);

  useEffect(() => {
    if (!menuGroup) return;
    const selected = menuRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    (selected ?? menuRef.current?.querySelector<HTMLButtonElement>("button"))?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setMenuGroup(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuGroup(null);
      triggerRef.current?.focus();
    };
    const onMove = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setMenuGroup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [menuGroup]);

  function toggleGroup(item: Group, button: HTMLButtonElement) {
    if (menuGroup === item.name) { setMenuGroup(null); return; }
    triggerRef.current = button;
    const rect = button.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const width = Math.min(rem * 10, window.innerWidth - 24);
    const below = Math.max(0, window.innerHeight - rect.bottom - 18);
    const above = Math.max(0, rect.top - 18);
    const opensAbove = below < Math.min(rem * 10, (item.classes.length + 1) * rem * 2) && above > below;
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width,
      maxHeight: Math.min(rem * 16, opensAbove ? above : below),
      ...(opensAbove ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
    if (selectedGroup !== item.name) onChooseGroup(item.name);
    setMenuGroup(item.name);
  }

  function chooseClass(name: string) {
    onChooseClass(name);
    setMenuGroup(null);
    triggerRef.current?.focus();
  }

  return <div className="gnosis-class-filter" ref={rootRef}>
    <div className="gnosis-filter-label"><h2>계열</h2><button type="button" onClick={() => { setMenuGroup(null); onChooseGroup(null); }}>{classLabel} 전체</button></div>
    <div className="gnosis-family-grid">{groups.map(item => <button key={item.name} type="button" aria-expanded={menuGroup === item.name} aria-controls={menuGroup === item.name ? "gnosis-class-dropdown" : undefined} className={selectedGroup === item.name ? "is-active" : ""} onClick={event => toggleGroup(item, event.currentTarget)}><ClassIcon job={item.classes[0]} size="xs" /><span>{classGroupLabel(item.name)}</span><span aria-hidden="true" className="gnosis-family-chevron">⌄</span></button>)}</div>
    {group && createPortal(<div id="gnosis-class-dropdown" className="gnosis-class-menu" ref={menuRef} style={position} role="group" aria-label={`${classGroupLabel(group.name)} 클래스 선택`} onKeyDown={event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
      options[next]?.focus();
    }}>
      <button type="button" aria-pressed={activeClass === "전체"} onClick={() => chooseClass("전체")}><ClassIcon job={group.classes[0]} size="xs" /><span>{classGroupLabel(group.name)} 전체</span></button>
      {group.classes.map(name => <button key={name} type="button" aria-pressed={activeClass === name} onClick={() => chooseClass(name)}><ClassIcon job={name} size="xs" /><span>{name}</span></button>)}
    </div>, document.body)}
  </div>;
}
