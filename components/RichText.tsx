import { Fragment, type ReactNode } from "react";

// Markup: __underlined__ and per-kanji furigana like 漢(かん)字(じ).
const TOKEN = /__(.+?)__|([\u4e00-\u9fff々])\(([\u3041-\u3096ー]+)\)/g;

function parse(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) {
      nodes.push(<u key={key}>{parse(m[1], key)}</u>);
    } else {
      nodes.push(
        <ruby key={key}>
          {m[2]}
          <rt>{m[3]}</rt>
        </ruby>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {parse(line, String(i))}
        </Fragment>
      ))}
    </>
  );
}
