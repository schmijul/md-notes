import type { Note } from "./types";

const STORAGE_KEY = "paper-trail-notes-v1";

const now = new Date().toISOString();

export const sampleNotes: Note[] = [
  {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    lines: [
      "# Welcome to Paper Trail",
      "",
      "Write **Markdown** one line at a time.",
      "Move to another line and your text becomes a clean preview.",
      "",
      "- Your notes stay on this device",
      "- Every pause creates a restorable version",
      "- Share codes work without accounts",
    ],
    versions: [],
  },
  {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    lines: [
      "# Sunday plans",
      "",
      "## Morning",
      "- Coffee and a long walk",
      "- Review the garden sketches",
      "",
      "> Keep the day deliberately light.",
    ],
    versions: [],
  },
];

export function loadNotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return sampleNotes;

  try {
    const notes = JSON.parse(stored) as Note[];
    return notes.length ? notes : sampleNotes;
  } catch {
    return sampleNotes;
  }
}

export function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
