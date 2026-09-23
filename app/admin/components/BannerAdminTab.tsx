"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { adminCatalogWrite } from "@/lib/adminCatalogClient";

export default function BannerAdminTab() {
  const [banners, setBanners] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from("nexus_banners").select("*").order("created_at", { ascending: false });
    if (data) setBanners(data);
    setLoading(false);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return alert("공지 메시지를 입력해 주세요.");

    try {
      await adminCatalogWrite("nexus_banners", "insert", { message: newMessage.trim(), is_active: true });
      setNewMessage("");
      fetchBanners();
    } catch (error) {
      alert("배너 등록 실패: " + (error as Error).message);
    }
  };

  const toggleBanner = async (id: number, currentActive: boolean) => {
    try {
      await adminCatalogWrite("nexus_banners", "update", { is_active: !currentActive }, id);
      fetchBanners();
    } catch (error) { alert((error as Error).message); }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await adminCatalogWrite("nexus_banners", "delete", undefined, id);
      fetchBanners();
    } catch (error) { alert((error as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--accent)]">🚨 긴급 상단 공지 배너 제어</h2>
        <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">플랫폼 메인 상단에 출현할 실시간 긴급 공지를 관리합니다.</p>
      </div>

      <form onSubmit={handleAddBanner} className="bg-[var(--inner-box)] p-4 rounded-xl border border-[var(--panel-border)] space-y-3">
        <div>
          <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">공지 배너 문구</label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="예: [긴급] 오늘 22:00 발할라 어비스 길드 버스 집결 예정"
            className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] text-xs rounded-xl p-2.5 outline-none focus:border-[var(--accent)] font-bold placeholder:[var(--text-sub)]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-[var(--text-sub)] font-bold">상단 공지 배너로 표시됩니다.</span>

          <button
            type="submit"
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
          >
            배너 송출하기
          </button>
        </div>
      </form>

      <div className="bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] p-4 divide-y divide-[var(--panel-border)]">
        {loading ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">로딩 중...</div>
        ) : banners.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">등록된 배너가 없습니다.</div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${b.is_active ? "bg-emerald-500 animate-ping" : "bg-[var(--panel-border)]"}`} />
                <span className="min-w-0 text-xs font-bold text-[var(--text-main)] break-words [overflow-wrap:anywhere]">{b.message}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  onClick={() => toggleBanner(b.id, b.is_active)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    b.is_active 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                  }`}
                >
                  {b.is_active ? "송출 중" : "비활성"}
                </button>
                <button
                  onClick={() => deleteBanner(b.id)}
                  className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-rose-500/25 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
