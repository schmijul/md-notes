# Versionierung und Kollaboration

![Visuelle Versionskontrolle](screenshots/version-history.png)

## Lokale Versionen

Nach einer Schreibpause von 1,4 Sekunden erstellt die App einen Snapshot, sofern sich der Text vom letzten Snapshot unterscheidet. Pro Notiz werden maximal 40 lokale Versionen gehalten.

Der Vergleich arbeitet zeilenweise. Das passt zum Editor und ist für Notizen leichter verständlich als ein klassischer Git-Diff mit technischen Markierungen.

Beim Wiederherstellen:

1. wird der aktuelle Text als **Before restore** gesichert,
2. wird die ausgewählte Version zum aktuellen Text,
3. bleibt die Aktion dadurch wieder rückgängig machbar.

## Share-Code

![Share-Code](screenshots/share-code.png)

Ein Share-Code ist ein Base64-kodiertes JSON-Dokument mit:

- Formatkennung
- Notiz-ID und Zeitstempeln
- aktuellen Markdown-Zeilen
- bis zu zehn letzten Versionen

Der Code kann über Messenger, E-Mail, QR-Code-Generator oder im lokalen Netzwerk transportiert werden. Paper Trail selbst baut im MVP keine Netzwerkverbindung auf.

Base64 ist keine Verschlüsselung. Vertrauliche Notizen dürfen nur über einen entsprechend sicheren Kanal geteilt werden.

## Import und Konflikte

Ist die Notiz-ID auf dem empfangenden Gerät unbekannt, wird die Notiz als neue lokale Notiz angelegt.

Existiert dieselbe ID mit abweichendem Inhalt, zeigt die App beide Fassungen pro Zeile. Für jede geänderte Zeile kann gewählt werden:

- lokale Zeile behalten
- empfangene Zeile übernehmen
- beide Zeilen behalten

Vor dem Merge speichert die App den lokalen Stand als **Before shared merge**. Damit bleibt auch eine falsche Konfliktentscheidung reparierbar.

## Warum noch keine Echtzeit-Synchronisierung?

Echte Mehrbenutzerbearbeitung benötigt Discovery, Transport, Sitzungsidentität, Reihenfolge von Änderungen, Wiederverbindung und Konfliktsemantik. Ein CRDT würde das MVP erheblich vergrößern und die sichtbare Kernidee nicht besser validieren.

Share-Codes testen zuerst die wichtigen Produktfragen:

- Verstehen Nutzer Versionen?
- Ist der visuelle Merge verständlich?
- Reicht accountloses Teilen für den Zielkontext?

## Vorgesehener LAN-Ausbau

Der nächste Kollaborationsschritt kann ohne zentralen Account-Dienst umgesetzt werden:

1. Ein Gerät startet über einen Tauri-Command eine lokale Sitzung.
2. Die App zeigt IP, kurzlebigen Code und optional einen QR-Code.
3. Teilnehmer verbinden sich per WebSocket im selben LAN.
4. Änderungen werden zunächst als versionierte, vollständige Notizstände übertragen.
5. Gleichzeitige Änderungen landen im vorhandenen visuellen Konfliktdialog.

Erst wenn gleichzeitiges Tippen wirklich erforderlich ist, sollte ein dokumentiertes CRDT eingeführt werden. Für kleine Notizgruppen ist das einfachere Snapshot-Modell leichter zu betreiben und zu erklären.
