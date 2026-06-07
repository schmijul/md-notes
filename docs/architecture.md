# Architektur

![Paper Trail Hauptansicht](screenshots/main-editor.png)

## Ziel

Paper Trail soll sich wie eine kleine Desktop-App anfühlen und dennoch ohne plattformspezifische UI-Neuentwicklung auf Linux, Windows und macOS laufen. Das MVP priorisiert eine gute Editor-Interaktion und eine verständliche Versionsansicht.

## Technologie

- **Tauri 2:** native Desktop-Shell, Packaging und zukünftiger Zugriff auf Dateisystem oder LAN
- **React + TypeScript:** UI und Zustandsverwaltung
- **Vite:** Entwicklungsserver und Frontend-Build
- **react-markdown + remark-gfm:** sichere Markdown-Darstellung inklusive Tabellen und Aufgabenlisten
- **localStorage:** lokale MVP-Persistenz innerhalb des App-Webviews
- **Vitest:** fokussierte Tests der Daten- und Share-Code-Logik

## Struktur

```text
src/
  App.tsx                 Hauptzustand und Anwendungsabläufe
  LineEditor.tsx          Zeilenbasierter Markdown-Editor
  HistoryPanel.tsx        Versionen und visueller Vergleich
  ShareDialog.tsx         Share-Code erzeugen und importieren
  ConflictDialog.tsx      Zeilenweise Konfliktauflösung
  note-utils.ts           Titel, Vorschau, Versionen und Codes
  storage.ts              Lokale Speicherung und Beispieldaten
  styles.css              Gesamtes visuelles System
src-tauri/
  src/                     Minimale native Tauri-Shell
  capabilities/            Desktop-Berechtigungen
docs/                      Produkt- und Technikdokumentation
```

## Datenmodell

Eine Notiz besteht aus einer stabilen ID, Zeitstempeln, einem Array von Markdown-Zeilen und bis zu 40 lokalen Versionen. Eine Version enthält eine Kopie der Zeilen, einen Zeitstempel und eine kurze Bezeichnung.

Die zeilenweise Speicherung ist absichtlich direkt: Sie entspricht der Editor-Interaktion und macht Vergleiche sowie Konfliktentscheidungen verständlich. Für dieses MVP ist kein komplexes Dokumentmodell nötig.

## Datenfluss

1. `App` lädt alle Notizen einmal aus `localStorage`.
2. `LineEditor` meldet nach jeder Eingabe das vollständige Zeilenarray zurück.
3. React aktualisiert die aktive Notiz; ein Effekt schreibt den Zustand lokal.
4. Nach 1,4 Sekunden Schreibpause wird ein Snapshot erzeugt.
5. History, Share und Merge arbeiten mit demselben einfachen Datenmodell.

## Native Grenze

Die Rust-Seite startet aktuell nur das Tauri-Fenster. Das ist bewusst minimal. Dateisystemzugriff, Export und ein LAN-Dienst gehören später hinter klar definierte Tauri-Commands, ohne die Editor-Komponenten umzubauen.

## Portierbarkeit

Tauri unterstützt Linux, Windows und macOS mit demselben Frontend. Plattformabhängig sind primär Build-Pakete und Installer. Die UI nutzt keine Linux-spezifischen APIs. Tauri 2 erlaubt später auch mobile Targets; vor einem mobilen Build braucht die Zweispaltenansicht jedoch ein eigenes responsives Navigationsmuster.

## Sicherheitsannahmen

- Keine Remote-Inhalte werden geladen.
- Markdown wird als React-Komponenten gerendert; rohes HTML ist nicht aktiviert.
- Share-Codes sind Base64-kodiert, nicht verschlüsselt.
- Die App sendet selbst keine Daten ins Netzwerk.

## Bewusste Nicht-Ziele des MVP

- Kein Benutzerkonto
- Kein zentraler Sync-Server
- Kein CRDT oder Operational Transform
- Keine Plugin-Architektur
- Kein Rich-Text-Dokumentmodell neben Markdown

Diese Entscheidungen reduzieren Implementierungsrisiko und halten die spätere Migration zu Dateispeicherung oder LAN-Sitzungen offen.
