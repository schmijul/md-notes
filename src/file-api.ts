import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

const markdownFilter = [{ name: "Markdown", extensions: ["md", "markdown"] }];

export async function openMarkdownFile() {
  const path = await open({ multiple: false, filters: markdownFilter });
  if (!path) return null;
  const content = await invoke<string>("read_markdown_file", { path });
  return { path, content };
}

export async function chooseMarkdownPath(defaultPath: string) {
  return save({ defaultPath, filters: markdownFilter });
}

export function writeMarkdownFile(path: string, content: string) {
  return invoke<void>("write_markdown_file", { path, content });
}
