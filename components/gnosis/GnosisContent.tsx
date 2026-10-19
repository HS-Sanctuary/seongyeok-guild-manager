import { Fragment } from "react";
import GnosisRichContent from "./GnosisRichContent";

function inline(text: string) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|~~[^~\n]+~~|\+\+[^+\n]+\+\+|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g);
  return parts.map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.length > 4 && part.startsWith("~~") && part.endsWith("~~")) return <s key={index}>{part.slice(2, -2)}</s>;
    if (part.length > 4 && part.startsWith("++") && part.endsWith("++")) return <u key={index}>{part.slice(2, -2)}</u>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
export default function GnosisContent({ content, formatted = false, richDoc }: { content: string; formatted?: boolean; richDoc?: unknown }) {
  if (Array.isArray(richDoc)) return <GnosisRichContent value={richDoc} />;
  if (!formatted) return <div className="gnosis-prose gnosis-plain">{content}</div>;
  return <div className="gnosis-prose">{content.split("\n").map((line, index) => {
    if (line.startsWith("## ")) return <h2 key={index}>{inline(line.slice(3))}</h2>;
    if (line.startsWith("> ")) return <blockquote key={index}>{inline(line.slice(2))}</blockquote>;
    if (line.startsWith("- ")) return <p className="gnosis-bullet" key={index}>• {inline(line.slice(2))}</p>;
    return <p key={index}>{line ? inline(line) : <br />}</p>;
  })}</div>;
}
