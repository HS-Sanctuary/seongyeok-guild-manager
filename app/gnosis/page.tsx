"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ClassIcon from "@/components/common/ClassIcon";
import GnosisMark from "@/components/gnosis/GnosisMark";
import GnosisClassFilter, { classGroupLabel } from "@/components/gnosis/GnosisClassFilter";
import { GNOSIS_LIFE_CATEGORIES, GNOSIS_COMBAT_CATEGORIES, gnosisCategoryLabel, matchesGnosisSection, type GnosisSection } from "@/lib/gnosisCategories";
import { useGnosisNavigation } from "@/hooks/useGnosisNavigation";
import { gnosisDisplayLabel } from "@/lib/gnosisNavigation";
import { gnosisExcerpt } from "@/lib/gnosisLocal";
import "./gnosis.css";

type ClassGroup = { name: string; classes: string[] };
type Guide = {
  id: number | string;
  title: string;
  content: string;
  sub_category: string;
  author: string;
  title_name?: string;
  created_at: string;
  likes?: number;
  youtube_id?: string | null;
  is_spoiler?: boolean;
  hide_media?: boolean;
  item_data?: unknown;
  content_format?: string;
};
const DEFAULT_CLASS_GROUPS: ClassGroup[] = [
  { name: "전사 계열", classes: ["전사", "대검전사", "검술사", "기사"] },
  { name: "마법사 계열", classes: ["마법사", "화염술사", "빙결술사", "전격술사"] },
  { name: "궁수 계열", classes: ["궁수", "장궁병", "석궁사수"] },
  { name: "힐러 계열", classes: ["힐러", "사제", "수도사", "암흑술사"] },
  { name: "음유시인 계열", classes: ["음유시인", "댄서", "악사"] },
  { name: "도적 계열", classes: ["도적", "격투가", "듀얼블레이드"] },
];
const ICONS: Record<string, string> = { "전체": "◈", "기타": "◇", "채집": "🌿", "가공": "⚙", "제작": "🔨", "데코": "🏡", "마이홈": "🏠" };

function isGuide(value: unknown): value is Guide {
  if (!value || typeof value !== "object") return false;
  const guide = value as Partial<Guide>;
  return (typeof guide.id === "number" || typeof guide.id === "string") &&
    typeof guide.title === "string" && typeof guide.content === "string" &&
    typeof guide.author === "string" && typeof guide.sub_category === "string" && typeof guide.created_at === "string";
}

export default function GnosisPage() {
  const { items: navigation } = useGnosisNavigation();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [classGroups, setClassGroups] = useState(DEFAULT_CLASS_GROUPS);
  const [section, setSection] = useState<GnosisSection>("전체");
  const [activeFilter, setActiveFilter] = useState("전체");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [playingVideoId, setPlayingVideoId] = useState<Guide["id"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGuides() {
      await Promise.resolve();
      try {
        const stored = localStorage.getItem("gnosis_mock_db");
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) throw new Error("Invalid local guide list");
        let next = parsed.filter(isGuide);
        if (parsed.length > 0 && next.length !== parsed.length) throw new Error("Invalid local guide record");
        if (next.length === 0) {
          next = [{ id: 2, title: "도적 신규 스킬트리 및 딜사이클 가이드", content: "도적 클래스의 핵심 딜사이클과 스킬 트리 및 장비 세팅 추천입니다.", sub_category: "도적", author: "한설", title_name: "성역 길드마스터", created_at: new Date(Date.now() - 86400000).toISOString(), likes: 112, youtube_id: "dQw4w9WgXcQ", is_spoiler: false, hide_media: false }];
          localStorage.setItem("gnosis_mock_db", JSON.stringify(next));
        }
        if (!cancelled) setGuides(next);
      } catch {
        if (!cancelled) setStorageError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    async function loadClasses() {
      try {
        const { data, error } = await supabase.from("nexus_classes").select("*");
        if (cancelled || error || !data) return;
        const groups = DEFAULT_CLASS_GROUPS.map(group => ({ ...group, classes: [...group.classes] }));
        const known = new Set(groups.flatMap(group => group.classes));
        for (const item of data) {
          if (typeof item.name !== "string" || !item.name || known.has(item.name)) continue;
          const rawGroup = item.group_name || item.category;
          const groupName = typeof rawGroup === "string" ? rawGroup : "신규 계열";
          let group = groups.find(candidate => candidate.name === groupName);
          if (!group) { group = { name: groupName, classes: [] }; groups.push(group); }
          group.classes.push(item.name);
          known.add(item.name);
        }
        setClassGroups(groups);
      } catch { /* Default categories remain usable when the catalog is unavailable. */ }
    }
    void loadGuides();
    void loadClasses();
    return () => { cancelled = true; };
  }, []);

  const classNames = new Set(classGroups.flatMap(group => group.classes));
  const selectedGroup = classGroups.find(group => group.name === openGroup);
  const query = searchTerm.trim().toLocaleLowerCase();
  const filteredGuides = guides.filter(guide => matchesGnosisSection(section, guide, classNames))
    .filter(guide => activeFilter !== "전체" ? guide.sub_category === activeFilter : section === "클래스" && selectedGroup ? selectedGroup.classes.includes(guide.sub_category) : true)
    .filter(guide => `${guide.title} ${guide.author} ${guide.sub_category}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => sortOrder === "latest" ? Date.parse(b.created_at) - Date.parse(a.created_at) : Date.parse(a.created_at) - Date.parse(b.created_at));
  const listTitle = activeFilter !== "전체" ? activeFilter : section === "클래스" && selectedGroup ? classGroupLabel(selectedGroup.name) : gnosisDisplayLabel(section, navigation);

  function chooseSection(next: GnosisSection) {
    setSection(next); setActiveFilter("전체"); setOpenGroup(null); setPlayingVideoId(null);
  }
  function chooseFilter(next: string) {
    setActiveFilter(next); setPlayingVideoId(null);
  }
  function categoryIcon(category: string) {
    if (category === "나이트메어 드릴 공략") return <GnosisMark name={category} />;
    const label = GNOSIS_COMBAT_CATEGORIES.includes(category) ? "전투" : gnosisCategoryLabel(category);
    if (classNames.has(category)) return <ClassIcon job={category} size="xs" />;
    const item = navigation.find(item => item.key === label);
    if (item) return <GnosisMark name={item.icon} />;
    return <span aria-hidden="true">{ICONS[label] || "◇"}</span>;
  }

  return (
    <main className="gnosis-board">
      <div className="gnosis-shell">
        <header className="gnosis-heading">
          <div className="gnosis-heading-copy">
            <div className="gnosis-brandline"><h1>GNOSIS</h1><span>그노시스 · 길드 자료실</span></div>
            <p>성역의 경험과 공략, 코디와 취향을 나누는 공간</p>
          </div>
          <Link href="/gnosis/dressroom" className="gnosis-fashion-link"><GnosisMark name="시뮬레이터" /><span>패션 시뮬레이터</span></Link>
        </header>
        <div className="gnosis-workspace">
          <aside className="gnosis-categories" aria-label="게시글 분류">
            <div className="gnosis-category-heading"><h2>둘러보기</h2><span>{guides.length}</span></div>
            <nav aria-label="게시글 분야" className="gnosis-sections">
              {navigation.map(item => <button key={item.key} type="button" aria-pressed={section === item.key} onClick={() => chooseSection(item.key)} className={section === item.key ? "is-active" : ""}><span aria-hidden="true" className="gnosis-section-icon"><GnosisMark name={item.icon} /></span><span>{item.label}</span></button>)}
            </nav>
            <p className="gnosis-sidebar-note">함께 쌓아가는 성역의 기록.<br />작은 발견도 함께 나눠주세요.</p>
          </aside>
          <section className="gnosis-results" aria-labelledby="gnosis-list-title">
            {section === "전투" && <div className="gnosis-life-filter" aria-label="전투 분류"><button type="button" aria-pressed={activeFilter === "전체"} className={activeFilter === "전체" ? "is-active" : ""} onClick={() => chooseFilter("전체")}>{gnosisDisplayLabel("전투", navigation)} 전체</button>{GNOSIS_COMBAT_CATEGORIES.map(name => <button key={name} type="button" aria-pressed={activeFilter === name} className={activeFilter === name ? "is-active" : ""} onClick={() => chooseFilter(name)}>{name === "나이트메어 드릴 공략" && <GnosisMark name={name} />}{name}</button>)}</div>}
            {section === "클래스" && <GnosisClassFilter classLabel={gnosisDisplayLabel("클래스", navigation)} groups={classGroups} selectedGroup={openGroup} activeClass={activeFilter} onChooseGroup={name => { setOpenGroup(name); chooseFilter("전체"); }} onChooseClass={chooseFilter} />}
            {section === "생활" && <div className="gnosis-life-filter" aria-label="생활 분류"><button type="button" aria-pressed={activeFilter === "전체"} className={activeFilter === "전체" ? "is-active" : ""} onClick={() => chooseFilter("전체")}>{gnosisDisplayLabel("생활", navigation)} 전체</button>{GNOSIS_LIFE_CATEGORIES.map(name => <button key={name} type="button" aria-pressed={activeFilter === name} className={activeFilter === name ? "is-active" : ""} onClick={() => chooseFilter(name)}>{categoryIcon(name)}<span>{name}</span></button>)}</div>}
            <div className="gnosis-list-toolbar">
              <div className="gnosis-list-heading"><h2 id="gnosis-list-title">{listTitle}</h2><span role="status" aria-live="polite">{loading ? "불러오는 중" : `${filteredGuides.length}개`}</span></div><Link href="/gnosis/write" className="gnosis-write-link"><span aria-hidden="true">＋</span>공략 글쓰기</Link>
              <div className="gnosis-search-tools">
                <div className="gnosis-search"><label className="gnosis-sr-only" htmlFor="gnosis-search">게시글 검색</label><span aria-hidden="true">⌕</span><input id="gnosis-search" type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="제목, 작성자, 직업 검색" /></div>
                <label className="gnosis-sr-only" htmlFor="gnosis-sort">정렬 순서</label><select id="gnosis-sort" value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="latest">최신순</option><option value="oldest">등록순</option></select>
              </div>
            </div>
            {storageError ? <div className="gnosis-empty" role="alert"><h3>저장된 글을 불러오지 못했어요</h3><p>기존 기기 기록은 그대로 보존했어요. 새로고침 후 다시 확인해주세요.</p></div> : loading ? <div className="gnosis-empty"><p>게시글을 불러오고 있어요.</p></div> : filteredGuides.length === 0 ? <div className="gnosis-empty"><span aria-hidden="true">◇</span><h3>{query ? "검색 결과가 없어요" : "아직 등록된 글이 없어요"}</h3><p>{query ? "다른 검색어나 분류로 다시 찾아보세요." : "알고 있는 팁을 첫 번째 글로 남겨보세요."}</p>{(query || activeFilter !== "전체" || section !== "전체") && <button type="button" onClick={() => { setSearchTerm(""); chooseSection("전체"); }}>전체</button>}</div> : <div className="gnosis-guide-list">{filteredGuides.map(guide => {
              const hasVideo = Boolean(guide.youtube_id && /^[\w-]{11}$/.test(guide.youtube_id) && !guide.hide_media && !guide.is_spoiler);
              const date = new Date(guide.created_at);
              const dateLabel = Number.isNaN(date.getTime()) ? "날짜 미상" : date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
              return <article key={guide.id} className="gnosis-guide">
                <div className="gnosis-guide-line">
                  <div className="gnosis-guide-copy"><div className="gnosis-guide-badges"><span className="gnosis-category-badge">{categoryIcon(guide.sub_category)}{gnosisDisplayLabel(guide.sub_category, navigation)}</span>{guide.is_spoiler && <span className="gnosis-spoiler-badge">스포일러</span>}{guide.hide_media && <span>미디어 숨김</span>}</div><h3><Link href={`/gnosis/${encodeURIComponent(String(guide.id))}`} target="_blank" rel="noopener noreferrer">{guide.is_spoiler ? "스포일러가 포함된 글입니다" : guide.title}<span className="gnosis-sr-only"> (새 탭)</span></Link></h3>{!guide.is_spoiler && <p className="gnosis-guide-summary">{gnosisExcerpt(guide.content, guide.content_format === "markdown")}</p>}<div className="gnosis-guide-meta"><span className="gnosis-author" title={guide.title_name}>{guide.author}</span><time dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()}>{dateLabel}</time><span className="gnosis-likes"><span aria-hidden="true">♡</span><span className="gnosis-sr-only">추천 </span>{guide.likes || 0}</span></div></div>
                  {hasVideo && <button type="button" className="gnosis-video-button" aria-label={`${guide.title} 영상 ${playingVideoId === guide.id ? "닫기" : "미리보기"}`} aria-expanded={playingVideoId === guide.id} onClick={() => setPlayingVideoId(playingVideoId === guide.id ? null : guide.id)}><span aria-hidden="true">▷</span><span>{playingVideoId === guide.id ? "영상 닫기" : "영상 보기"}</span></button>}
                </div>
                {hasVideo && playingVideoId === guide.id && <div className="gnosis-video"><iframe title={`${guide.title} 영상`} src={`https://www.youtube.com/embed/${guide.youtube_id}?autoplay=1&mute=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>}
              </article>;
            })}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
