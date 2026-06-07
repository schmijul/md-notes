# Versioning and Collaboration

![Visual version control](screenshots/version-history.png)

## Local Versions

After a 1.4-second editing pause, the app creates a snapshot when the text differs from the latest snapshot. Each note retains up to 40 local versions.

Comparison works line by line. This matches the editor and is easier to understand for notes than a traditional Git diff with technical markers.

When restoring a version:

1. the current text is saved as **Before restore**,
2. the selected version becomes the current text,
3. the operation therefore remains reversible.

## Share Codes

![Share code](screenshots/share-code.png)

A share code is a Base64-encoded JSON document containing:

- a format identifier,
- the note ID and timestamps,
- the current Markdown lines,
- up to ten recent versions.

The code can be transported through a messenger, email, a QR-code generator, or a local network. md-notes itself does not establish a network connection in the MVP.

Base64 is not encryption. Confidential notes should only be shared through an appropriately secure channel.

## Import and Conflicts

If the receiving device does not know the note ID, the note is added as a new local note.

If the same ID exists with different content, the app displays both versions line by line. For each changed line, the user can choose to:

- keep the local line,
- use the incoming line,
- keep both lines.

Before merging, the app saves the local state as **Before shared merge**. This makes an incorrect conflict decision recoverable.

## Why No Real-Time Synchronization Yet?

True multi-user editing requires discovery, transport, session identity, change ordering, reconnection, and conflict semantics. A CRDT would substantially increase the MVP's scope without improving validation of the visible core idea.

Share codes test the important product questions first:

- Do users understand versions?
- Is the visual merge understandable?
- Is account-free sharing sufficient for the intended context?

## Planned LAN Extension

The next collaboration step can be implemented without a central account service:

1. One device starts a local session through a Tauri command.
2. The app displays an IP address, a short-lived code, and optionally a QR code.
3. Participants connect through WebSocket on the same LAN.
4. Changes are initially transferred as complete, versioned note states.
5. Concurrent changes enter the existing visual conflict dialog.

A documented CRDT should only be introduced if simultaneous typing becomes a real requirement. For small note-sharing groups, the simpler snapshot model is easier to operate and explain.
