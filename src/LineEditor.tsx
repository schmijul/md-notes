import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { findMarkdownTables, insertMarkdownTable } from "./note-utils";

type Props = {
  lines: string[];
  onChange: (lines: string[]) => void;
  sourcePath?: string;
  tableInsertRequest: number;
};

function resolveImageSource(src: string | undefined, sourcePath: string | undefined) {
  if (!src || !sourcePath || !("__TAURI_INTERNALS__" in window)) return src;
  const windowsPath = /^[A-Za-z]:[\\/]/.test(src);
  const nonFileUrl = /^[A-Za-z][A-Za-z\d+.-]*:/.test(src) && !/^file:\/\//i.test(src);
  if ((!windowsPath && nonFileUrl) || src.startsWith("//")) return src;

  let imagePath = src;
  if (/^file:\/\//i.test(src)) {
    imagePath = decodeURIComponent(new URL(src).pathname);
    if (/^\/[A-Za-z]:\//.test(imagePath)) imagePath = imagePath.slice(1);
  } else if (!src.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(src) && !src.startsWith("\\\\")) {
    const separator = sourcePath.includes("\\") ? "\\" : "/";
    const directoryEnd = Math.max(sourcePath.lastIndexOf("/"), sourcePath.lastIndexOf("\\"));
    imagePath = `${sourcePath.slice(0, directoryEnd + 1)}${src.replace(/[\\/]/g, separator)}`;
  }

  return convertFileSrc(imagePath);
}

export function LineEditor({ lines, onChange, sourcePath, tableInsertRequest }: Props) {
  const [activeLine, setActiveLine] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handledTableRequest = useRef(tableInsertRequest);
  const selectTableHeading = useRef(false);
  const tables = findMarkdownTables(lines);

  useEffect(() => {
    setActiveLine((current) => Math.min(current, Math.max(lines.length - 1, 0)));
  }, [lines.length]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 34)}px`;
    if (selectTableHeading.current) {
      textarea.setSelectionRange(2, 10);
      selectTableHeading.current = false;
    }
  }, [activeLine, lines]);

  useEffect(() => {
    if (tableInsertRequest === handledTableRequest.current) return;
    handledTableRequest.current = tableInsertRequest;
    const result = insertMarkdownTable(lines, activeLine);
    selectTableHeading.current = true;
    onChange(result.lines);
    setActiveLine(result.activeLine);
  }, [tableInsertRequest]);

  function updateLine(value: string) {
    const next = [...lines];
    next[activeLine] = value;
    onChange(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const before = textarea.value.slice(0, textarea.selectionStart);
      const after = textarea.value.slice(textarea.selectionEnd);
      const next = [...lines];
      next.splice(activeLine, 1, before, after);
      onChange(next);
      setActiveLine(activeLine + 1);
      requestAnimationFrame(() => textareaRef.current?.setSelectionRange(0, 0));
    }

    if (event.key === "Backspace" && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && activeLine > 0) {
      event.preventDefault();
      const previousLength = lines[activeLine - 1].length;
      const next = [...lines];
      next.splice(activeLine - 1, 2, lines[activeLine - 1] + lines[activeLine]);
      onChange(next);
      setActiveLine(activeLine - 1);
      requestAnimationFrame(() => textareaRef.current?.setSelectionRange(previousLength, previousLength));
    }

    if (event.key === "ArrowUp" && textarea.selectionStart === 0 && activeLine > 0) {
      event.preventDefault();
      setActiveLine(activeLine - 1);
    }

    if (event.key === "ArrowDown" && textarea.selectionStart === textarea.value.length && activeLine < lines.length - 1) {
      event.preventDefault();
      setActiveLine(activeLine + 1);
    }
  }

  return (
    <div className="line-editor" aria-label="Markdown editor">
      {lines.map((line, index) => {
        const table = tables.find(({ start, end }) => index >= start && index <= end);
        const tableIsActive = table && activeLine >= table.start && activeLine <= table.end;
        if (table && index > table.start && !tableIsActive) return null;

        const renderedMarkdown = table && !tableIsActive
          ? lines.slice(table.start, table.end + 1).join("\n")
          : line;

        return (
        <div className={`editor-line ${index === activeLine ? "active" : ""}`} key={index}>
          {index === activeLine ? (
            <textarea
              ref={textareaRef}
              autoFocus
              value={line}
              rows={1}
              spellCheck
              aria-label={`Editing line ${index + 1}`}
              onChange={(event) => updateLine(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <button
              className={`rendered-line ${table && !tableIsActive ? "table-block" : ""}`}
              type="button"
              onClick={() => setActiveLine(index)}
            >
              {renderedMarkdown ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, ...props }) => <img {...props} src={resolveImageSource(src, sourcePath)} />,
                  }}
                >
                  {renderedMarkdown}
                </ReactMarkdown>
              ) : (
                <span className="empty-line">Click to write</span>
              )}
            </button>
          )}
        </div>
        );
      })}
      <button
        type="button"
        className="add-line"
        onClick={() => {
          onChange([...lines, ""]);
          setActiveLine(lines.length);
        }}
      >
        Add a line
      </button>
    </div>
  );
}
