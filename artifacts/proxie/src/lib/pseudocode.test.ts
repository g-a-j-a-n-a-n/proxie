import test from "node:test";
import assert from "node:assert/strict";
import { formatNoteText } from "./pseudocode";

const compact = (text: string) => text.replace(/\s+/g, " ").trim();

test("fenced algorithms preserve indentation, operators, and surrounding prose", () => {
  const code = "D[s] ← 0\nfor i = 1 to |V| − 1\n  for each (u, v) ∈ E\n    D[v] ← min(D[v], D[u] + w(u, v))\nreturn D";
  const blocks = formatNoteText(`Relax every edge.\n\`\`\`pseudocode\n${code}\n\`\`\`\nAssumes no negative cycles.`);
  assert.deepEqual(blocks.map(block => block.kind), ["prose", "code", "prose"]);
  const block = blocks[1]!;
  assert.equal(block.kind, "code");
  if (block.kind === "code") {
    assert.equal(block.lines.join("\n"), code);
    assert.equal(block.inferred, false);
  }
});

test("recognizes existing multiline pseudocode without needing regeneration", () => {
  const text = "Bellman-Ford: no negative cycles\nD[s] ← 0\nfor i = 1 to n − 1\n  D[v] ← min(D[v], D[u] + w(u, v))\nreturn D";
  const blocks = formatNoteText(text);
  assert.deepEqual(blocks.map(block => block.kind), ["prose", "code"]);
  assert.equal(compact(blocks.map(block => block.kind === "code" ? block.lines.join("\n") : block.text).join(" ")), compact(text));
});

test("reflows old flattened Bellman-Ford text without inventing or dropping operations", () => {
  const text = "Bellman-Ford better DP implementation (Assuming no negative cycles) 14 Filling the table D[s] ← 0 for i = 1 to n − 1 do for each (u,v) in E do if D[u] + w(u,v) < D[v] then D[v] ← D[u] + w(u,v) return D";
  const blocks = formatNoteText(text);
  const block = blocks.find(block => block.kind === "code");
  assert.equal(block?.kind, "code");
  if (block?.kind === "code") {
    assert.equal(block.inferred, true);
    assert.equal(block.text, text);
    assert.ok(block.lines.some(line => line.startsWith("D[s]")));
    assert.ok(block.lines.some(line => line.startsWith("return D")));
    assert.equal(compact(blocks.map(block => block.kind === "code" ? block.lines.join("\n") : block.text).join(" ")), compact(text));
  }
});

test("does not turn ordinary algorithm descriptions or mathematical prose into code", () => {
  for (const prose of [
    "Bellman-Ford uses dynamic programming. It works when there are no negative cycles.",
    "For example, return to the previous slide if you need a reminder.",
    "If the graph has no negative cycles, then the algorithm returns shortest distances.",
    "The recurrence is D[v] = min(D[v], D[u] + w).",
    "Pseudocode describes an algorithm in a language-independent way.",
    "For each exercise, read the notes.\nReturn to this page for examples.",
    "If x = y, the values are equal.\nFor example, compare matching labels.",
  ]) assert.deepEqual(formatNoteText(prose), [{ kind: "prose", text: prose }]);
});

test("explicit end markers allow indentation, but missing terminators do not invent nesting", () => {
  const explicit = formatNoteText("for i = 1 to n do\nx ← x + i\nend for\nreturn x")[0]!;
  assert.equal(explicit.kind, "code");
  if (explicit.kind === "code") {
    assert.deepEqual(explicit.lines, ["for i = 1 to n do", "  x ← x + i", "end for", "return x"]);
    assert.equal(explicit.inferred, true);
  }
  const uncertain = formatNoteText("for i = 1 to n\nx ← x + i\nreturn x")[0]!;
  if (uncertain.kind === "code") assert.deepEqual(uncertain.lines, ["for i = 1 to n", "x ← x + i", "return x"]);
});

test("supports multiple code fences, empty code, CRLF, and tabs", () => {
  const blocks = formatNoteText("```text\r\nx ← 0\r\n\treturn x\r\n```\nExplanation.\n```pseudo\n\n```");
  assert.deepEqual(blocks.map(block => block.kind), ["code", "prose", "code"]);
  if (blocks[0]?.kind === "code") assert.deepEqual(blocks[0].lines, ["x ← 0", "  return x"]);
});

test("unclosed fences and source markup stay literal", () => {
  const source = "```pseudocode\n<script>alert('source')</script>";
  assert.deepEqual(formatNoteText(source), [{ kind: "prose", text: source }]);
});
