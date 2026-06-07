import { Check, Clock3, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { Note, NoteVersion } from "./types";

type Props = {
  note: Note;
  onClose: () => void;
  onRestore: (version: NoteVersion) => void;
};

function formatVersionDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function HistoryPanel({ note, onClose, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState(note.versions.at(-1)?.id);
  const selected = note.versions.find((version) => version.id === selectedId);
  const rowCount = Math.max(note.lines.length, selected?.lines.length ?? 0);

  return (
    <aside className="history-panel">
      <header>
        <div>
          <span className="eyebrow">Time machine</span>
          <h2>Version history</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close history"><X size={18} /></button>
      </header>

      {note.versions.length === 0 ? (
        <div className="empty-state">
          <Clock3 size={28} />
          <h3>No earlier versions yet</h3>
          <p>Pause after editing and a snapshot will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="version-list">
            {[...note.versions].reverse().map((version) => (
              <button
                type="button"
                className={version.id === selectedId ? "selected" : ""}
                key={version.id}
                onClick={() => setSelectedId(version.id)}
              >
                <span><Clock3 size={14} /> {version.label}</span>
                <small>{formatVersionDate(version.createdAt)}</small>
              </button>
            ))}
          </div>

          {selected && (
            <div className="comparison">
              <div className="comparison-heading">
                <span>Selected version</span>
                <span>Now</span>
              </div>
              {Array.from({ length: rowCount }, (_, index) => {
                const oldLine = selected.lines[index] ?? "";
                const currentLine = note.lines[index] ?? "";
                const changed = oldLine !== currentLine;
                return (
                  <div className={`comparison-row ${changed ? "changed" : ""}`} key={index}>
                    <span>{oldLine || "·"}</span>
                    <span>{currentLine || "·"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {selected && (
            <button className="primary-button restore" type="button" onClick={() => onRestore(selected)}>
              <RotateCcw size={16} /> Restore this version
            </button>
          )}
          <p className="history-hint"><Check size={14} /> Restoring also keeps your current text as a version.</p>
        </>
      )}
    </aside>
  );
}
