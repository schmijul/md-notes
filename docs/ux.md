# UX and Interaction Design

![Line-based editor](screenshots/main-editor.png)

## Guiding Idea

The app combines the calm appearance of a traditional notes app with the precision of Markdown. Users should see rendered text most of the time without switching between separate editor and preview modes.

## Editor

Only the active line displays Markdown source. Every other line is rendered.

- Click a preview line to activate it.
- `Enter` splits the active line at the cursor position.
- `Backspace` at the start of a line joins it with the previous line.
- `Arrow Up` at the beginning and `Arrow Down` at the end move between active lines.
- Empty lines retain a clickable height without becoming visually dominant.

This interaction is optimized for short notes. Multi-line Markdown constructs such as fenced code blocks are not edited as a single block in the MVP.

## Navigation

The left column contains search and the notes list. The active note is highlighted as a light card. Titles and previews are derived directly from Markdown, so separate metadata fields are unnecessary.

The top toolbar contains only global actions:

- Show or hide the sidebar
- Open a Markdown file
- Save or save a Markdown file under a new name
- Open History
- Share the note
- Delete the note
- Switch between light and dark mode

## Visual System

The visual system is designed for focused, low-distraction writing:

- Clean white and cool grey surfaces in light mode
- Serif type for content and headings
- Muted slate blue for active and primary elements
- A matching dark palette that follows the system preference on first use
- Few persistent borders
- Small status details and a spacious writing area

![Dark mode](screenshots/dark-mode.png)

## Versions

![Version comparison](screenshots/version-history.png)

History opens as a side panel so the current text remains visible. Changed lines receive a subtle blue background. Restoring is non-destructive: the current state is saved again before the selected version is restored.

## Sharing

![Share-code dialog](screenshots/share-code.png)

The dialog separates **Send** and **Receive**. It clearly explains that the code contains readable note data and does not provide automatic synchronization. This avoids false expectations about privacy or real-time collaboration.

## Markdown Files

![Opening and saving Markdown files](screenshots/markdown-files.png)

The desktop toolbar can open ordinary `.md` and `.markdown` files. **Save** writes an opened file back to its existing path; **Save as** asks for a new path. Internal notes can also be exported through either save action. File dialogs are native desktop functionality and are not available in the browser-only development view.

## Accessibility

- All central icon buttons have accessible names.
- Input fields are identifiable through labels or placeholders.
- Status is not communicated through color alone.
- Controls remain keyboard accessible.

A complete screen-reader and contrast audit is still required before a public release.
