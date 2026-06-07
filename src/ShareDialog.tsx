import { Check, Clipboard, Copy, Link2, X } from "lucide-react";
import { useState } from "react";
import type { Note } from "./types";
import { encodeNote } from "./note-utils";

type Props = {
  note: Note;
  onClose: () => void;
  onImport: (code: string) => void;
};

export function ShareDialog({ note, onClose, onImport }: Props) {
  const [tab, setTab] = useState<"share" | "join">("share");
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const shareCode = encodeNote(note);

  async function copyCode() {
    await navigator.clipboard.writeText(shareCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="share-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div className="share-icon"><Link2 size={20} /></div>
          <div>
            <span className="eyebrow">No account needed</span>
            <h2>Share a note</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close share dialog"><X size={18} /></button>
        </header>

        <div className="segmented-control">
          <button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")}>Send</button>
          <button className={tab === "join" ? "active" : ""} onClick={() => setTab("join")}>Receive</button>
        </div>

        {tab === "share" ? (
          <div className="share-content">
            <p>This code contains the note and its recent history. Send it through any channel you trust.</p>
            <div className="code-box">{shareCode.slice(0, 180)}…</div>
            <button className="primary-button" onClick={copyCode}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copied" : "Copy share code"}
            </button>
            <small>Anyone with the code can read this note. Codes do not update automatically.</small>
          </div>
        ) : (
          <div className="share-content">
            <p>Paste a code. If this note also exists locally, you can resolve differences before saving.</p>
            <textarea
              className="code-input"
              placeholder="Paste a Paper Trail share code…"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button className="primary-button" disabled={!code.trim()} onClick={() => onImport(code)}>
              <Clipboard size={17} /> Review shared note
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
