use std::collections::HashMap;
use std::sync::{Arc, Mutex};

mod pty;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
