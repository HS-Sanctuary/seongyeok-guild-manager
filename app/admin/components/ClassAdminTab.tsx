"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ClassIcon from "@/components/common/ClassIcon";

interface ClassData {
  id: number;
  name: string;
  role: string;
  titles: string[];
  category?: string;
  icon?: string;
  is_active?: boolean;
}

const LINEAGE_GROUPS = [
  { name: "전사 계열", defaultClasses: ["전사", "대검전사", "검술사", "기사"] },
  { name: "마법사 계열", defaultClasses: ["마법사", "화염술사", "빙결술사", "전격술사"] },
  { name: "궁수 계열", defaultClasses: ["궁수", "장궁병", "석궁사수"] },
  { name: "음유시인 계열", defaultClasses: ["음유시인", "댄서", "악사"] },
  { name: "힐러 계열", defaultClasses: ["힐러", "사제", "수도사", "암흑술사"] },
  { name: "도적 계열", defaultClasses: ["도적", "격투가", "듀얼블레이드"] },
];

const ROLES = ["탱커", "근딜", "원딜", "힐러", "서포터"];

export default function ClassAdminTab() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  // 신규/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "전사 계열",
    role: "근딜",
    title1: "",
    title2: "",
    title3: "",
    titleBase: "",
  });

  // 2차 삭제 확인 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<ClassData | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteInputName, setDeleteInputName] = useState("");

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nexus_classes")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      if (data) {
        const formatted: ClassData[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          role: item.role || "근딜",
          titles: Array.isArray(item.titles) ? item.titles : ["", "", "", item.name],
          category: item.category,
        }));
        setClasses(formatted);
      }
    } catch (err: any) {
      console.error("클래스 데이터 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const getLineageName = (clsName: string, customCategory?: string) => {
    if (customCategory) return customCategory;
    for (const group of LINEAGE_GROUPS) {
      if (group.defaultClasses.includes(clsName)) return group.name;
    }
    return "기타 계열";
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      const { error } = await supabase
        .from("nexus_classes")
        .update({ role: newRole })
        .eq("id", id);

      if (error) throw error;

      setClasses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, role: newRole } : c))
      );
    } catch (err: any) {
      console.error("역할 변경 실패:", err);
      alert(`역할 변경 중 오류가 발생했습니다.\n[원인]: ${err?.message || "알 수 없는 DB 오류"}`);
    }
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      category: "전사 계열",
      role: "근딜",
      title1: "",
      title2: "",
      title3: "",
      titleBase: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassData) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      category: getLineageName(cls.name, cls.category),
      role: cls.role,
      title1: cls.titles[0] || "",
      title2: cls.titles[1] || "",
      title3: cls.titles[2] || "",
      titleBase: cls.titles[3] || cls.name,
    });
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("클래스 이름을 입력해주세요.");

    const payloadTitles = [
      formData.title1.trim() || `${formData.name} 1위`,
      formData.title2.trim() || `${formData.name} 2위`,
      formData.title3.trim() || `${formData.name} 3위`,
      formData.titleBase.trim() || formData.name,
    ];

    try {
      if (editingClass) {
        const { error } = await supabase
          .from("nexus_classes")
          .update({
            name: formData.name.trim(),
            role: formData.role,
            titles: payloadTitles,
            category: formData.category,
          })
          .eq("id", editingClass.id);

        if (error) {
          console.error("Supabase Update Error Details:", error);
          throw error;
        }
      } else {
        const { error } = await supabase.from("nexus_classes").insert({
          name: formData.name.trim(),
          role: formData.role,
          titles: payloadTitles,
          category: formData.category,
          is_active: true,
        });

        if (error) {
          console.error("Supabase Insert Error Details:", error);
          throw error;
        }
      }

      setIsModalOpen(false);
      fetchClassData();
      alert("클래스 정보가 성공적으로 저장되었습니다.");
    } catch (err: any) {
      console.error("클래스 저장 실패 상세:", err);
      alert(`클래스 저장에 실패했습니다.\n[사유]: ${err?.message || err?.details || "Supabase DB 접근 거부 또는 스키마 불일치"}`);
    }
  };

  // 2차 삭제 처리
  const startDelete = (cls: ClassData) => {
    setDeleteTarget(cls);
    setDeleteStep(1);
    setDeleteInputName("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    if (deleteInputName !== deleteTarget.name) {
      alert("클래스 이름이 일치하지 않습니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("nexus_classes")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      setDeleteTarget(null);
      fetchClassData();
      alert("클래스가 삭제되었습니다.");
    } catch (err: any) {
      console.error("클래스 삭제 실패:", err);
      alert(`클래스 삭제 중 오류가 발생했습니다.\n[사유]: ${err?.message || "DB 접근 권한 오류"}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--text-sub)] font-bold animate-pulse">
        클래스 및 랭킹 칭호 카탈로그를 불러오는 중...
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* 헤더 제어 바 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] p-4 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
            클래스 & 5대 역할군 통합 관제 Center
          </h2>
          <p className="text-xs text-[var(--text-sub)] font-bold mt-1">
            21개 이상 직업군의 계열별 매핑, 크라토스 1~3위 전용 칭호 및 시낙시스 파티 매칭 역할을 실시간 제어합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs hover:opacity-90 transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            + 신규 클래스 추가
          </button>
          <button
            onClick={fetchClassData}
            className="px-3 py-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-black text-xs hover:bg-[var(--panel-border)] transition cursor-pointer flex items-center gap-1"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 6대 계열별 그룹 리스트 */}
      <div className="space-y-6">
        {LINEAGE_GROUPS.map((group) => {
          const groupClasses = classes.filter(
            (c) => getLineageName(c.name, c.category) === group.name
          );

          return (
            <div
              key={group.name}
              className="bg-[var(--panel)] border border-[var(--panel-border)] p-4 rounded-2xl shadow-sm space-y-3"
            >
              {/* 계열 헤더 */}
              <div className="border-b border-[var(--panel-border)] pb-2">
                <h3 className="font-black text-base text-[var(--accent)]">
                  {group.name}
                </h3>
              </div>

              {groupClasses.length === 0 ? (
                <div className="text-center py-6 text-xs font-bold text-[var(--text-sub)] bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)]/50">
                  해당 계열에 등록된 클래스가 없습니다.
                </div>
              ) : (
                /* 4열 와이드 그리드 레이아웃 */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {groupClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-3 flex flex-col justify-between space-y-2.5 hover:border-[var(--accent)]/60 transition-all shadow-2xs"
                    >
                      {/* 줄 1: (마크) 클래스명 & 계열 뱃지 */}
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--panel-border)]/50 pb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ClassIcon job={cls.name} size="md" />
                          <span
                            className="font-black text-sm text-[var(--text-main)] whitespace-nowrap overflow-hidden text-ellipsis"
                            title={cls.name}
                          >
                            {cls.name}
                          </span>
                        </div>
                        <span className="text-[0.6rem] font-black px-2 py-0.5 rounded bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] shrink-0">
                          {group.name}
                        </span>
                      </div>

                      {/* 줄 2: 1위 | 2위 | 3위 | 기본 칭호 매트릭스 */}
                      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg p-1.5 space-y-1">
                        <div className="grid grid-cols-4 text-center text-[0.6rem] font-black text-[var(--text-sub)] border-b border-[var(--panel-border)] pb-1">
                          <span>1위</span>
                          <span>2위</span>
                          <span>3위</span>
                          <span>기본</span>
                        </div>
                        <div className="grid grid-cols-4 text-center text-[0.65rem] font-bold gap-0.5">
                          <span className="text-amber-300 truncate" title={cls.titles[0] || '-'}>
                            {cls.titles[0] || '-'}
                          </span>
                          <span className="text-slate-300 truncate" title={cls.titles[1] || '-'}>
                            {cls.titles[1] || '-'}
                          </span>
                          <span className="text-amber-600 truncate" title={cls.titles[2] || '-'}>
                            {cls.titles[2] || '-'}
                          </span>
                          <span className="text-[var(--text-sub)] truncate" title={cls.titles[3] || cls.name}>
                            {cls.titles[3] || cls.name}
                          </span>
                        </div>
                      </div>

                      {/* 줄 3: [ 수정 ] | [ 삭제 ] | [ 역할 드롭다운 ] */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(cls)}
                            className="px-2.5 py-1 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:text-[var(--accent)] font-bold text-[0.7rem] transition cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => startDelete(cls)}
                            className="px-2.5 py-1 rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 hover:bg-rose-900 hover:text-white font-bold text-[0.7rem] transition cursor-pointer"
                          >
                            삭제
                          </button>
                        </div>

                        {/* 고대비 테마 동기화 드롭다운 */}
                        <select
                          value={cls.role}
                          onChange={(e) => handleRoleChange(cls.id, e.target.value)}
                          className="bg-zinc-900 text-zinc-100 border border-zinc-700 font-black text-xs rounded px-2 py-1 outline-none focus:border-[var(--accent)] cursor-pointer shadow-2xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r} className="bg-zinc-900 text-zinc-100 font-bold">
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 클래스 추가 / 수정 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-md w-full p-5 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2.5">
              <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-1.5">
                {editingClass ? "클래스 정보 수정" : "신규 클래스 등록"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-white text-sm font-black p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="text-xs font-black text-[var(--text-sub)] block mb-1">
                  클래스 이름 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 기사, 듀얼블레이드"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black text-[var(--text-sub)] block mb-1">
                    소속 계열
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-900 text-zinc-100 border border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {LINEAGE_GROUPS.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-[var(--text-sub)] block mb-1">
                    기본 역할군
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-zinc-900 text-zinc-100 border border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-[var(--panel-border)]/50">
                <span className="text-xs font-black text-[var(--accent)] block">
                  크라토스 랭킹 칭호 세팅
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[0.62rem] font-bold text-amber-300 block mb-0.5">
                      1위 칭호
                    </label>
                    <input
                      type="text"
                      placeholder="예: 유성천침"
                      value={formData.title1}
                      onChange={(e) => setFormData({ ...formData, title1: e.target.value })}
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[0.62rem] font-bold text-slate-300 block mb-0.5">
                      2위 칭호
                    </label>
                    <input
                      type="text"
                      placeholder="예: 쌍극난무"
                      value={formData.title2}
                      onChange={(e) => setFormData({ ...formData, title2: e.target.value })}
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[0.62rem] font-bold text-amber-600 block mb-0.5">
                      3위 칭호
                    </label>
                    <input
                      type="text"
                      placeholder="예: 질풍쌍화"
                      value={formData.title3}
                      onChange={(e) => setFormData({ ...formData, title3: e.target.value })}
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[0.62rem] font-bold text-[var(--text-sub)] block mb-0.5">
                      기본 칭호
                    </label>
                    <input
                      type="text"
                      placeholder="예: 듀얼블레이드"
                      value={formData.titleBase}
                      onChange={(e) => setFormData({ ...formData, titleBase: e.target.value })}
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--inner-box)] text-[var(--text-sub)] font-bold text-xs hover:text-[var(--text-main)] cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs hover:opacity-90 shadow-md cursor-pointer"
                >
                  {editingClass ? "변경사항 저장" : "신규 클래스 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2차 확인 안전 삭제 모달 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-zinc-950 border border-rose-600/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-3.5 animate-in zoom-in-95 duration-150 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-1.5">
                클래스 삭제 2차 안전 확인
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-zinc-400 hover:text-white text-xs font-black"
              >
                ✕
              </button>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-3">
                <p className="text-xs font-bold leading-relaxed text-zinc-300">
                  <strong className="text-rose-400 font-black">[{deleteTarget.name}]</strong> 클래스를 완전히 삭제하시겠습니까?
                  <br />
                  삭제 시 해당 직업의 크라토스 랭킹 및 파티 매칭 포지션 설정에 영향을 줄 수 있습니다.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow cursor-pointer"
                  >
                    다음 단계 진행 ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold leading-relaxed text-zinc-300">
                  최종 삭제를 확인하기 위해 아래에 <strong className="text-rose-400 font-black">"{deleteTarget.name}"</strong>을(를) 정확히 입력하세요.
                </p>
                <input
                  type="text"
                  placeholder={deleteTarget.name}
                  value={deleteInputName}
                  onChange={(e) => setDeleteInputName(e.target.value)}
                  className="w-full bg-zinc-900 border border-rose-800/80 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteInputName !== deleteTarget.name}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black shadow transition ${
                      deleteInputName === deleteTarget.name
                        ? "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    최종 삭제 실행
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}