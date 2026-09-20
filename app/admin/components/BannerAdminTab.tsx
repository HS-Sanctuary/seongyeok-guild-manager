"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BannerAdminTab() {
  const [banners, setBanners] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [bgColor, setBgColor] = useState("rose");
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

    const { error } = await supabase.from("nexus_banners").insert([
      { message: newMessage.trim(), bg_color: bgColor, is_active: true }
    ]);

    if (error) return alert("배너 등록 실패: " + error.message);
    setNewMessage("");
    fetchBanners();
  };

  const toggleBanner = async (id: number, currentActive: boolean) => {
    await supabase.from("nexus_banners").update({ is_active: !currentActive }).eq("id", id);
    fetchBanners();
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("nexus_banners").delete().eq("id", id);
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-[#e6c788]">🚨 긴급 상단 공지 배너 제어</h2>
        <p className="text-xs text-zinc-400 mt-1">플랫폼 메인 상단에 출현할 실시간 긴급 공지를 관리합니다.</p>
      </div>

      <form onSubmit={handleAddBanner} className="bg-[#252528] p-4 rounded-xl border border-zinc-700 space-y-3">
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1">공지 배너 문구</label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="예: [긴급] 오늘 22:00 발할라 어비스 길드 버스 집결 예정"
            className="w-full bg-[#121212] border border-zinc-700 text-white text-xs rounded-lg p-2.5 outline-none focus:border-[#e6c788]"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">컬러 테마:</span>
            <select
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="bg-[#121212] border border-zinc-700 text-white text-xs rounded-lg p-1.5 outline-none"
            >
              <option value="rose">🔴 긴급 (Rose)</option>
              <option value="amber">🟡 경고 (Amber)</option>
              <option value="cyan">🔵 안내 (Cyan)</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#e6c788] hover:bg-[#d8b572] text-black font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            배너 송출하기
          </button>
        </div>
      </form>

      <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4 divide-y divide-zinc-800">
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-6">로딩 중...</div>
        ) : banners.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-6">등록된 배너가 없습니다.</div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${b.is_active ? "bg-emerald-500 animate-ping" : "bg-zinc-600"}`} />
                <span className="text-xs font-bold text-white">{b.message}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBanner(b.id, b.is_active)}
                  className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    b.is_active ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {b.is_active ? "송출 중" : "비활성"}
                </button>
                <button
                  onClick={() => deleteBanner(b.id)}
                  className="bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer hover:bg-rose-900 transition"
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