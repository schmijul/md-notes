# Architecture

![md-notes main view](screenshots/main-editor.png)

## Goal

md-notes should feel like a small desktop app while running on Linux, Windows, and macOS without platform-specific UI implementations. The MVP prioritizes a strong editing interaction and an understandable version history.

## Technology

- **Tauri 2:** native desktop shell, packaging, and future access to the file system or LAN
- **React + TypeScript:** UI and state management
- **Vite:** development server and frontend build
- **react-markdown + remark-gfm:** safe Markdown rendering, including tables and task lists
- **localStorage:** local MVP persistence inside the app WebView
- **Vitest:** focused tests for note and share-code logic

## Structure

```text
src/
  App.tsx                 Main state and application flows
  LineEditor.tsx          Line-based Markdown editor
  HistoryPanel.tsx        Versions and visual comparison
  ShareDialog.tsx         Share-code creation and import
  ConflictDialog.tsx      Line-by-line conflict resolution
  note-utils.ts           Titles, previews, versions, and codes
  storage.ts              Local storage and sample data
  styles.css              Complete visual system
src-tauri/
  src/                     Minimal native Tauri shell
  capabilities/            Desktop permissions
docs/                      Product and technical documentation
```

## Data Model

A note contains a stable ID, timestamps, an array of Markdown lines, and up to 40 local versions. Each version contains a copy of the lines, a timestamp, and a short label.

Line-based storage is intentionally direct: it matches the editor interaction and makes comparisons and conflict decisions understandable. This MVP does not need a more complex document model.

## Data Flow

1. `App` loads all notes once from `localStorage`.
2. `LineEditor` reports the complete line array after each edit.
3. React updates the active note, and an effect writes the state locally.
4. A snapshot is created after a 1.4-second editing pause.
5. History, sharing, and merging use the same simple data model.

## Native Boundary

The Rust side starts the Tauri window and provides a small TCP transport for peer synchronization. React sends the current local note snapshot to Rust, while incoming snapshots are emitted back to React for local persistence and conflict handling. The native layer does not merge or own notes.

Ordinary Markdown files use the native Tauri open/save dialogs. Two focused commands read UTF-8 text from a selected path and write it back. The React note keeps the selected path and original LF or CRLF line ending, while its local copy and version history continue to use WebView `localStorage`.

Each app listens on TCP port `45123`. A connection exchanges complete snapshots after verifying a shared pairing key. The saved peer address is retried every 30 seconds, so edits remain local while the other device is unavailable and are exchanged once both devices are reachable again.

## Portability

Tauri supports Linux, Windows, macOS, Android, and iOS with the same frontend. The phone layout replaces the two-column interface with a notes drawer, compact toolbar, full-width editor, and mobile dialogs. Native Android and iOS project generation, permissions, packaging, and physical-device network behavior still require platform-specific verification.

## Security Assumptions

- No remote content is loaded.
- Markdown is rendered as React components; raw HTML is disabled.
- Share codes are Base64-encoded, not encrypted.
- Peer synchronization only sends data when a peer address and matching pairing key are configured.
- The pairing key authenticates a peer but does not encrypt traffic. An encrypted private network is required outside a trusted LAN.

## Deliberate MVP Non-Goals

- No user accounts
- No central synchronization server
- No CRDT or Operational Transform
- No plugin architecture
- No rich-text document model alongside Markdown

These decisions reduce implementation risk and keep future migration to file-based storage or LAN sessions open.
