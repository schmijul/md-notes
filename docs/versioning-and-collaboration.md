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

## Direct Peer Synchronization

Two running app instances can exchange their complete local note snapshots directly over TCP. No account or central service is involved.

![Direct peer synchronization](screenshots/peer-sync.jpg)

- Both devices use the same pairing key.
- The peer address is stored locally and retried every 30 seconds.
- Notes remain available and editable while the peer is offline.
- Unknown notes are added automatically.
- Differing known notes use the existing visual conflict dialog.
- Deletions are not propagated in the first version.

The built-in transport is authenticated by the pairing key but is not encrypted. Use it on a trusted LAN or through an encrypted private network such as Tailscale. Direct internet use otherwise requires port forwarding.

## Why No Real-Time Editing Yet?

True multi-user editing requires discovery, transport, session identity, change ordering, reconnection, and conflict semantics. A CRDT would substantially increase the MVP's scope without improving validation of the visible core idea.

Share codes test the important product questions first:

- Do users understand versions?
- Is the visual merge understandable?
- Is account-free sharing sufficient for the intended context?

A documented CRDT should only be introduced if simultaneous typing becomes a real requirement. For small note-sharing groups, the snapshot model is easier to operate and explain.
