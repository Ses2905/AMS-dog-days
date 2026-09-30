import type { ReactNode } from "react";

/** Plain-text answers with light structure: "#" headings, "-" bullets, numbered lines. No HTML is ever inserted. */
export function Prose({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  const flush = () => {
    if (list.length === 0) return;
    const items = list.map((l, i) => <li key={i}>{l}</li>);
    blocks.push(ordered ? <ol key={blocks.length} className="list-decimal space-y-1 pl-5">{items}</ol> : <ul key={blocks.length} className="list-disc space-y-1 pl-5">{items}</ul>);
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim().replace(/\*\*/g, "");
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const num = line.match(/^\d+[.)]\s+(.*)/);
    const head = line.match(/^#{1,4}\s+(.*)/);
    if (bullet || num) {
      const isOrdered = !!num;
      if (list.length && isOrdered !== ordered) flush();
      ordered = isOrdered;
      list.push((bullet ?? num)![1]);
      continue;
    }
    flush();
    if (head) blocks.push(<h3 key={blocks.length} className="font-display mt-2 text-lg font-semibold uppercase tracking-wide">{head[1]}</h3>);
    else if (line) blocks.push(<p key={blocks.length}>{line}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}
