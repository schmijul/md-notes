import { listen } from "@tauri-apps/api/event";
import { Clock3, FilePlus2, FolderOpen, Moon, Network, PanelLeftClose, PanelLeftOpen, Save, SaveAll, Search, Share2, Sun, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConflictDialog } from "./ConflictDialog";
import { chooseMarkdownPath, openMarkdownFile, writeMarkdownFile } from "./file-api";
import { HistoryPanel } from "./HistoryPanel";
import { LineEditor } from "./LineEditor";
import { decodeNote, joinMarkdown, makeVersion, notePreview, noteTitle, sameLines, splitMarkdown } from "./note-utils";
import { ShareDialog } from "./ShareDialog";
import { loadNotes, saveNotes } from "./storage";
import { splitIncomingNotes, startSyncServer, syncWithPeer, updateSyncKey, updateSyncNotes } from "./sync";
import { SyncDialog } from "./SyncDialog";
import type { Note, NoteVersion } from "./types";

const PEER_ADDRESS_KEY = "md-notes-peer-address";
const SYNC_KEY = "md-notes-sync-key";

function isTauri() {
  return "__TAURI_INTERNALS__" in window;
}

function formatListDate(date: string) {
  const value = new Date(date);
  const today = new Date();
  if (value.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(value);
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(value);
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 700);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [incomingQueue, setIncomingQueue] = useState<Note[]>([]);
  const [notice, setNotice] = useState("");
  const [localAddress, setLocalAddress] = useState("");
  const [peerAddress, setPeerAddress] = useState(() => localStorage.getItem(PEER_ADDRESS_KEY) ?? "");
  const [syncKey, setSyncKey] = useState(() => {
    const saved = localStorage.getItem(SYNC_KEY);
    return saved || crypto.randomUUID().replaceAll("-", "");
  });
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState("Saved locally");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("md-notes-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const snapshotTimer = useRef<number>();
  const notesRef = useRef(notes);
  const syncingRef = useRef(false);

  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0];
  const incoming = incomingQueue[0] ?? null;
  const visibleNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...notes]
      .filter((note) => !normalized || note.lines.join("\n").toLowerCase().includes(normalized))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, query]);

  useEffect(() => {
    notesRef.current = notes;
    saveNotes(notes);
    if (isTauri()) updateSyncNotes(notes).catch(() => undefined);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(SYNC_KEY, syncKey);
    if (isTauri()) updateSyncKey(syncKey).catch(() => undefined);
  }, [syncKey]);

  useEffect(() => {
    if (!isTauri()) return;
    startSyncServer().then(setLocalAddress).catch((error) => setSyncError(String(error)));

    let stopListening: (() => void) | undefined;
    listen<Note[]>("peer-sync", (event) => receiveNotes(event.payload, "Changes received from peer"))
      .then((stop) => { stopListening = stop; });
    return () => stopListening?.();
  }, []);

  useEffect(() => {
    localStorage.setItem(PEER_ADDRESS_KEY, peerAddress);
    if (!peerAddress || !isTauri()) return;
    const firstTry = window.setTimeout(() => performSync(peerAddress, true), 2000);
    const timer = window.setInterval(() => performSync(peerAddress, true), 30000);
    return () => {
      window.clearTimeout(firstTry);
      window.clearInterval(timer);
    };
  }, [peerAddress, syncKey]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#10151a" : "#f5f7f9");
    localStorage.setItem("md-notes-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function updateLines(lines: string[]) {
    if (!selectedNote) return;
    setSyncStatus("Local changes");
    setNotes((current) => current.map((note) => note.id === selectedNote.id
      ? { ...note, lines, updatedAt: new Date().toISOString() }
      : note));

    window.clearTimeout(snapshotTimer.current);
    snapshotTimer.current = window.setTimeout(() => {
      setNotes((current) => current.map((note) => {
        if (note.id !== selectedNote.id) return note;
        const latest = note.versions.at(-1);
        if (latest && sameLines(latest.lines, note.lines)) return note;
        return { ...note, versions: [...note.versions, makeVersion(note.lines, "Editing pause")].slice(-40) };
      }));
    }, 1400);
  }

  function receiveNotes(remoteNotes: Note[], message: string) {
    const localNotes = notesRef.current;
    const { additions, conflicts } = splitIncomingNotes(localNotes, remoteNotes);

    if (additions.length) {
      setNotes((current) => [...additions, ...current]);
      if (!selectedId) setSelectedId(additions[0].id);
    }
    if (conflicts.length) {
      setIncomingQueue((current) => {
        const queuedIds = new Set(current.map((note) => note.id));
        return [...current, ...conflicts.filter((note) => !queuedIds.has(note.id))];
      });
    }
    setSyncStatus(conflicts.length ? "Needs conflict review" : "Synced");
    setNotice(message);
  }

  async function performSync(address: string, silent = false) {
    if (!address || syncingRef.current || !isTauri()) return;
    syncingRef.current = true;
    setSyncing(true);
    setSyncError("");
    setSyncStatus("Syncing…");
    try {
      const remoteNotes = await syncWithPeer(address, syncKey, notesRef.current);
      receiveNotes(remoteNotes, "Device synchronization complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncError(message);
      setSyncStatus("Waiting for peer");
      if (!silent) setNotice("Peer is not reachable yet");
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  function createNote() {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      lines: ["# Untitled note", ""],
      versions: [],
    };
    setNotes((current) => [note, ...current]);
    setSelectedId(note.id);
    setQuery("");
    setHistoryOpen(false);
    setSyncStatus("Local changes");
  }

  async function openFile() {
    if (!isTauri()) {
      setNotice("File access is available in the desktop app");
      return;
    }
    try {
      const file = await openMarkdownFile();
      if (!file) return;
      const now = new Date().toISOString();
      const markdown = splitMarkdown(file.content);
      const note: Note = {
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        lines: markdown.lines,
        versions: [],
        sourcePath: file.path,
        lineEnding: markdown.lineEnding,
      };
      setNotes((current) => [note, ...current]);
      setSelectedId(note.id);
      setQuery("");
      setHistoryOpen(false);
      setSyncStatus("Opened file");
      setNotice("Markdown file opened");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveFile(saveAs = false) {
    if (!isTauri()) {
      setNotice("File access is available in the desktop app");
      return;
    }
    try {
      const suggestedName = `${noteTitle(selectedNote.lines).replace(/[\\/:*?"<>|]/g, "-") || "note"}.md`;
      const path = saveAs || !selectedNote.sourcePath
        ? await chooseMarkdownPath(selectedNote.sourcePath ?? suggestedName)
        : selectedNote.sourcePath;
      if (!path) return;
      await writeMarkdownFile(path, joinMarkdown(selectedNote.lines, selectedNote.lineEnding));
      setNotes((current) => current.map((note) => note.id === selectedNote.id ? { ...note, sourcePath: path } : note));
      setSyncStatus("Saved to file");
      setNotice("Markdown file saved");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  function deleteNote() {
    if (!selectedNote || notes.length === 1) return;
    const remaining = notes.filter((note) => note.id !== selectedNote.id);
    setNotes(remaining);
    setSelectedId(remaining[0].id);
    setHistoryOpen(false);
    setSyncStatus("Local changes");
  }

  function restoreVersion(version: NoteVersion) {
    if (!selectedNote) return;
    setNotes((current) => current.map((note) => note.id === selectedNote.id ? {
      ...note,
      lines: [...version.lines],
      updatedAt: new Date().toISOString(),
      versions: [...note.versions, makeVersion(note.lines, "Before restore")].slice(-40),
    } : note));
    setSyncStatus("Local changes");
    setNotice("Version restored");
  }

  function importCode(code: string) {
    try {
      const shared = decodeNote(code);
      setShareOpen(false);
      const local = notes.find((note) => note.id === shared.id);
      if (local && !sameLines(local.lines, shared.lines)) {
        setIncomingQueue((current) => [...current, shared]);
        return;
      }
      if (!local) {
        setNotes((current) => [{ ...shared, updatedAt: new Date().toISOString() }, ...current]);
        setSelectedId(shared.id);
        setSyncStatus("Local changes");
      }
      setNotice(local ? "Notes already match" : "Shared note added");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read share code");
    }
  }

  function resolveConflict(lines: string[]) {
    if (!incoming || !selectedNote) return;
    setNotes((current) => current.map((note) => note.id === incoming.id ? {
      ...note,
      lines,
      updatedAt: new Date().toISOString(),
      versions: [...note.versions, makeVersion(note.lines, "Before shared merge")].slice(-40),
    } : note));
    setSelectedId(incoming.id);
    setIncomingQueue((current) => current.slice(1));
    setSyncStatus("Local changes");
    setNotice("Shared changes merged");
  }

  if (!selectedNote) return null;
  const conflictLocal = incoming ? notes.find((note) => note.id === incoming.id) : undefined;

  return (
    <main className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"} ${historyOpen ? "history-open" : ""}`}>
      <aside className="sidebar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="sidebar-title">
          <div><span className="eyebrow">On this device</span><h1>Notes</h1></div>
          <button className="icon-button" onClick={createNote} aria-label="New note"><FilePlus2 size={19} /></button>
        </div>
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="notes-list">
          {visibleNotes.map((note) => (
            <button className={`note-card ${note.id === selectedNote.id ? "selected" : ""}`} key={note.id} onClick={() => { setSelectedId(note.id); setHistoryOpen(false); }}>
              <strong>{noteTitle(note.lines)}</strong>
              <span>{notePreview(note.lines)}</span>
              <small>{formatListDate(note.updatedAt)} · {note.lines.length} lines</small>
            </button>
          ))}
          {visibleNotes.length === 0 && <p className="no-results">No notes match “{query}”.</p>}
        </div>
        <div className="sidebar-footer"><span>{notes.length} notes</span><span>Stored locally</span></div>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <button className="icon-button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle sidebar">
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
          </button>
          <div className="toolbar-center"><span className="save-dot" /> {syncStatus}</div>
          <div className="toolbar-actions">
            <button className="tool-button file-button" aria-label="Open Markdown file" title="Open Markdown file" onClick={openFile}><FolderOpen size={17} /><span>Open</span></button>
            <button className="tool-button file-button" aria-label="Save Markdown file" title="Save Markdown file" onClick={() => saveFile()}><Save size={17} /><span>Save</span></button>
            <button className="tool-button file-button" aria-label="Save Markdown file as" title="Save Markdown file as" onClick={() => saveFile(true)}><SaveAll size={17} /><span>Save as</span></button>
            <button className={historyOpen ? "tool-button active" : "tool-button"} aria-label="History" onClick={() => setHistoryOpen((open) => !open)}><Clock3 size={17} /><span>History</span></button>
            <button className={syncOpen ? "tool-button active" : "tool-button"} aria-label="Sync" onClick={() => setSyncOpen(true)}><Network size={17} /><span>Sync</span></button>
            <button className="tool-button accent" aria-label="Share" onClick={() => setShareOpen(true)}><Share2 size={17} /><span>Share</span></button>
            <button className="icon-button" onClick={deleteNote} disabled={notes.length === 1} aria-label="Delete note"><Trash2 size={18} /></button>
            <button
              className="icon-button"
              onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <div className="editor-scroll">
          <article className="paper">
            <div className="note-meta">
              <span>{formatListDate(selectedNote.updatedAt)}</span>
              <span>{selectedNote.lines.join(" ").trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <LineEditor key={selectedNote.id} lines={selectedNote.lines} onChange={updateLines} />
          </article>
        </div>
      </section>

      {historyOpen && <HistoryPanel note={selectedNote} onClose={() => setHistoryOpen(false)} onRestore={restoreVersion} />}
      {shareOpen && <ShareDialog note={selectedNote} onClose={() => setShareOpen(false)} onImport={importCode} />}
      {syncOpen && <SyncDialog
        localAddress={localAddress}
        peerAddress={peerAddress}
        syncKey={syncKey}
        syncing={syncing}
        error={syncError}
        onClose={() => setSyncOpen(false)}
        onPeerAddressChange={setPeerAddress}
        onSyncKeyChange={setSyncKey}
        onSync={performSync}
      />}
      {incoming && conflictLocal && <ConflictDialog local={conflictLocal} incoming={incoming} onCancel={() => setIncomingQueue((current) => current.slice(1))} onResolve={resolveConflict} />}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}
