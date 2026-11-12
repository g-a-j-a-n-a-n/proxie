import type { ReactNode } from "react";
import type { NoteBlock } from "@/lib/pseudocode";
import "./pseudocode-block.css";

const keywords = /\b(for|each|all|while|do|if|then|else|return|repeat|until|end|endif|endfor|endwhile|function|procedure|input|output|to|in|from|and|or|not|true|false)\b/gi;

function highlight(line: string): ReactNode[] {
  const result: ReactNode[] = [];
  let at = 0;
  for (const match of line.matchAll(keywords)) {
    result.push(line.slice(at, match.index));
    result.push(<span className="pseudocode-keyword" key={match.index}>{match[0]}</span>);
    at = match.index! + match[0].length;
  }
  result.push(line.slice(at));
  return result;
}

export function PseudocodeBlock({ block }: { block: Extract<NoteBlock, { kind: "code" }> }) {
  return (
    <figure className="pseudocode-block" data-testid="pseudocode-block">
      <figcaption>Pseudocode / algorithm</figcaption>
      <pre tabIndex={0} aria-label="Pseudocode, scroll horizontally for long lines"><code>
        {block.lines.map((line, i) => <span className="pseudocode-line" key={i}><span className="pseudocode-number" aria-hidden="true">{i + 1}</span><span>{highlight(line)}{"\n"}</span></span>)}
      </code></pre>
      {block.inferred && <details className="pseudocode-original">
        <summary>Layout reconstructed · view original text</summary>
        <p>Line breaks or indentation were inferred. Check the cited source for exact nesting.</p>
        <pre tabIndex={0} aria-label="Original extracted algorithm text">{block.text}</pre>
      </details>}
    </figure>
  );
}
