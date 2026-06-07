export type NoteVersion = {
  id: string;
  createdAt: string;
  label: string;
  lines: string[];
};

export type Note = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lines: string[];
  versions: NoteVersion[];
};

export type ConflictChoice = "local" | "incoming" | "both";
