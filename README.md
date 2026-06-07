# md-notes

md-notes is a local Markdown notes app for the desktop. Its focused interface lets the editor switch each line between Markdown source and rendered preview.

![md-notes main view](docs/screenshots/main-editor.png)

## MVP Features

- Native desktop app built with Tauri 2
- Line-based Markdown editor with live rendering
- The active line remains editable as Markdown
- Notes list, search, and local storage
- System-aware light and dark themes with a persistent manual toggle
- Automatic versions after short editing pauses
- Visual comparison and restoration
- Account-free sharing through portable share codes
- Line-by-line conflict resolution when importing changed notes

![Visual version comparison](docs/screenshots/version-history.png)

![md-notes dark mode](docs/screenshots/dark-mode.png)

## Quick Start

Requirements:

- Node.js 20 or newer
- Rust 1.77 or newer
- Linux packages required by Tauri and WebKitGTK

On Ubuntu or Debian:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Install dependencies and start the frontend:

```bash
npm install
npm run dev
```

Start the native desktop app in development mode:

```bash
npm run tauri dev
```

Build Linux production packages (`.deb` and `.rpm`):

```bash
npm run build:desktop
```

Packages are written to `src-tauri/target/release/bundle/`. Build Windows and macOS installers with `npm run tauri build` on the respective operating system.

Verify the frontend:

```bash
npm test
npm run build
```

## Usage

1. Click a rendered line to edit its Markdown source.
2. Press `Enter` to create a new line. The previous line is rendered immediately.
3. Open **History** to compare and restore earlier versions.
4. Open **Share** to copy a portable code or import a code you received.

![Account-free sharing with a share code](docs/screenshots/share-code.png)

## Storage

The MVP stores notes in the Tauri app's local WebView storage. There is no server, account, or telemetry. A share code contains the note text and up to ten recent versions; anyone who has the code can read that data.

## Documentation

- [Architecture](docs/architecture.md)
- [UX and interaction design](docs/ux.md)
- [Versioning and collaboration](docs/versioning-and-collaboration.md)

## Current Limitations

- Share codes are snapshots and do not synchronize automatically.
- Real-time LAN collaboration is not included yet.
- Local storage does not yet use a user-selectable Markdown file directory.
- Mobile builds are architecturally possible but are outside this MVP.
- AppImage packaging is not part of the verified Linux build; `.deb` and `.rpm` are verified.

These limits keep the first release small and testable. The next practical step is an optional local Tauri data store with import and export, followed by explicitly started LAN sessions.
