use std::collections::HashMap;
use std::sync::{Arc, Mutex};

mod pty;

#[tauri::command]
async fn load_memory(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("memory.json");
    if !path.exists() {
        return Ok("[]".to_string());
    }
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_memory(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("memory.json");
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, json).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_store: pty::PtyStore = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(pty_store)
        .invoke_handler(tauri::generate_handler![
            pty::create_pty,
            pty::write_pty,
            pty::resize_pty,
            pty::close_pty,
            load_memory,
            save_memory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
