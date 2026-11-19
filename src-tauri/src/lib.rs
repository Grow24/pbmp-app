use serde::Serialize;
use sysinfo::{Disks, System};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DiskInfo {
    mount_point: String,
    file_system: String,
    total_bytes: u64,
    available_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemInfo {
    host_name: Option<String>,
    os: Option<String>,
    cpu_model: Option<String>,
    logical_cores: usize,
    physical_cores: Option<usize>,
    total_memory_bytes: u64,
    available_memory_bytes: u64,
    disks: Vec<DiskInfo>,
}

/// Minimal Stage-3 native command: report this machine's CPU, RAM and storage.
#[tauri::command]
fn system_info() -> Result<SystemInfo, String> {
    let sys = System::new_all().map_err(|e| format!("Could not read system information: {e}"))?;

    let mut seen = std::collections::HashSet::new();
    let disks = Disks::new_with_refreshed_list()
        .map(|disks| {
            disks
                .iter()
                .filter(|d| d.total_space() > 0 && d.file_system() != "squashfs")
                .filter(|d| seen.insert(d.name().to_os_string()))
                .map(|d| DiskInfo {
                    mount_point: d.mount_point().display().to_string(),
                    file_system: d.file_system().to_string_lossy().into_owned(),
                    total_bytes: d.total_space(),
                    available_bytes: d.available_space(),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(SystemInfo {
        host_name: System::host_name().ok(),
        os: System::long_os_version().ok(),
        cpu_model: sys.cpus().first().map(|c| c.brand().trim().to_string()),
        logical_cores: sys.cpus().len(),
        physical_cores: System::physical_core_count().ok(),
        total_memory_bytes: sys.total_memory(),
        available_memory_bytes: sys.available_memory(),
        disks,
    })
}

#[cfg(test)]
mod tests {
    #[test]
    fn reads_this_machine() {
        let info = super::system_info().unwrap();
        assert!(info.logical_cores > 0);
        assert!(info.total_memory_bytes >= info.available_memory_bytes);
        assert!(!info.disks.is_empty());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![system_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
