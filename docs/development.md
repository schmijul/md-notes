# Development

This page is for contributors building md-notes from source. Regular users should install a packaged desktop release as described in the main README.

## Requirements

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

Build Linux production packages (`.deb` and `.rpm`) locally:

```bash
npm run build:desktop
```

Packages are written to `src-tauri/target/release/bundle/`. Build Windows and macOS installers with `npm run tauri build` on the respective operating system.

Creating and pushing a version tag publishes installers for Linux, Windows, and macOS through GitHub Actions. Keep the tag version aligned with `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.

Run the checks:

```bash
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```
