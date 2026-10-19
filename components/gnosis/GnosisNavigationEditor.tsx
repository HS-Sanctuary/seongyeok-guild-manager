"use client";

import { useState } from "react";
import GnosisMark from "./GnosisMark";
import { DEFAULT_GNOSIS_NAVIGATION, GNOSIS_ICON_OPTIONS, type GnosisNavigationItem } from "@/lib/gnosisNavigation";
import { useGnosisNavigation, saveGnosisNavigation, resetGnosisNavigation } from "@/hooks/useGnosisNavigation";
import "./gnosis-navigation-editor.css";

function Draft({ initial, message, setMessage }: { initial: GnosisNavigationItem[]; message: string; setMessage: (value: string) => void }) {
  const [rows, setRows] = useState(() => initial.map(row => ({ ...row })));
  function change(key: string, patch: Partial<GnosisNavigationItem>) {
    setRows(previous => previous.map(row => row.key === key ? { ...row, ...patch } : row));
    setMessage("");
  }
  function move(index: number, direction: number) {
    setRows(previous => {
      const next = [...previous];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
    setMessage("");
  }
  function save() {
    try { saveGnosisNavigation(rows); setMessage("이 브라우저의 게시판과 글쓰기 화면에 적용했어요."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "브라우저 저장을 사용할 수 없어요."); }
  }
  return <>
    <div className="gnosis-editor-rows">{rows.map((row, index) => <div className="gnosis-editor-row" key={row.key}>
      <span className="gnosis-editor-key"><GnosisMark name={row.icon} />{row.key}</span>
      <label>표시 이름<input aria-label={`${row.key} 표시 이름`} value={row.label} maxLength={12} onChange={event => change(row.key, { label: event.target.value })} /></label>
      <label>아이콘<select aria-label={`${row.key} 아이콘`} value={row.icon} onChange={event => change(row.key, { icon: event.target.value as GnosisNavigationItem["icon"] })}>{GNOSIS_ICON_OPTIONS.map(icon => <option key={icon}>{icon}</option>)}</select></label>
      <div className="gnosis-editor-order"><button type="button" aria-label={`${row.key} 위로`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`${row.key} 아래로`} disabled={index === rows.length - 1} onClick={() => move(index, 1)}>↓</button></div>
    </div>)}</div>
    <div className="gnosis-editor-actions"><button type="button" onClick={save}>이 브라우저에서 미리보기</button><button type="button" onClick={() => { try { resetGnosisNavigation(); setRows(DEFAULT_GNOSIS_NAVIGATION.map(row => ({ ...row }))); setMessage("기본 분류로 복원했어요."); } catch { setMessage("브라우저 저장을 사용할 수 없어요."); } }}>기본값 복원</button></div>
    <p role="status" aria-live="polite">{message}</p>
  </>;
}

export default function GnosisNavigationEditor() {
  const [message, setMessage] = useState("");
  const { items, invalid, revision } = useGnosisNavigation();
  return <section className="gnosis-navigation-editor" aria-labelledby="gnosis-editor-title">
    <h2 id="gnosis-editor-title">게시판 분류 관리</h2>
    <p><strong>로컬 미리보기</strong> · 현재 브라우저에만 적용돼요. 길드 전체에는 반영되지 않아요.</p>
    <p>이름·순서·아이콘을 바꿀 수 있어요. 기존 글의 분류 기준은 유지돼요.</p>
    {invalid && <p role="alert">저장된 설정을 읽을 수 없어 기본 분류를 표시하고 있어요. 저장하거나 기본값을 복원하면 설정이 교체돼요.</p>}
    <Draft key={revision} initial={items} message={message} setMessage={setMessage} />
  </section>;
}
