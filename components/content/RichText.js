/**
 * Renders CMS page bodies written in light markdown (## / ### headings, "- " lists, blank-line
 * paragraphs, **bold**). Everything is rendered as text nodes — HTML in the source is shown
 * literally, never interpreted — so admin content cannot inject markup or scripts.
 */
function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i} className="font-medium text-ink">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}

function blocks(src) {
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list) out.push({ type: "ul", items: list });
    list = null;
  };
  for (const raw of String(src || "").replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara();
      flushList();
      out.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push({ type: "h2", text: line.slice(3) });
    } else if (/^[-*] /.test(line)) {
      flushPara();
      (list ||= []).push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

export default function RichText({ source }) {
  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed text-ink-soft">
      {blocks(source).map((b, i) => {
        if (b.type === "h2") return <h2 key={i} className="font-display pt-4 text-2xl text-ink">{b.text}</h2>;
        if (b.type === "h3") return <h3 key={i} className="pt-2 text-base font-medium text-ink">{b.text}</h3>;
        if (b.type === "ul") return <ul key={i} className="list-disc space-y-1.5 pl-5">{b.items.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ul>;
        return <p key={i}><Inline text={b.text} /></p>;
      })}
    </div>
  );
}
