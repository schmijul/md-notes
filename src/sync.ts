import { invoke } from "@tauri-apps/api/core";
import type { Note } from "./types";

export const DEFAULT_SYNC_PORT = 45123;

export function startSyncServer() {
  return invoke<string>("start_sync_server", { port: DEFAULT_SYNC_PORT });
}

export function updateSyncNotes(notes: Note[]) {
  return invoke<void>("set_sync_notes", { notes });
}

export function updateSyncKey(key: string) {
  return invoke<void>("set_sync_key", { key });
}

export function syncWithPeer(address: string, key: string, notes: Note[]) {
  return invoke<Note[]>("sync_with_peer", { address, key, notes });
}

export function splitIncomingNotes(localNotes: Note[], remoteNotes: Note[]) {
  const additions = remoteNotes.filter((remote) => !localNotes.some((local) => local.id === remote.id));
  const conflicts = remoteNotes.filter((remote) => {
    const local = localNotes.find((note) => note.id === remote.id);
    return Boolean(local && (
      local.lines.length !== remote.lines.length
      || local.lines.some((line, index) => line !== remote.lines[index])
    ));
  });
  return { additions, conflicts };
}
