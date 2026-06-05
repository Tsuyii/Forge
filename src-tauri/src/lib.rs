use std::collections::HashMap;
use std::sync::{Arc, Mutex};

mod pty;

#[derive(serde::Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<DirEntry>>,
}

#[derive(serde::Serialize)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

/// Read a directory up to 2 levels deep.
#[tauri::command]
pub async fn read_dir(path: String) -> Result<Vec<DirEntry>, String> {
    read_dir_depth(&path, 0)
}

fn read_dir_depth(path: &str, depth: u32) -> Result<Vec<DirEntry>, String> {
    let entries = std::fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut result: Vec<DirEntry> = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        let is_dir = meta.is_dir();
        let entry_path = entry.path().to_string_lossy().to_string();
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip hidden entries
        if name.starts_with('.') {
            continue;
        }
        let children = if is_dir && depth < 1 {
            match read_dir_depth(&entry_path, depth + 1) {
                Ok(c) => Some(c),
                Err(_) => Some(vec![]),
            }
        } else if is_dir {
            Some(vec![]) // collapsed at depth 2
        } else {
            None
        };
        result.push(DirEntry { name, path: entry_path, is_dir, children });
    }
    result.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(result)
}

/// Read a file's text content.
#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Write text content to a file.
#[tauri::command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Run a shell command and return its output.
#[tauri::command]
pub async fn run_shell_command(cmd: String, args: Vec<String>, cwd: String) -> Result<CommandOutput, String> {
    let output = std::process::Command::new(&cmd)
        .args(&args)
        .current_dir(&cwd)
        .output()
        .map_err(|e| e.to_string())?;
    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

/// Open a URL in the system's default browser.
#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
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
            read_dir,
            read_file_content,
            write_file_content,
            run_shell_command,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
