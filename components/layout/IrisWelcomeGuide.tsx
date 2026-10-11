'use client';

import Link from 'next/link';
import {useEffect, useRef, type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {IRIS_BETA_VERSION, IRIS_VERSION_LABEL, IRIS_UPDATE_NOTES_HREF} from '@/lib/irisRelease';

/** A local, account-scoped introduction. No server or game requests. */
export default function IrisWelcomeGuide({accountId, targetRef}: {accountId: string; targetRef: RefObject<HTMLAnchorElement | null>}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const storageKey = `sanctum_iris_welcome_${IRIS_BETA_VERSION}_${accountId}`;
  const dismiss = () => {
    try { localStorage.setItem(storageKey, 'seen'); } catch { /* Current document can still dismiss. */ }
    dialogRef.current?.close();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    try { if (localStorage.getItem(storageKey)) return; } catch { return; }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const position = () => {
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      dialog.style.setProperty('--iris-target-x', `${rect.x}px`);
      dialog.style.setProperty('--iris-target-y', `${rect.y}px`);
      dialog.style.setProperty('--iris-target-width', `${rect.width}px`);
      dialog.style.setProperty('--iris-target-height', `${rect.height}px`);
      dialog.style.setProperty('--iris-guide-top', `${rect.bottom + 28}px`);
    };
    let active = true;
    const frame = requestAnimationFrame(async () => {
      if (!targetRef.current) return;
      const header = targetRef.current.closest('nav');
      if (header) await Promise.all(header.getAnimations().map(animation => animation.finished.catch(() => {})));
      if (!active) return;
      position();
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
    const restore = () => { document.body.style.overflow = previousOverflow; };
    const observer = new ResizeObserver(position);
    if (targetRef.current) {
      observer.observe(targetRef.current);
      const header = targetRef.current.closest('nav');
      if (header) observer.observe(header);
    }
    window.addEventListener('resize', position);
    dialog.addEventListener('close', restore);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', position);
      dialog.removeEventListener('close', restore);
      dialog.close();
      restore();
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
    };
  }, [storageKey, targetRef]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <dialog ref={dialogRef} aria-labelledby="iris-welcome-title" aria-describedby="iris-welcome-description" onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => { if (event.target === event.currentTarget) dismiss(); }} className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-[var(--text-main)] backdrop:bg-black/35">
      <div data-iris-onboarding-target aria-hidden="true" className="pointer-events-none fixed rounded-2xl border-2 border-[var(--accent)]" style={{left: 'calc(var(--iris-target-x) - 4px)', top: 'calc(var(--iris-target-y) - 4px)', width: 'calc(var(--iris-target-width) + 8px)', height: 'calc(var(--iris-target-height) + 8px)', boxShadow: '0 0 1rem color-mix(in srgb, var(--accent) 50%, transparent)'}} />
      <span aria-hidden="true" className="pointer-events-none fixed text-2xl font-bold leading-none text-[var(--accent)]" style={{left: 'calc(var(--iris-target-x) + var(--iris-target-width) / 2 - .5rem)', top: 'calc(var(--iris-target-y) + var(--iris-target-height) + 3px)'}}>↑</span>
      <section className="fixed right-3 flex max-h-[calc(100dvh-var(--iris-guide-top)-.75rem)] w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-3 overflow-y-auto rounded-2xl border border-[var(--accent)] bg-[var(--panel)] p-4 shadow-xl" style={{top: 'var(--iris-guide-top)'}}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="iris-welcome-title" className="text-base font-bold">IRIS를 만나보세요<span className="mt-1 block text-xs font-medium text-[var(--accent)]">{IRIS_VERSION_LABEL}</span></h2>
          <button type="button" autoFocus onClick={dismiss} aria-label="IRIS 안내 닫기" className="flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--panel-border)] px-2.5 py-1 text-sm text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">닫기</button>
        </div>
        <p id="iris-welcome-description" className="break-keep text-sm leading-relaxed [overflow-wrap:anywhere]">게임 옆에서 생텀을 사용해 보세요. 숙제 확인과 파티 참여를 돕는 Windows용 무료 베타예요. 다음에도 위의 IRIS 버튼에서 찾을 수 있어요.</p>
        <p className="text-xs text-[var(--text-sub)]">이 브라우저에서 계정별로 새 버전마다 한 번 안내해요.</p>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Link href="/iris/download" onClick={dismiss} className="flex min-w-0 items-center justify-center rounded-lg bg-[var(--accent)] px-2 py-2 text-center text-sm font-bold text-[var(--accent-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">다운로드 안내 보기</Link>
          <Link href={IRIS_UPDATE_NOTES_HREF} onClick={dismiss} className="flex min-w-0 items-center justify-center rounded-lg border border-[var(--accent)] px-2 py-2 text-center text-sm font-bold text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">업데이트 노트 보기</Link>
        </div>
      </section>
    </dialog>, document.body,
  );
}
