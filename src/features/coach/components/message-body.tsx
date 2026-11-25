import Link from "next/link";
import type { ReactNode } from "react";

const linkPattern =
  /\[([^\]]+)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(linkPattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const [, label, href, bold, code] = match;
    const key = `${keyPrefix}-${index++}`;
    if (label && href) {
      nodes.push(
        href.startsWith("/") ? (
          <Link
            key={key}
            href={href}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {label}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            {label}
          </a>
        ),
      );
    } else if (bold) {
      nodes.push(<strong key={key}>{bold}</strong>);
    } else if (code) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          {code}
        </code>,
      );
    }
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MessageBody({ text }: { text: string }) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .filter((b) => b.trim().length);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        if (lines.length >= 2 && lines.every((line) => line.trim().startsWith("|"))) {
          const rows = lines
            .map((line) =>
              line
                .trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((cell) => cell.trim()),
            )
            .filter((cells) => !cells.every((cell) => /^:?-{2,}:?$/.test(cell)));
          const [head, ...body] = rows;
          return (
            <div
              key={blockIndex}
              className="overflow-x-auto rounded-lg ring-1 ring-foreground/10"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {head.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="px-3 py-2 text-left font-mono text-xs font-normal tracking-wide text-muted-foreground uppercase"
                      >
                        {inline(cell, `${blockIndex}-h-${cellIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {body.map((cells, rowIndex) => (
                    <tr key={rowIndex}>
                      {cells.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 align-top tabular-nums">
                          {inline(cell, `${blockIndex}-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const isList = lines.every((line) => /^\s*([-*•]|\d+[.)])\s+/.test(line));
        if (isList) {
          const ordered = /^\s*\d+[.)]/.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag
              key={blockIndex}
              className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-muted-foreground`}
            >
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {inline(
                    line.replace(/^\s*([-*•]|\d+[.)])\s+/, ""),
                    `${blockIndex}-${lineIndex}`,
                  )}
                </li>
              ))}
            </Tag>
          );
        }
        const heading = block.match(/^#{1,3}\s+(.+)$/);
        if (heading) {
          return (
            <p
              key={blockIndex}
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              {heading[1]}
            </p>
          );
        }
        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {inline(line, `${blockIndex}-${lineIndex}`)}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
