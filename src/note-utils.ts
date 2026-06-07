import type { Note, NoteVersion } from "./types";

export function noteTitle(lines: string[]) {
  const firstLine = lines.find((line) => line.trim()) ?? "Untitled note";
  return firstLine
    .replace(/^#{1,6}\s+/, "")
    .replace(/[*_~`>]/g, "")
    .trim() || "Untitled note";
}

export function notePreview(lines: string[]) {
  const content = lines
    .slice(1)
    .join(" ")
    .replace(/[#*_~`>[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return content || "No additional text";
}

export function makeVersion(lines: string[], label: string): NoteVersion {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label,
    lines: [...lines],
  };
}

export function encodeNote(note: Note) {
  const payload = JSON.stringify({
    format: "paper-trail-note-v1",
    note: { ...note, versions: note.versions.slice(-10) },
  });
  const bytes = new TextEncoder().encode(payload);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

export function decodeNote(code: string): Note {
  const binary = atob(code.trim());
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));

  if (payload.format !== "paper-trail-note-v1" || !Array.isArray(payload.note?.lines)) {
    throw new Error("This is not a Paper Trail share code.");
  }

  return payload.note as Note;
}

export function sameLines(a: string[], b: string[]) {
  return a.length === b.length && a.every((line, index) => line === b[index]);
}
