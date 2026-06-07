use std::fs;

#[tauri::command]
fn read_markdown_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{read_markdown_file, write_markdown_file};

    #[test]
    fn writes_and_reads_markdown_files() {
        let path = std::env::temp_dir().join(format!("md-notes-{}.md", std::process::id()));
        let path = path.to_string_lossy().to_string();

        write_markdown_file(path.clone(), "# Test\n".to_string()).unwrap();
        assert_eq!(read_markdown_file(path.clone()).unwrap(), "# Test\n");

        std::fs::remove_file(path).unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            write_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running md-notes");
}
