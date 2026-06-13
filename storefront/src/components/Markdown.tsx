/**
 * Markdown — a tiny, dependency-free, XSS-safe renderer for admin-authored legal
 * copy. Supports: #/##/### headings, - / * and 1. lists, **bold**, *italic*,
 * [text](url) links, --- rules, and blank-line paragraphs. Output is real React
 * elements (never dangerouslySetInnerHTML), so untrusted input can't inject HTML.
 */
import React from 'react';
import { Link } from 'react-router-dom';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      nodes.push(<strong key={`${keyPrefix}-${i}`}>{m[2]}</strong>);
    } else if (m[3]) {
      const href = m[5];
      const external = /^https?:\/\//i.test(href);
      nodes.push(
        external ? (
          <a key={`${keyPrefix}-${i}`} href={href} target="_blank" rel="noopener noreferrer" className="text-action-blue underline">{m[4]}</a>
        ) : (
          <Link key={`${keyPrefix}-${i}`} to={href} className="text-action-blue underline">{m[4]}</Link>
        ),
      );
    } else if (m[6]) {
      nodes.push(<em key={`${keyPrefix}-${i}`}>{m[7]}</em>);
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let key = 0;
  let i = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p-${key++}`} className="mb-4 leading-[1.7]">{renderInline(para.join(' '), `pi-${key}`)}</p>);
      para = [];
    }
  };

  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flushPara(); i++; continue; }
    if (/^---+$/.test(t)) { flushPara(); blocks.push(<hr key={`hr-${key++}`} className="my-8 border-outline-variant/40" />); i++; continue; }

    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) {
      flushPara();
      const lvl = h[1].length;
      const cls = lvl === 1
        ? 'text-2xl md:text-3xl font-extrabold text-primary mt-8 mb-4'
        : lvl === 2
          ? 'text-xl md:text-2xl font-bold text-primary mt-8 mb-3'
          : 'text-lg font-bold text-on-surface mt-6 mb-2';
      blocks.push(React.createElement(`h${lvl + 1}`, { key: `h-${key++}`, className: cls }, renderInline(h[2], `hi-${key}`)));
      i++; continue;
    }

    if (/^[-*]\s+/.test(t)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++; }
      blocks.push(<ul key={`ul-${key++}`} className="list-disc pl-6 mb-4 space-y-1.5">{items.map((it, idx) => <li key={idx}>{renderInline(it, `uli-${key}-${idx}`)}</li>)}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(t)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; }
      blocks.push(<ol key={`ol-${key++}`} className="list-decimal pl-6 mb-4 space-y-1.5">{items.map((it, idx) => <li key={idx}>{renderInline(it, `oli-${key}-${idx}`)}</li>)}</ol>);
      continue;
    }

    para.push(t);
    i++;
  }
  flushPara();

  return <div className="text-on-surface-variant text-[15px] md:text-[16px]">{blocks}</div>;
}
