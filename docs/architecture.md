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

The Rust side currently only starts the Tauri window. This is intentionally minimal. File-system access, export, and a LAN service can later be added behind clearly defined Tauri commands without rebuilding the editor components.

## Portability

Tauri supports Linux, Windows, and macOS with the same frontend. The main platform-specific concerns are build dependencies and installers. The UI does not use Linux-specific APIs. Tauri 2 also supports mobile targets, although the two-column interface will need a dedicated responsive navigation pattern before a mobile build.

## Security Assumptions

- No remote content is loaded.
- Markdown is rendered as React components; raw HTML is disabled.
- Share codes are Base64-encoded, not encrypted.
- The app does not send data over the network.

## Deliberate MVP Non-Goals

- No user accounts
- No central synchronization server
- No CRDT or Operational Transform
- No plugin architecture
- No rich-text document model alongside Markdown

These decisions reduce implementation risk and keep future migration to file-based storage or LAN sessions open.
