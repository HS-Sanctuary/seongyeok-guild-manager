const MARKS: Record<string, string> = {
  "클래스": "장비 마크.svg",
  "생활": "생활 마크.svg",
  "악보": "악기 마크.svg",
  "패션": "패션 마크.svg",
  "시뮬레이터": "스텔라그램 마크.svg",
};
const CONTENT_MARKS: Record<string, string> = {
  "전투": "/svgs/status mark/전투력 마크.svg",
  "나이트메어 드릴 공략": "/svgs/contens mark/나이트메어 드릴 마크.svg",
};

export default function GnosisMark({ name, className = "" }: { name: string; className?: string }) {
  if (name === "전체" || name === "기타") return <span aria-hidden="true" className={className}>{name === "전체" ? "◈" : "◇"}</span>;
  const file = MARKS[name];
  const path = CONTENT_MARKS[name] ?? (file ? `/svgs/UI mark/${file}` : null);
  if (!path) return null;
  const mask = `url("${encodeURI(path)}") center / contain no-repeat`;
  return <span aria-hidden="true" className={`gnosis-svg-mark inline-block h-4 w-4 shrink-0 bg-current ${className}`} style={{ mask, WebkitMask: mask }} />;
}
