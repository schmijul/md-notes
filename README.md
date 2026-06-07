# Paper Trail

Paper Trail ist eine lokale Markdown-Notizen-App für den Desktop. Die Oberfläche ist von iOS Notes inspiriert, während der Editor Markdown zeilenweise zwischen Quelltext und Vorschau wechseln lässt.

![Paper Trail Hauptansicht](docs/screenshots/main-editor.png)

## MVP-Funktionen

- Native Desktop-App mit Tauri 2
- Markdown-Editor mit Live-Rendering pro Zeile
- Aktive Zeile bleibt als Markdown editierbar
- Notizenliste, Suche und lokale Speicherung
- Automatische Versionen nach kurzen Schreibpausen
- Visueller Vergleich und Wiederherstellung
- Accountloses Teilen per kopierbarem Share-Code
- Zeilenweise Konfliktlösung beim Import geänderter Notizen

![Visueller Versionsvergleich](docs/screenshots/version-history.png)

## Schnellstart

Voraussetzungen:

- Node.js 20 oder neuer
- Rust 1.77 oder neuer
- Linux-Pakete für Tauri/WebKitGTK

Unter Ubuntu/Debian:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Abhängigkeiten installieren und Frontend starten:

```bash
npm install
npm run dev
```

Native Desktop-App im Entwicklungsmodus starten:

```bash
npm run tauri dev
```

Linux-Produktionspakete (`.deb` und `.rpm`) erstellen:

```bash
npm run build:desktop
```

Die Pakete landen unter `src-tauri/target/release/bundle/`. Windows- und macOS-Installer werden mit `npm run tauri build` auf dem jeweiligen Betriebssystem erzeugt.

Frontend prüfen:

```bash
npm test
npm run build
```

## Bedienung

1. Eine gerenderte Zeile anklicken, um ihren Markdown-Quelltext zu bearbeiten.
2. `Enter` drücken, um eine neue Zeile anzulegen. Die vorige Zeile wird sofort gerendert.
3. Über **History** ältere Stände vergleichen und wiederherstellen.
4. Über **Share** einen transportierbaren Code kopieren oder einen erhaltenen Code importieren.

![Accountloses Teilen per Share-Code](docs/screenshots/share-code.png)

## Speicherung

Das MVP speichert Notizen im lokalen Webview-Speicher der Tauri-App. Es gibt keinen Server, keine Anmeldung und keine Telemetrie. Ein Share-Code enthält den Notiztext und bis zu zehn letzte Versionen; wer den Code besitzt, kann diese Daten lesen.

## Dokumentation

- [Architektur](docs/architecture.md)
- [UX und Bedienkonzept](docs/ux.md)
- [Versionierung und Kollaboration](docs/versioning-and-collaboration.md)

## Aktuelle Grenzen

- Share-Codes sind Momentaufnahmen und synchronisieren nicht automatisch.
- Echtzeit-LAN-Kollaboration ist noch nicht enthalten.
- Die lokale Speicherung nutzt noch keine frei wählbare Markdown-Dateiablage.
- Mobile Builds sind architektonisch möglich, aber nicht Teil dieses MVP.
- AppImage-Packaging ist noch nicht Teil des verifizierten Linux-Builds; `.deb` und `.rpm` sind geprüft.

Diese Grenzen halten das erste Release klein und testbar. Der nächste sinnvolle Schritt ist ein optionaler lokaler Tauri-Datenspeicher mit Import/Export, danach eine explizit gestartete LAN-Sitzung.
