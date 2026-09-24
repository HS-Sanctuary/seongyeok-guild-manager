"use client";
import { useState, useEffect } from "react";
import { adminCatalogRead, adminCatalogWrite } from "@/lib/adminCatalogClient";
import {
  MISSION_TOWNS,
  TOWN_SHORT,
  type Mission,
  type Reward,
} from "@/lib/kronos";

const input =
  "w-full min-w-0 rounded-lg border border-[var(--panel-border)] bg-[var(--inner-box)] p-2 text-sm text-[var(--text-main)]";
export default function MissionAdminTab() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [town, setTown] = useState<string>(MISSION_TOWNS[0]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [limit, setLimit] = useState(3);
  const [rewards, setRewards] = useState<Reward[]>([{ name: "", count: 1 }]);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    try {
      const data = await adminCatalogRead<Mission>("kronos_missions");
      setMissions(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    let active = true;
    adminCatalogRead<Mission>("kronos_missions")
      .then((data) => {
        if (active) setMissions(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function clear() {
    setTitle("");
    setDescription("");
    setLimit(3);
    setRewards([{ name: "", count: 1 }]);
    setEditId(null);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await adminCatalogWrite(
        "kronos_missions",
        editId === null ? "insert" : "update",
        {
          town,
          title: title.trim(),
          description: description.trim(),
          max_count: limit,
          rewards: rewards.map((r) => ({ ...r, name: r.name.trim() })),
          is_active: true,
        },
        editId ?? undefined,
      );
      clear();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number) {
    if (busy || !confirm("이 임무를 삭제할까요?")) return;
    setBusy(true);
    try {
      await adminCatalogWrite("kronos_missions", "delete", undefined, id);
      await load();
      if (editId === id) clear();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-black text-[var(--accent)]">
        📜 마을 임무 게시판 관리
      </h2>
      <p className="text-sm text-[var(--text-sub)]">
        캐릭터별 달성 횟수는 매주 월요일 오전 06시(한국 시간)에 초기화됩니다.
        보상은 최대 6개입니다.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}{" "}
          <button onClick={load} className="underline">
            다시 조회
          </button>
        </p>
      )}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {MISSION_TOWNS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTown(t);
              clear();
            }}
            aria-pressed={town === t}
            className={
              town === t
                ? "rounded-lg p-2 bg-[var(--accent)] text-[var(--accent-fg)]"
                : "rounded-lg p-2 border border-[var(--panel-border)]"
            }
          >
            <span className="md:hidden">{TOWN_SHORT[t]}</span>
            <span className="hidden md:inline">{t}</span>
          </button>
        ))}
      </div>
      <form
        onSubmit={save}
        className="rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-3"><h3 className="font-bold text-[var(--accent)]">{editId === null ? `${town} 임무 등록` : `${town} 임무 수정`}</h3><span className="text-xs text-[var(--text-sub)]">캐릭터별 · 월요일 06시 초기화</span></div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
        <label className="block text-sm font-bold">
          임무 제목
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={input + " mt-1 font-normal"}
          />
        </label>
        <label className="block text-sm font-bold">
          주간 달성 횟수
          <input
            required
            type="number"
            min={1}
            max={9999}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className={input + " mt-1 font-normal"}
          />
        </label>
        </div>
        <label className="block text-sm font-bold">
          임무 내용
          <textarea
            required
            maxLength={3000}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={input + " mt-1 font-normal"}
          />
        </label>
        <fieldset className="space-y-2 rounded-lg border border-[var(--panel-border)] p-3">
          <legend className="px-1 text-sm font-bold text-[var(--accent)]">달성 보상 · 최대 6개</legend>
          {rewards.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="w-5 text-center text-xs font-bold text-[var(--text-sub)]">{i + 1}</span>
              <input
                aria-label={"보상 " + (i + 1) + " 이름"}
                required
                maxLength={100}
                placeholder="아이템/재화 이름"
                value={r.name}
                onChange={(e) =>
                  setRewards((old) =>
                    old.map((v, j) =>
                      j === i ? { ...v, name: e.target.value } : v,
                    ),
                  )
                }
                className={input + " flex-1 basis-40"}
              />
              <input
                aria-label={"보상 " + (i + 1) + " 수량"}
                required
                type="number"
                min={1}
                max={1000000000}
                value={r.count}
                onChange={(e) =>
                  setRewards((old) =>
                    old.map((v, j) =>
                      j === i ? { ...v, count: Number(e.target.value) } : v,
                    ),
                  )
                }
                className={input + " !w-28"}
              />
              <button
                type="button"
                disabled={rewards.length === 1}
                onClick={() =>
                  setRewards((old) => old.filter((_, j) => j !== i))
                }
                className="rounded-md border border-[var(--panel-border)] px-2 py-2 text-xs text-red-400 disabled:opacity-30"
              >
                제거
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={rewards.length >= 6}
            onClick={() =>
              setRewards((old) => [...old, { name: "", count: 1 }])
            }
            className="rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm font-bold text-[var(--accent)] disabled:opacity-30"
          >
            + 보상 추가
          </button>
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] px-4 py-2 font-bold disabled:opacity-50"
          >
            {busy
              ? "저장 중…"
              : editId === null
                ? town + "에 임무 등록"
                : "수정 저장"}
          </button>
          {editId !== null && (
            <button type="button" onClick={clear} className="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm">
              수정 취소
            </button>
          )}
        </div>
      </form>
      <input
        aria-label="임무 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="제목 / 내용 / 보상 검색"
        className={input}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {missions
          .filter(
            (m) =>
              m.town === town &&
              [m.title, m.description, ...m.rewards.map((r) => r.name)]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((m) => (
            <article
              key={m.id}
              className="min-w-0 rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-4 text-sm space-y-3 break-words [overflow-wrap:anywhere]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold text-[var(--accent)]">{m.title}</h3><span className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-xs">주간 {m.max_count}회</span></div>
              <p className="whitespace-pre-wrap text-[var(--text-sub)]">{m.description}</p>
              <div className="border-t border-[var(--panel-border)] pt-2"><p className="mb-2 text-xs font-bold text-[var(--text-sub)]">달성 보상</p><div className="flex flex-wrap gap-2">{m.rewards.map((r, index) => <span key={index} className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-[var(--accent)]">{r.name} × {r.count.toLocaleString()}</span>)}</div></div>
              <div className="flex gap-2 border-t border-[var(--panel-border)] pt-2">
                <button
                  disabled={busy}
                  onClick={() => {
                    setEditId(m.id);
                    setTitle(m.title);
                    setDescription(m.description);
                    setLimit(m.max_count);
                    setRewards(m.rewards);
                  }}
                  className="rounded-md border border-[var(--panel-border)] px-3 py-1.5 font-bold text-[var(--accent)]"
                >
                  수정
                </button>
                <button
                  disabled={busy}
                  onClick={() => remove(m.id)}
                  className="rounded-md border border-red-400/30 px-3 py-1.5 font-bold text-red-400"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
      </div>
      {!error && missions.filter((m) => m.town === town).length === 0 && (
        <p className="text-sm text-[var(--text-sub)]">
          이 마을에 등록된 임무가 없습니다.
        </p>
      )}
    </section>
  );
}
