use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

pub(crate) struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    _child: Box<dyn portable_pty::Child + Send + Sync>,
}

pub type PtyStore = Arc<Mutex<HashMap<String, PtySession>>>;

#[tauri::command]
pub async fn create_pty(
    app: AppHandle,
    store: tauri::State<'_, PtyStore>,
    command: String,
    cwd: String,
    cols: u16,
    rows: u16,
    env_vars: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let pty_id = Uuid::new_v4().to_string();
    let pty_id_clone = pty_id.clone();
    let app_clone = app.clone();

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(&command);
    cmd.cwd(&cwd);

    // Prepend Git bash to PATH so hooks that call bash/sh resolve correctly
    #[cfg(target_os = "windows")]
    {
        let git_bins = "C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\bin";
        let current_path = std::env::var("PATH").unwrap_or_default();
        cmd.env("PATH", format!("{};{}", git_bins, current_path));
    }

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    if let Some(vars) = env_vars {
        for (key, value) in vars {
            cmd.env(&key, &value);
        }
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    // Spawn reader thread — streams PTY output as Tauri events
    let pty_id_reader = pty_id.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_clone.emit(&format!("pty-data-{}", pty_id_reader), data);
                }
                Err(_) => break,
            }
        }
        let _ = app_clone.emit(&format!("pty-exit-{}", pty_id_reader), ());
    });

    let session = PtySession {
        writer,
        master: pair.master,
        _child: child,
    };

    store.lock().unwrap().insert(pty_id_clone, session);

    Ok(pty_id)
}

#[tauri::command]
pub fn write_pty(
    store: tauri::State<'_, PtyStore>,
    pty_id: String,
    data: String,
) -> Result<(), String> {
    let mut map = store.lock().unwrap();
    if let Some(session) = map.get_mut(&pty_id) {
        session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn resize_pty(
    store: tauri::State<'_, PtyStore>,
    pty_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let map = store.lock().unwrap();
    if let Some(session) = map.get(&pty_id) {
        session
            .master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn close_pty(
    store: tauri::State<'_, PtyStore>,
    pty_id: String,
) -> Result<(), String> {
    store.lock().unwrap().remove(&pty_id);
    Ok(())
}
