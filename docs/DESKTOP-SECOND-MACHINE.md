# PBMP Desktop — doosri machine par test

Ye Stage 3 setup hai: wahi React workbench + Tauri window. Online API ke liye MySQL chahiye.

## Is machine se code kaise le jaayein

**Option A — GitHub (best)**  
Is machine par Tauri wale changes commit/push karwao, phir doosri machine:

```bash
git clone https://github.com/Grow24/pbmp-app.git
cd pbmp-app
git checkout move-chat-panel-left   # ya jis branch par push ho
```

**Option B — Archive copy**  
Is machine par bani file:

`/home/rudra/mainpbmp-desktop-stage3.tgz`

USB / `scp` se doosri machine par copy karke:

```bash
mkdir -p ~/pbmp-app && tar -xzf mainpbmp-desktop-stage3.tgz -C ~/pbmp-app
cd ~/pbmp-app
```

`.env`, `node_modules`, aur `src-tauri/target` archive mein nahi hain.

## Doosri machine requirements

- Ubuntu **22.04+** (Tauri v2 = webkit2gtk **4.1**)
- Node **20+**
- Rust (script install kar degi)
- Podman **ya** Docker (MySQL ke liye)
- Display (desktop session) — headless SSH se window nahi khulegi

## Ek baar setup

```bash
cd ~/pbmp-app   # ya jahan extract kiya
chmod +x scripts/*.sh
./scripts/setup-desktop-dev.sh
./scripts/start-mysql-podman.sh
```

## Har baar chalaane ka tareeka (2 terminals)

```bash
# Terminal 1 — API + MySQL seed
npm run server

# Terminal 2 — Vite + Tauri window
npm run desktop:dev
```

Browser se bhi test:

```bash
npm run client
# http://localhost:5173
```

API health: http://localhost:5174/api/health

## Verify

1. Window title: **PBMP Desktop**
2. Workbench load ho (MySQL error na aaye)
3. Header / error screen par **Desktop** → CPU / RAM / disk dikhe

## Agar "Could not load workbench config" aaye

1. `./scripts/start-mysql-podman.sh` dubara chalao  
2. `.env` mein `DB_PORT=3310`, `DB_USER=pbmp`, `DB_PASSWORD=pbmp`, `DB_NAME=pbmp_workbench`  
3. `npm run server` — log mein `PBMP API on http://0.0.0.0:5174` aana chahiye  
4. Page refresh

## Notes

- Pehli `desktop:dev` Rust compile ki wajah se 1–2 minute le sakti hai.
- OpenClaw / offline SQLite is Stage 3 mein nahi hai.
- Installer (`.deb`) baad mein Stage 9; abhi source + `desktop:dev` se test karo.
