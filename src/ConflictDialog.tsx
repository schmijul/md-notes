import { ArrowLeftRight, X } from "lucide-react";
import { useState } from "react";
import type { ConflictChoice, Note } from "./types";

type Props = {
  local: Note;
  incoming: Note;
  onCancel: () => void;
  onResolve: (lines: string[]) => void;
};

export function ConflictDialog({ local, incoming, onCancel, onResolve }: Props) {
  const rowCount = Math.max(local.lines.length, incoming.lines.length);
  const [choices, setChoices] = useState<ConflictChoice[]>(
    Array.from({ length: rowCount }, (_, index) =>
      local.lines[index] === incoming.lines[index] ? "local" : "incoming",
    ),
  );

  function finish() {
    const merged = choices.flatMap((choice, index) => {
      const localLine = local.lines[index] ?? "";
      const incomingLine = incoming.lines[index] ?? "";
      if (choice === "local") return [localLine];
      if (choice === "incoming") return [incomingLine];
      return localLine === incomingLine ? [localLine] : [localLine, incomingLine];
    });
    onResolve(merged);
  }

  return (
    <div className="modal-backdrop conflict-backdrop">
      <section className="conflict-dialog" role="dialog" aria-modal="true">
        <header>
          <div>
            <span className="eyebrow">Shared note changed</span>
            <h2>Choose what to keep</h2>
            <p>Select your version, the shared version, or both for each changed line.</p>
          </div>
          <button className="icon-button" onClick={onCancel} aria-label="Cancel"><X size={18} /></button>
        </header>

        <div className="conflict-labels"><span>On this device</span><span>Shared with you</span></div>
        <div className="conflict-rows">
          {Array.from({ length: rowCount }, (_, index) => {
            const mine = local.lines[index] ?? "";
            const theirs = incoming.lines[index] ?? "";
            const same = mine === theirs;
            return (
              <div className={`conflict-row ${same ? "same" : ""}`} key={index}>
                <button className={choices[index] === "local" ? "chosen" : ""} onClick={() => setChoices((current) => current.map((choice, row) => row === index ? "local" : choice))}>{mine || "Empty line"}</button>
                <button className={choices[index] === "incoming" ? "chosen" : ""} onClick={() => setChoices((current) => current.map((choice, row) => row === index ? "incoming" : choice))}>{theirs || "Empty line"}</button>
                {!same && <button className={`both-button ${choices[index] === "both" ? "chosen" : ""}`} onClick={() => setChoices((current) => current.map((choice, row) => row === index ? "both" : choice))}>both</button>}
              </div>
            );
          })}
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={finish}><ArrowLeftRight size={16} /> Save resolved note</button>
        </footer>
      </section>
    </div>
  );
}
