//! Native shell for TohdohBoard: a single webview window that loads the static export of the
//! web UI (`../out`). The UI talks to the backend over plain HTTP like the browser version;
//! it uses no Tauri commands or plugins.

/// Opens the main window and runs the event loop until it is closed.
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running TohdohBoard");
}
