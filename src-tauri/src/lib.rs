use std::sync::Mutex;
use std::process::{Child, Command as StdCommand};
use tauri::{State, Manager, Emitter};
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::io::{Read, Write};
use std::thread;

struct GgufState {
    active_process: Mutex<Option<Child>>,
    current_model_path: Mutex<Option<String>>,
}

struct PtyState {
    writer: Mutex<Option<Box<dyn Write + Send>>>,
    child: Mutex<Option<Box<dyn portable_pty::Child + Send>>>,
}

fn stop_server_internal(active_process: &Mutex<Option<Child>>, current_model_path: &Mutex<Option<String>>) {
    let mut proc_guard = active_process.lock().unwrap();
    if let Some(mut child) = proc_guard.take() {
        println!("Stopping background llama-server...");
        let _ = child.kill();
        let _ = child.wait();
    }
    let mut path_guard = current_model_path.lock().unwrap();
    *path_guard = None;
}

#[tauri::command]
fn pick_gguf_file() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("GGUF Models", &["gguf"])
        .set_title("Select GGUF Model File")
        .pick_file();

    match file {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
fn unload_gguf_model(state: State<'_, GgufState>) -> Result<String, String> {
    stop_server_internal(&state.active_process, &state.current_model_path);
    Ok("Model unloaded successfully".to_string())
}

#[tauri::command]
fn get_gguf_status(state: State<'_, GgufState>) -> Result<Option<String>, String> {
    let path_guard = state.current_model_path.lock().unwrap();
    Ok(path_guard.clone())
}

#[tauri::command]
fn get_git_status(path: String) -> Result<std::collections::HashMap<String, String>, String> {
    let output = StdCommand::new("git")
        .arg("status")
        .arg("--porcelain")
        .current_dir(&path)
        .output();

    match output {
        Ok(out) => {
            if !out.status.success() {
                // Not a git repo or command failed
                return Ok(std::collections::HashMap::new());
            }
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut status_map = std::collections::HashMap::new();
            for line in stdout.lines() {
                if line.len() >= 4 {
                    let status = &line[0..2];
                    let file_path = line[3..].trim().to_string();
                    status_map.insert(file_path, status.trim().to_string());
                }
            }
            Ok(status_map)
        }
        Err(_) => {
            // git command execution failed (e.g. git not in PATH)
            Ok(std::collections::HashMap::new())
        }
    }
}

#[tauri::command]
fn load_gguf_model(state: State<'_, GgufState>, file_path: String) -> Result<String, String> {
    stop_server_internal(&state.active_process, &state.current_model_path);
    println!("Launching llama-server with model: {}", file_path);

    let child = StdCommand::new("llama-server")
        .arg("-m")
        .arg(&file_path)
        .arg("-c")
        .arg("4096")
        .arg("--port")
        .arg("11435")
        .spawn();

    match child {
        Ok(child_process) => {
            let mut proc_guard = state.active_process.lock().unwrap();
            *proc_guard = Some(child_process);
            let mut path_guard = state.current_model_path.lock().unwrap();
            *path_guard = Some(file_path.clone());
            Ok("llama-server started successfully on port 11435".to_string())
        }
        Err(e) => Err(format!("Failed to run 'llama-server' binary. Error: {}", e))
    }
}

#[tauri::command]
fn spawn_pty(
    app_handle: tauri::AppHandle,
    state: State<'_, PtyState>,
    cwd: Option<String>,
) -> Result<(), String> {
    // Kill existing child if any to allow restarting/spawning in a new directory
    {
        let mut child_guard = state.child.lock().unwrap();
        if let Some(mut old_child) = child_guard.take() {
            let _ = old_child.kill();
        }
    }
    {
        let mut writer_guard = state.writer.lock().unwrap();
        *writer_guard = None;
    }

    let pty_system = NativePtySystem::default();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = if cfg!(windows) {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "bash".to_string())
    };

    let mut cmd = CommandBuilder::new(&shell);
    if !cfg!(windows) {
        // Start as login shell to load environment variables, path configurations (e.g. nvm, node, custom binaries), and aliases
        cmd.arg("-l");
    }

    if let Some(ref dir) = cwd {
        if !dir.is_empty() {
            cmd.cwd(dir);
        }
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    *state.child.lock().unwrap() = Some(child);
    *state.writer.lock().unwrap() = Some(writer);

    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        while let Ok(n) = reader.read(&mut buf) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buf[..n]).to_string();
            let _ = app_handle.emit("pty_output", text);
        }
    });

    Ok(())
}

#[tauri::command]
fn write_pty(state: State<'_, PtyState>, input: String) -> Result<(), String> {
    if let Some(writer) = state.writer.lock().unwrap().as_mut() {
        writer.write_all(input.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GgufState {
            active_process: Mutex::new(None),
            current_model_path: Mutex::new(None),
        })
        .manage(PtyState {
            writer: Mutex::new(None),
            child: Mutex::new(None),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<GgufState>() {
                    stop_server_internal(&state.active_process, &state.current_model_path);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            pick_gguf_file,
            load_gguf_model,
            unload_gguf_model,
            get_gguf_status,
            get_git_status,
            spawn_pty,
            write_pty
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
