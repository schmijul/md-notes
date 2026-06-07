use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{BufRead, BufReader, Write},
    net::{TcpListener, TcpStream, ToSocketAddrs, UdpSocket},
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::{Emitter, State};

const DEFAULT_SYNC_PORT: u16 = 45123;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct NoteVersion {
    id: String,
    created_at: String,
    label: String,
    lines: Vec<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Note {
    id: String,
    created_at: String,
    updated_at: String,
    lines: Vec<String>,
    versions: Vec<NoteVersion>,
}

#[derive(Deserialize, Serialize)]
struct SyncMessage {
    key: String,
    notes: Vec<Note>,
    error: Option<String>,
}

#[derive(Default)]
struct SyncState {
    notes: Arc<Mutex<Vec<Note>>>,
    key: Arc<Mutex<String>>,
    port: Arc<Mutex<Option<u16>>>,
}

fn local_ip() -> String {
    UdpSocket::bind("0.0.0.0:0")
        .and_then(|socket| {
            socket.connect("8.8.8.8:80")?;
            socket.local_addr()
        })
        .map(|address| address.ip().to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string())
}

fn read_message(stream: &mut TcpStream) -> Result<SyncMessage, String> {
    let mut line = String::new();
    BufReader::new(stream)
        .read_line(&mut line)
        .map_err(|error| error.to_string())?;
    serde_json::from_str(&line).map_err(|error| error.to_string())
}

fn write_message(stream: &mut TcpStream, message: SyncMessage) -> Result<(), String> {
    let message = serde_json::to_string(&message).map_err(|error| error.to_string())?;
    stream
        .write_all(format!("{message}\n").as_bytes())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_sync_notes(notes: Vec<Note>, state: State<SyncState>) -> Result<(), String> {
    *state.notes.lock().map_err(|error| error.to_string())? = notes;
    Ok(())
}

#[tauri::command]
fn set_sync_key(key: String, state: State<SyncState>) -> Result<(), String> {
    *state.key.lock().map_err(|error| error.to_string())? = key;
    Ok(())
}

#[tauri::command]
fn start_sync_server(
    app: tauri::AppHandle,
    state: State<SyncState>,
    port: Option<u16>,
) -> Result<String, String> {
    let port = port.unwrap_or(DEFAULT_SYNC_PORT);
    let mut active_port = state.port.lock().map_err(|error| error.to_string())?;
    if let Some(current) = *active_port {
        return Ok(format!("{}:{current}", local_ip()));
    }

    let listener = TcpListener::bind(("0.0.0.0", port)).map_err(|error| error.to_string())?;
    *active_port = Some(port);
    drop(active_port);

    let notes = state.notes.clone();
    let key = state.key.clone();
    std::thread::spawn(move || {
        for connection in listener.incoming() {
            let Ok(mut stream) = connection else { continue };
            let _ = stream.set_read_timeout(Some(Duration::from_secs(10)));
            let _ = stream.set_write_timeout(Some(Duration::from_secs(10)));

            let Ok(incoming) = read_message(&mut stream) else {
                continue;
            };
            let expected_key = key.lock().map(|key| key.clone()).unwrap_or_default();
            if expected_key.is_empty() || incoming.key != expected_key {
                let _ = write_message(
                    &mut stream,
                    SyncMessage {
                        key: String::new(),
                        notes: vec![],
                        error: Some("Pairing key does not match".to_string()),
                    },
                );
                continue;
            }
            let local = notes.lock().map(|notes| notes.clone()).unwrap_or_default();
            if write_message(
                &mut stream,
                SyncMessage {
                    key: expected_key,
                    notes: local,
                    error: None,
                },
            )
            .is_ok()
            {
                let _ = app.emit("peer-sync", incoming.notes);
            }
        }
    });

    Ok(format!("{}:{port}", local_ip()))
}

#[tauri::command]
fn sync_with_peer(address: String, key: String, notes: Vec<Note>) -> Result<Vec<Note>, String> {
    let peer = address
        .to_socket_addrs()
        .map_err(|_| "Use an address like 192.168.1.20:45123")?
        .next()
        .ok_or("Could not resolve the peer address")?;
    let mut stream = TcpStream::connect_timeout(&peer, Duration::from_secs(5))
        .map_err(|error| error.to_string())?;
    stream
        .set_read_timeout(Some(Duration::from_secs(10)))
        .map_err(|error| error.to_string())?;
    stream
        .set_write_timeout(Some(Duration::from_secs(10)))
        .map_err(|error| error.to_string())?;
    write_message(
        &mut stream,
        SyncMessage {
            key,
            notes,
            error: None,
        },
    )?;
    let response = read_message(&mut stream)?;
    if let Some(error) = response.error {
        return Err(error);
    }
    Ok(response.notes)
}

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
        .manage(SyncState::default())
        .invoke_handler(tauri::generate_handler![
            set_sync_notes,
            set_sync_key,
            start_sync_server,
            sync_with_peer,
            read_markdown_file,
            write_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running md-notes");
}
