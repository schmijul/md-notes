import { describe, expect, it } from "vitest";
import { splitIncomingNotes } from "./sync";
import type { Note } from "./types";

function note(id: string, lines: string[]): Note {
  return {
    id,
    createdAt: "2026-06-07T10:00:00.000Z",
    updatedAt: "2026-06-07T10:00:00.000Z",
    lines,
    versions: [],
  };
}

describe("peer synchronization", () => {
  it("separates new notes from conflicting notes", () => {
    const local = [note("same", ["same"]), note("changed", ["local"])];
    const remote = [note("same", ["same"]), note("changed", ["remote"]), note("new", ["new"])];

    const result = splitIncomingNotes(local, remote);

    expect(result.additions.map((item) => item.id)).toEqual(["new"]);
    expect(result.conflicts.map((item) => item.id)).toEqual(["changed"]);
  });
});
