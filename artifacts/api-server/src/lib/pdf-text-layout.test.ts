import test from "node:test";
import assert from "node:assert/strict";
import { pdfTextWithLayout } from "./pdf-text-layout";

function item(str: string, x: number, y: number, hasEOL = false, height = 10) {
  return { str, transform: [height, 0, 0, height, x, y], width: str.length * 5, height, hasEOL };
}

test("retains algorithm lines and relative indentation from PDF geometry", () => {
  const text = pdfTextWithLayout([
    item("Bellman-Ford", 20, 100, true),
    item("for i = 1 to n − 1", 20, 80, true),
    item("D[v] ← min(D[v], D[u] + w)", 30, 65, true),
    item("return D", 20, 50, true),
  ]);
  assert.equal(text, "Bellman-Ford\nfor i = 1 to n − 1\n  D[v] ← min(D[v], D[u] + w)\nreturn D");
});

test("uses baselines when hasEOL is missing and inserts gaps between words", () => {
  assert.equal(pdfTextWithLayout([item("for", 20, 100), item("each", 40, 100), item("return D", 20, 85)]), "for each\nreturn D");
});

test("does not split mathematical subscripts onto separate lines", () => {
  assert.equal(pdfTextWithLayout([
    item("D", 20, 100), item("i", 25, 96, false, 6), item(" ← 0", 30, 100, true),
  ]), "Di ← 0");
});

test("ignores marked-content records and handles blank PDFs", () => {
  assert.equal(pdfTextWithLayout([{ type: "beginMarkedContent" }, item("", 0, 0, true)]), "");
  assert.equal(pdfTextWithLayout([]), "");
  assert.equal(pdfTextWithLayout([null, { str: "bad" }]), "");
});

test("preserves the extraction reading order rather than sorting unrelated columns", () => {
  assert.equal(pdfTextWithLayout([item("first", 20, 100, true), item("second", 20, 80, true), item("other column", 120, 100, true)]), "first\nsecond\n                    other column");
});
