# PBMP Desktop — Migration Roadmap and Tauri Packaging

Source: PBMP Desktop migration brief (Web → Desktop via Tauri).  
This file is the **living plan** in the `mainpbmp` repo: sequence, how Tauri packages the UI, packaging boundaries, acceptance gates, and **current machine status**.

## 1. Executive overview

We convert PBMP from a web-only platform into a platform that runs through **Web and Desktop**, with additional local computing — **not** a second PBMP product.

We keep the existing PBMP Web investment (React, Canvas, React Flow / modeling, Blockly where present, LibreChat integration, business logic, GEMs, services) while adding OpenClaw, native Rust/Python processing, computer vision, local data, and authorized use of other machines’ hardware.

Three outcomes under one architecture:

| Outcome | Meaning |
| --- | --- |
| **PBMP Web** | Existing interface and online services |
| **PBMP Desktop** | Same interface, with local execution |
| **PBMP Nodes** | Other authorized machines and services |

One PBMP architecture · multiple channels · multiple execution locations.

## 2. Recommended sequence of activities

Nine stages; every stage ends with a working deliverable.

| Stage | Activities | Deliverable / acceptance |
| --- | --- | --- |
| **1. Baseline current PBMP Web** | Inventory React modules, LibreChat, APIs, databases, Canvas, auth, cloud deps, licenses | Complete application/dependency map |
| **2. Separate frontend from services** | Browser vs server code; shared PBMP service contracts | Same frontend can connect to local or remote services |
| **3. Introduce Tauri** | Add Tauri to existing React/Vite project; window + build | PBMP Web opens as a desktop application |
| **4. Enable local PBMP Core** | Rust, SQLite, files, system discovery, permissions, local execution | Business ops and local storage without internet |
| **5. Integrate LibreChat and OpenClaw** | Approved LibreChat capabilities; OpenClaw Gateway as managed local service; PBMP adapters | AI conversations, approved agent actions, automation |
| **6. Add native capability packs** | Python workers, OpenCV, ONNX Runtime, image/video models | Image/video processing on local CPU/GPU |
| **7. Enable organizational compute** | PBMP Node Agent on PC-2; authorized secure jobs | PC-1 submits job to PC-2 and receives results |
| **8. Unify workspace and experience** | Identity, conversations, GEMs, activity history, sync, errors | Consistent Web/Desktop behavior |
| **9. Package, secure and release** | License audits, installers, upgrades, backup/recovery, OS testing | Distributable PBMP Desktop (Windows, Linux, macOS) |

Stages **1–3** establish the desktop application. Stages **4–7** make it substantially more capable. Stages **8–9** make it operationally supportable.

### First important milestone (end of Stage 3)

PBMP already runs as a desktop application: dashboards, React Flow / Canvas, Blockly (where in tree), and currently available **web-connected** services work inside Tauri.

That proves we preserve the frontend investment. It does **not** prove offline: if LibreChat still depends on a remote backend, connectivity remains required. Offline is Stage 4+.

## 3. How Tauri converts PBMP Web into PBMP Desktop

### Step A — Take the existing PBMP React application

| Frontend | Backend services |
| --- | --- |
| React · HTML · CSS · JS · Canvas · React Flow · Three.js (where used) | PBMP APIs · LibreChat · DBs · Auth · business logic |

The browser downloads the frontend and talks to backends when needed. **Tauri packages the frontend.** It does **not** automatically convert or incorporate the entire backend (LibreChat Node/Mongo/RAG, Express, MySQL, etc.).

### Step B — Vite produces deployable frontend

Vite builds production assets, typically:

```text
dist/
  index.html
  assets/
```

Canvas / React Flow / Three.js stay as frontend assets. They are **not** rewritten in Rust.

### Step C — Tauri native host

`src-tauri/` is added beside the existing React/Vite tree:

```text
mainpbmp/
├── src/                 React source
├── public/
├── package.json
├── vite.config.ts
├── dist/                Built frontend
└── src-tauri/
    ├── src/             Rust
    ├── capabilities/
    ├── icons/
    ├── Cargo.toml
    └── tauri.conf.json
```

`tauri.conf.json` points at the Vite `dist/`, product name, window, and bundles. Canonical config in this repo uses:

- `productName` / window title: **PBMP Desktop**
- `identifier`: `ai.grow24.pbmp`
- `devUrl`: `http://localhost:5173`
- `frontendDist`: `../dist`
- `beforeDevCommand`: `npm run client`
- `beforeBuildCommand`: `npm run build`

### Step D — Compile and bundle

```bash
npm install -D @tauri-apps/cli
npm install @tauri-apps/api
# (already present) npx tauri init was used to create src-tauri/
npm run desktop:dev    # development window
npm run desktop:build  # production bundles
```

Flow: React/Vite build → Rust/Cargo build → Tauri bundler → OS packages (`.deb` / AppImage, `.exe` / `.msi`, `.app` / `.dmg`). Each OS needs its own build environment.

### Step E — Customer runs the app

OS starts the Tauri/Rust binary → native window with OS WebView → WebView loads bundled React → UI calls Rust via Tauri commands → Rust talks to local files/DB/processing as configured. Loading the **bundled frontend** does not require a PBMP web host. Local path:

```text
React UI → Tauri invoke → Rust → local resources → React UI
```

Tauri uses the OS WebView (not a full Chromium embed like Electron). WebView must be present/installable on the target OS.

## 4. OpenClaw, LibreChat, and computer vision in the package

Separate from basic Tauri conversion. Tauri **sidecars** can ship Node/Python workers so end users need not install those toolchains.

| Component | How deployed in PBMP Desktop |
| --- | --- |
| PBMP React UI | Embedded frontend assets |
| Tauri + Rust | Main native executable |
| OpenClaw | Managed local Gateway (service lifecycle; prefer OS service + adapter, not raw operator token in the WebView) |
| LibreChat frontend capabilities | Shared/reused React where licensed |
| LibreChat full backend | Initially organizational / remote — not every laptop |
| SQLite / PBMP Core | Local Rust-accessible services (Stage 4+) |
| Computer vision | Optional Python/native workers (see also `~/openclaw/pbmp-vision`) |
| ONNX / models | Approved runtime + model packs |
| Remote compute | PBMP Node Agent on authorized PCs |

OpenClaw: own runtime, plugins, state, background processes — packaging needs version pin, lifecycle, and update testing.  
LibreChat: full stack is not auto-bundled by Tauri; keep central services early; local AI pathway for offline is Stage 4–5 work. Desktop package does **not** inherit all LibreChat features offline by default.

Reference OpenClaw bridge / installer UX: `~/openclaw/pbmp-desktop-demo` (and Electron fallback for older Ubuntu).

## 5. Shared business functionality

```text
PBMP Web (browser) ─┐
                    ├── PBMP common service contracts
PBMP Desktop (Tauri)┘         │
                              ├── Remote: APIs, LibreChat, org DBs
                              └── Local: Rust, SQLite, OpenClaw, ONNX, Python, hardware
```

Example: `AnalyzeVideo` keeps the same meaning whether it runs in a browser-capable path, local Rust/ONNX, or on PC-2. Only the adapter changes. See `docs/STAGE2-SERVICE-CONTRACTS.md`.

## 6. Acceptance gates

| Gate | What must work |
| --- | --- |
| Desktop equivalence | Screens, Canvas, React Flow, Blockly (where present), auth, online services inside Tauri |
| Local independence | Selected ops, data, models with internet disconnected |
| Native execution | OpenClaw starts safely; Rust/Python/ONNX use supported hardware |
| Distributed execution | PC-1 → authorized PC-2 job → validated results |
| Production readiness | Signed packages where required, upgrades, backups, recovery, access control, license-compliant deps |

Test on Ubuntu first, then Windows/macOS with OS-specific builds. **Zero commercial-license-fee** policy is a release gate throughout — packaging ≠ redistribution rights.

## 7. Final recommendation

Prove Tauri packaging **before** OpenClaw and heavy native engines.

First demonstrable PBMP Desktop = **current React app** + working Canvas/modeling + existing online APIs + **minimal Rust** (e.g. CPU / RAM / storage). Then local DB + OpenClaw, then CV packs, then remote compute.

Two different problems:

1. Converting PBMP Web → desktop window (Tauri) — relatively straightforward.  
2. Local-first, AI-capable, secure, distributable, multi-machine PBMP — larger program.

---

## Current machine status (2026-11-16)

| Stage | Status | Notes |
| --- | --- | --- |
| 1. Baseline | **Done** | Inventory below |
| 2. Frontend vs services | **Started** | `docs/STAGE2-SERVICE-CONTRACTS.md` |
| 3. Introduce Tauri | **In progress on `mainpbmp`** | `src-tauri/`, Desktop button, `system_info`; prove window + online API |
| 4. Local PBMP Core | Not started on main UI | Demo has `system_info` only |
| 5. LibreChat + OpenClaw | Partial | LibreChat under `~/web/PBMP_LibreChat`; OpenClaw bridge in `~/openclaw/pbmp-desktop-*` |
| 6–9 | Not started | Capability packs, nodes, unify, release |

### Stage 1 — Application / dependency map (this machine)

| Path | Role |
| --- | --- |
| `/home/rudra/mainpbmp` | Primary PBMP Web workbench (React 19, Vite 8, Canvas, AI prefs, App Manager, react-admin, Express + MySQL) — **Stage 3 host** |
| `/home/rudra/pbmp_core` | Blockly workspace module |
| `/home/rudra/pbmp_workspace_new` | Workspace shell |
| `/home/rudra/pbmp_new` | Smaller React + Express app |
| `/home/rudra/web/PBMP_LibreChat` | LibreChat integration |
| `/home/rudra/web/PBMPChatBot` | Chatbot product |
| `/home/rudra/openclaw/pbmp-desktop-demo` | Tauri OpenClaw / installer reference |
| `/home/rudra/openclaw/pbmp-desktop-electron` | Electron fallback (e.g. Ubuntu 20.04) |
| `/home/rudra/openclaw/pbmp-vision` | Image/video analysis plugin/worker |

**`mainpbmp` browser:** layout, Canvas, AI UI, admin, App Manager, MySQL-backed workbench config.  
**`mainpbmp` services:** Express **5174** (Vite proxies `/api`), MySQL, MCP/AI under `server/`.

### How to run Stage 3 here

```bash
cd /home/rudra/mainpbmp
# Optional MySQL for full workbench config
./scripts/start-mysql-podman.sh   # or: npm run db:up

# Terminal A — API (still required at Stage 3)
npm run server

# Terminal B — desktop window (Vite :5173 + Tauri)
npm run desktop:dev
```

Second-machine notes: `docs/DESKTOP-SECOND-MACHINE.md`.

### Stage 3 acceptance checklist

1. PBMP Desktop window opens with the existing workbench UI.  
2. Header shows **Desktop** only inside Tauri.  
3. **Desktop** reports CPU, RAM, disk via Rust `system_info`.  
4. Online `/api` works when Express is running.

**Not yet required:** offline mode, OpenClaw inside this package, Python/ONNX, Node Agent.
