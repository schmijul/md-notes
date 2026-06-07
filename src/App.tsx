import { Clock3, FilePlus2, Moon, PanelLeftClose, PanelLeftOpen, Search, Share2, Sun, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConflictDialog } from "./ConflictDialog";
import { HistoryPanel } from "./HistoryPanel";
import { LineEditor } from "./LineEditor";
import { decodeNote, makeVersion, notePreview, noteTitle, sameLines } from "./note-utils";
import { ShareDialog } from "./ShareDialog";
import { loadNotes, saveNotes } from "./storage";
import type { Note, NoteVersion } from "./types";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [incoming, setIncoming] = useState<Note | null>(null);
  const [notice, setNotice] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("md-notes-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const snapshotTimer = useRef<number>();

  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0];
  const visibleNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...notes]
      .filter((note) => !normalized || note.lines.join("\n").toLowerCase().includes(normalized))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, query]);

  useEffect(() => saveNotes(notes), [notes]);

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
  }

  function deleteNote() {
    if (!selectedNote || notes.length === 1) return;
    const remaining = notes.filter((note) => note.id !== selectedNote.id);
    setNotes(remaining);
    setSelectedId(remaining[0].id);
    setHistoryOpen(false);
  }

  function restoreVersion(version: NoteVersion) {
    if (!selectedNote) return;
    setNotes((current) => current.map((note) => note.id === selectedNote.id ? {
      ...note,
      lines: [...version.lines],
      updatedAt: new Date().toISOString(),
      versions: [...note.versions, makeVersion(note.lines, "Before restore")].slice(-40),
    } : note));
    setNotice("Version restored");
  }

  function importCode(code: string) {
    try {
      const shared = decodeNote(code);
      setShareOpen(false);
      const local = notes.find((note) => note.id === shared.id);
      if (local && !sameLines(local.lines, shared.lines)) {
        setIncoming(shared);
        return;
      }
      if (!local) {
        setNotes((current) => [{ ...shared, updatedAt: new Date().toISOString() }, ...current]);
        setSelectedId(shared.id);
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
    setIncoming(null);
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
          <div className="toolbar-center"><span className="save-dot" /> Saved locally</div>
          <div className="toolbar-actions">
            <button className={historyOpen ? "tool-button active" : "tool-button"} onClick={() => setHistoryOpen((open) => !open)}><Clock3 size={17} /> History</button>
            <button className="tool-button accent" onClick={() => setShareOpen(true)}><Share2 size={17} /> Share</button>
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
      {incoming && conflictLocal && <ConflictDialog local={conflictLocal} incoming={incoming} onCancel={() => setIncoming(null)} onResolve={resolveConflict} />}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}
