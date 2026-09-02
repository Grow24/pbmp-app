# PBMP Workbench

React workbench plus admin panel. Menus, tabs, and page content load from MySQL. Express serves `/api` and the built frontend from the same service.

- Workbench: `/`
- Admin / config: `/admin`
- Health: `/api/health`

## Local

```bash
cp .env.example .env
# set DB_* to your MySQL
npm install
npm run dev
```

Workbench: http://localhost:5173  
Admin: http://localhost:5173/admin  
API: http://localhost:5174/api/health

## GitHub

Repo: https://github.com/Grow24/pbmp-app

1. Push this project to the `main` branch (do not commit `.env`).
2. In GitHub org **Grow24** → **Settings** → **Third-party Access** / **GitHub Apps**, allow **Zeabur** to read `pbmp-app`.
3. No GitHub Actions are required. Zeabur builds from GitHub on each push to `main`.
4. Keep secrets only in Zeabur Variables, never in the repo.

## Zeabur (dynamic MySQL must work)

Use **one Zeabur project** with **two services**: MySQL + Node. Do not deploy this repo as a static Vite site.

### 1. Create project

1. Open [Zeabur Dashboard](https://dash.zeabur.com).
2. Create a project (example name: `pbmp-app`).
3. Pick a region close to users.

### 2. Add MySQL

1. **Add Service** → **Marketplace** / **Prebuilt** → **MySQL**.
2. Wait until it is running.
3. Note that Zeabur exposes these to other services in the same project:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USERNAME`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

Do not rename the MySQL service variables. First boot of the Node app creates tables and seeds demo content if the database is empty.

### 3. Add the GitHub app (Node)

1. **Add Service** → **Git** → GitHub → `Grow24/pbmp-app` → branch `main`.
2. Root directory: `/` (repo root).
3. Confirm it is a **Node** service, not static/Caddy. `zbpack.json` sets:
   - build: `npm run build`
   - start: `npm start`
4. Do **not** set `ZBPACK_OUTPUT_DIR` or `output_dir=dist`. That would host only HTML and `/api` would stop working.

### 4. Variables on the **Node** service

In the Node service **Variables** tab, add:

```env
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_USER=${MYSQL_USERNAME}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
NODE_ENV=production
```

Rules:

- Create `DB_*` on the Node service. Do **not** create `MYSQL_*` on the Node service; those come from MySQL and would be overwritten.
- `PORT` is injected by Zeabur. Do not hardcode `5173` or `5174`.
- Redeploy after saving variables.

### 5. Domain

1. Node service → **Networking** / **Domain**.
2. Generate a `*.zeabur.app` domain (or bind a custom domain).
3. Open:
   - `https://YOUR_DOMAIN/` — workbench (MySQL data)
   - `https://YOUR_DOMAIN/admin` — admin panel
   - `https://YOUR_DOMAIN/api/health` — should return `{"ok":true,"db":true}`

### 6. Verify dynamic behaviour

1. Open `/admin` → change a menu label or KPI → Save.
2. Open `/` and confirm the workbench shows the new value.
3. If the UI is empty or shows a MySQL error, check Node **Runtime Logs** for `MySQL user@host:port/database` and connection errors. Confirm both services are in the **same project**.

## Stack

Vite + React 19 + Express + MySQL 8.
