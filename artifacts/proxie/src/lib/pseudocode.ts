export type NoteBlock = { kind: "prose"; text: string } | {
  kind: "code"; text: string; lines: string[]; inferred: boolean;
};

const assignment = /(?:←|:=|<-(?!>)|\b[A-Za-z_]\w*(?:\[[^\]\n]+\])*\s*=(?!=))/;
const loop = /^(?:\d+[.:)]?\s+)?(?:for\s+(?:each\b|all\b|every\b|\(|\w+\s*(?:=|←|:=|in\b|from\b))|while\b.+(?:\bdo\b|:|[<>=]))/i;
const control = /^(?:\d+[.:)]?\s+)?(?:for\b|while\b|if\b|else\b|return\b|repeat\b|until\b|end\b|function\b|procedure\b)/i;
const end = /^(?:end(?:\s*(?:for|while|if|function|procedure))?|endif|endfor|endwhile)\b/i;

function unindent(text: string): string[] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[0]!.trim()) lines.shift();
  while (lines.length && !lines.at(-1)!.trim()) lines.pop();
  const margin = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length), 80);
  return lines.map(line => line.slice(margin).trimEnd());
}

function looksLikeCode(lines: string[]) {
  const meaningful = lines.map(line => line.trim()).filter(Boolean);
  const structures = meaningful.filter(line => control.test(line)).length;
  const assignments = meaningful.filter(line => /←|:=|<-(?!>)/.test(line)
    || /^(?:\d+[.:)]?\s+)?(?:let\s+)?[A-Za-z_]\w*(?:\[[^\]\n]+\])*\s*=(?!=)/i.test(line)).length;
  const structuredLoop = meaningful.some(line => loop.test(line) && /(?:\bdo\b|[(:∈<>=←])/.test(line))
    || meaningful.some(line => end.test(line));
  return meaningful.length >= 2 && structures >= 1
    && (assignments >= 1 || (structures >= 2 && structuredLoop));
}

/** Only infer nesting when explicit terminators are present; otherwise preserve source indentation. */
function codeBlock(text: string, inferred = false): NoteBlock {
  let lines = unindent(text);
  if (!lines.some(line => /^\s+\S/.test(line)) && lines.some(line => end.test(line.trim()))) {
    let depth = 0;
    lines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const closing = end.test(trimmed) || /^(?:else\b|until\b)/i.test(trimmed);
      if (closing) depth = Math.max(0, depth - 1);
      const formatted = "  ".repeat(Math.min(depth, 20)) + trimmed;
      if (/^(?:for\b|while\b|if\b|function\b|procedure\b|repeat\b|else\b)/i.test(trimmed)) depth++;
      return formatted;
    });
    inferred = true;
  }
  return { kind: "code", text, lines, inferred };
}

function unfenced(text: string): NoteBlock[] {
  if (!text.trim()) return [];
  const lines = unindent(text);
  if (lines.length > 1 && looksLikeCode(lines)) {
    const firstCode = lines.findIndex(line => control.test(line.trim()) || assignment.test(line));
    // Keep the algorithm's title/introduction outside the code, without deleting any source text.
    const introduction = lines.slice(0, firstCode).join("\n");
    return [
      ...(introduction.trim() ? [{ kind: "prose" as const, text: introduction }] : []),
      codeBlock(lines.slice(firstCode).join("\n")),
    ];
  }
  // Older PDFs were joined with spaces. Split only at explicit statement markers,
  // not at arbitrary words or mathematical operators inside an expression.
  if (lines.length === 1) {
    const marker = /\b(?:for\s+(?:each\b|all\b|every\b|\(|[A-Za-z_]\w*\s*(?:=|←|:=|in\b|from\b))|while\s+(?=[^\n]*?(?:\bdo\b|:))|if\s+(?=[^\n]*?\bthen\b)|else\b|return\b|end\s*(?:for|if|while|function|procedure)\b|(?:function|procedure)\s+\w+\s*\()/gi;
    const starts = [...text.matchAll(marker)].map(match => match.index!);
    if (starts.length >= 2) {
      const initialization = /\b[A-Za-z_]\w*(?:\[[^\]\n]{1,80}\])*\s*(?:←|:=|<-(?!>)|=(?!=))/.exec(text.slice(0, starts[0]));
      if (initialization) starts.unshift(initialization.index);
      const segments = starts.map((at, index) => text.slice(at, starts[index + 1] ?? text.length).trim());
      const split = segments.flatMap(segment => {
        const body = /^(.*?\b(?:do|then)\b)\s+(.+)$/i.exec(segment);
        return body ? [body[1]!, `  ${body[2]!}`] : [segment];
      });
      if (looksLikeCode(split)) {
        const intro = text.slice(0, starts[0]).trim();
        return [
          ...(intro ? [{ kind: "prose" as const, text: intro }] : []),
          { ...codeBlock(split.join("\n"), true), text },
        ];
      }
    }
  }
  return [{ kind: "prose", text }];
}

/** Fenced algorithms are explicit; unfenced text needs multiple independent code signals. */
export function formatNoteText(text: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  const fence = /```[^\n`]*\r?\n([\s\S]*?)```/g;
  let at = 0;
  for (const match of text.matchAll(fence)) {
    blocks.push(...unfenced(text.slice(at, match.index)));
    blocks.push(codeBlock(match[1]!));
    at = match.index! + match[0].length;
  }
  blocks.push(...unfenced(text.slice(at)));
  return blocks;
}
