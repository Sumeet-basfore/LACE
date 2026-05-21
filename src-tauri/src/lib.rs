use std::sync::Mutex;
use std::process::{Child, Command};
use tauri::{State, Manager};

struct GgufState {
    active_process: Mutex<Option<Child>>,
    current_model_path: Mutex<Option<String>>,
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
fn load_gguf_model(state: State<'_, GgufState>, file_path: String) -> Result<String, String> {
    // 1. Stop any currently running server
    stop_server_internal(&state.active_process, &state.current_model_path);

    // 2. Start the new llama-server process
    println!("Launching llama-server with model: {}", file_path);

    let child = Command::new("llama-server")
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
        Err(e) => {
            eprintln!("Failed to launch llama-server binary: {}", e);
            Err(format!(
                "Failed to run 'llama-server' binary (is it installed in your system path?). Error: {}",
                e
            ))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GgufState {
            active_process: Mutex::new(None),
            current_model_path: Mutex::new(None),
        })
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
                // Terminate background llama-server process on exit
                if let Some(state) = window.try_state::<GgufState>() {
                    stop_server_internal(&state.active_process, &state.current_model_path);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            pick_gguf_file,
            load_gguf_model,
            unload_gguf_model,
            get_gguf_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
