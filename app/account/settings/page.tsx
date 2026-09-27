"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionAccount = { id: string; nickname: string; status: string | null };

export default function AccountSettingsPage() {
  const [account, setAccount] = useState<SessionAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("세션 확인 실패");
        return response.json();
      })
      .then(result => { if (active) setAccount(result.account?.status === "승인" ? result.account : null); })
      .catch(() => { if (active) setMessage("계정 상태를 확인하지 못했습니다. 새로고침해 주세요."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !account) return;
    if (newCode !== confirmCode) return setMessage("새 접속 코드가 서로 다릅니다.");
    if (newCode.length < 10 || newCode.length > 64 || /\s/u.test(newCode)) {
      return setMessage("새 접속 코드는 공백 없이 10~64자로 입력해 주세요.");
    }
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ currentCode, newCode }),
      });
      const result = await response.json();
      if (!response.ok && !result.loginRequired) {
        setMessage(result.message || "접속 코드를 변경하지 못했습니다.");
        return;
      }
      setCurrentCode("");
      setNewCode("");
      setConfirmCode("");
      try {
        const saved = JSON.parse(localStorage.getItem("sanctum_accounts") || "[]") as Array<{ id: string }>;
        localStorage.setItem("sanctum_accounts", JSON.stringify(saved.filter(item => item.id !== account.id)));
      } catch {
        localStorage.removeItem("sanctum_accounts");
      }
      localStorage.removeItem("sanctum_active_account_id");
      localStorage.removeItem("nexus_user");
      window.location.replace("/login");
    } catch {
      setMessage("연결 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 text-[var(--text-main)]">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 sm:p-8 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--panel-border)] pb-5">
          <div>
            <p className="text-xs font-bold text-[var(--accent)]">SANCTUM ACCOUNT</p>
            <h1 className="mt-1 text-xl font-black">개인 설정</h1>
            <p className="mt-2 text-sm text-[var(--text-sub)]">내 계정의 접속 코드를 직접 변경할 수 있습니다.</p>
          </div>
          <Link href="/" className="rounded-lg border border-[var(--panel-border)] px-3 py-2 text-sm text-[var(--text-sub)] hover:text-[var(--text-main)]">홈으로</Link>
        </div>

        {loading ? <p className="py-6 text-sm text-[var(--text-sub)]">계정 확인 중...</p> : !account ? (
          <div className="space-y-3 py-6">
            <p className="text-sm text-[var(--text-sub)]">{message || "로그인한 길드원만 개인 설정을 사용할 수 있습니다."}</p>
            <Link href="/login" className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-fg)]">로그인하기</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-6">
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-4 py-3">
              <span className="block text-xs text-[var(--text-sub)]">변경할 계정</span>
              <strong className="break-words text-base">{account.nickname}</strong>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-sub)]">SANCTUM의 비밀번호는 로그인할 때 사용하는 <strong className="text-[var(--text-main)]">접속 코드</strong>입니다. 변경 후에는 모든 기기에서 로그아웃되며 새 코드로 다시 로그인해야 합니다. 새 코드는 다른 사람에게 알려주지 마세요.</p>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>현재 접속 코드</span>
              <input type={showCodes ? "text" : "password"} autoComplete="current-password" value={currentCode} onChange={event => setCurrentCode(event.target.value)} required maxLength={128} className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-3 py-2.5 text-[var(--text-main)] outline-none focus:border-[var(--accent)]" />
            </label>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>새 접속 코드</span>
              <input type={showCodes ? "text" : "password"} autoComplete="new-password" value={newCode} onChange={event => setNewCode(event.target.value)} required minLength={10} maxLength={64} className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-3 py-2.5 text-[var(--text-main)] outline-none focus:border-[var(--accent)]" />
              <span className="block text-xs font-normal text-[var(--text-sub)]">공백 없이 10~64자. 기존 코드와 다른 값을 사용해 주세요.</span>
            </label>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>새 접속 코드 확인</span>
              <input type={showCodes ? "text" : "password"} autoComplete="new-password" value={confirmCode} onChange={event => setConfirmCode(event.target.value)} required maxLength={64} className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-3 py-2.5 text-[var(--text-main)] outline-none focus:border-[var(--accent)]" />
            </label>
            <button type="button" onClick={() => setShowCodes(value => !value)} className="text-sm text-[var(--accent)] underline underline-offset-4">접속 코드 {showCodes ? "숨기기" : "보기"}</button>
            {message && <p role="alert" className="rounded-lg border border-rose-500/50 bg-rose-950/20 px-3 py-2 text-sm text-rose-300">{message}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-black text-[var(--accent-fg)] transition hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60">{saving ? "변경 중..." : "접속 코드 변경하기"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
