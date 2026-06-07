# UX und Bedienkonzept

![Zeilenbasierter Editor](screenshots/main-editor.png)

## Leitidee

Die App verbindet die Ruhe einer klassischen Notiz-App mit der Präzision von Markdown. Nutzer sollen die meiste Zeit gerenderten Text sehen, ohne zwischen einem Editor- und einem Vorschau-Modus wechseln zu müssen.

## Editor

Nur die aktive Zeile zeigt Markdown-Quelltext. Alle anderen Zeilen werden gerendert.

- Klick auf eine Vorschauzeile aktiviert sie.
- `Enter` trennt die aktive Zeile an der Cursorposition.
- `Backspace` am Zeilenanfang verbindet sie mit der vorherigen Zeile.
- `Pfeil hoch` am Anfang und `Pfeil runter` am Ende wechseln die aktive Zeile.
- Leere Zeilen behalten anklickbare Höhe, ohne visuell dominant zu werden.

Diese Interaktion ist für kurze Notizen optimiert. Mehrzeilige Markdown-Blöcke wie Codeblöcke werden im MVP nicht als zusammenhängender Block editiert.

## Navigation

Die linke Spalte enthält Suche und Notizen. Die aktive Notiz ist als helle Karte markiert. Titel und Vorschau werden direkt aus dem Markdown abgeleitet, daher braucht es keine separaten Metadatenfelder.

Die obere Werkzeugleiste enthält nur globale Aktionen:

- Seitenleiste ein-/ausblenden
- History öffnen
- Teilen
- Notiz löschen

## Visuelles System

Die Gestaltung orientiert sich an iOS Notes, ohne sie zu kopieren:

- warmes Papierweiß statt reinem Weiß
- Serifenschrift für Inhalt und Überschriften
- dezentes Gelb für aktive und primäre Elemente
- wenig permanente Rahmen
- kleine Statusinformationen und großzügiger Schreibbereich

## Versionen

![Versionsvergleich](screenshots/version-history.png)

History erscheint als seitliches Panel, damit der aktuelle Text sichtbar bleibt. Geänderte Zeilen erhalten einen warmen Hintergrund. Wiederherstellen ist nicht destruktiv: Vor dem Restore wird der aktuelle Stand erneut gesichert.

## Teilen

![Share-Code Dialog](screenshots/share-code.png)

Der Dialog trennt **Send** und **Receive**. Er erklärt direkt, dass der Code lesbare Notizdaten enthält und keine automatische Synchronisierung bietet. Dadurch entstehen keine falschen Erwartungen an Datenschutz oder Echtzeit-Zusammenarbeit.

## Barrierefreiheit

- Alle zentralen Icon-Schaltflächen haben zugängliche Namen.
- Eingabefelder sind über Label oder Platzhalter identifizierbar.
- Status wird nicht ausschließlich durch Farbe kommuniziert.
- Bedienelemente bleiben mit Tastatur erreichbar.

Ein vollständiger Screenreader- und Kontrast-Audit steht vor einem öffentlichen Release noch aus.
