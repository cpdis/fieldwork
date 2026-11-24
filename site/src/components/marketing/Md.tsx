import type { ReactNode } from 'react';

/** A small Markdown subset for captured replies: paragraphs, headings as bold lines, - and 1. lists, pipe tables, **bold**. */

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <b key={i++}>{m[1]}</b> : <code key={i++}>{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

export function Md({ text }: { text: string }) {
  // Pull ``` fences out first so their blank lines don't split them into paragraphs.
  const parts = text.replace(/\r/g, '').split(/```[^\n]*\n([\s\S]*?)\n?```/);
  return (
    <div className="md">
      {parts.map((part, pi) =>
        pi % 2 === 1 ? (
          <pre className="md-pre" key={pi}>
            {part}
          </pre>
        ) : (
          <Blocks key={pi} text={part} />
        ),
      )}
    </div>
  );
}

function Blocks({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines.length >= 2 && /^\s*\|/.test(lines[0]) && /^\s*\|?\s*:?-{2,}/.test(lines[1])) {
          const head = cells(lines[0]);
          const rows = lines.slice(2).map(cells);
          return (
            <div className="md-tbl" key={bi}>
              <table>
                <thead>
                  <tr>
                    {head.map((h, i) => (
                      <th key={i}>{inline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td key={ci}>{inline(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ''))}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
