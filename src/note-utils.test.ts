import { describe, expect, it } from "vitest";
import {
  decodeNote,
  encodeNote,
  findMarkdownTables,
  insertMarkdownTable,
  joinMarkdown,
  notePreview,
  noteTitle,
  sameLines,
  splitMarkdown,
} from "./note-utils";
import type { Note } from "./types";

const note: Note = {
  id: "note-1",
  createdAt: "2026-06-07T10:00:00.000Z",
  updatedAt: "2026-06-07T10:00:00.000Z",
  lines: ["# Trip ideas", "Visit **Lisbon** in autumn."],
  versions: [],
};

describe("note utilities", () => {
  it("creates list labels from Markdown", () => {
    expect(noteTitle(note.lines)).toBe("Trip ideas");
    expect(notePreview(note.lines)).toBe("Visit Lisbon in autumn.");
  });

  it("round-trips share codes", () => {
    expect(decodeNote(encodeNote(note))).toEqual(note);
  });

  it("accepts legacy share codes", () => {
    const legacyFormat = ["paper", "trail", "note", "v1"].join("-");
    const legacyCode = btoa(JSON.stringify({ format: legacyFormat, note }));
    expect(decodeNote(legacyCode)).toEqual(note);
  });

  it("compares lines exactly", () => {
    expect(sameLines(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameLines(["a"], ["A"])).toBe(false);
  });

  it("preserves Markdown line endings and a final newline", () => {
    const markdown = "# Title\r\n\r\nText\r\n";
    const { lines, lineEnding } = splitMarkdown(markdown);

    expect(lines).toEqual(["# Title", "", "Text", ""]);
    expect(joinMarkdown(lines, lineEnding)).toBe(markdown);
  });

  it("finds complete GFM table blocks", () => {
    const lines = [
      "Before",
      "| Name | Value |",
      "| :--- | ---: |",
      "| Alpha | 1 |",
      "| Beta | 2 |",
      "",
      "After | inline",
    ];

    expect(findMarkdownTables(lines)).toEqual([{ start: 1, end: 4 }]);
    expect(findMarkdownTables(["| Value |", "| --- |", "| One |"]))
      .toEqual([{ start: 0, end: 2 }]);
  });

  it("inserts a Markdown table at the active line", () => {
    expect(insertMarkdownTable(["# Title", ""], 1)).toEqual({
      activeLine: 1,
      lines: [
        "# Title",
        "| Column 1 | Column 2 | Column 3 |",
        "| --- | --- | --- |",
        "| Cell | Cell | Cell |",
      ],
    });

    expect(insertMarkdownTable(["# Title"], 0).activeLine).toBe(1);
  });
});
