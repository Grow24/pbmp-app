#!/usr/bin/env bash
# Installs local prerequisites for PBMP Desktop (Stage 3) on Ubuntu 22.04+.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Checking Node / npm"
command -v node >/dev/null || { echo "Install Node 20+ first: https://nodejs.org"; exit 1; }
command -v npm >/dev/null || { echo "npm is missing"; exit 1; }
node -v
npm -v

echo "==> Checking Rust"
if ! command -v rustc >/dev/null || ! command -v cargo >/dev/null; then
  echo "Installing Rust via rustup…"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi
rustc -V
cargo -V

echo "==> System packages for Tauri (Ubuntu/Debian)"
if command -v apt-get >/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends \
    build-essential curl wget file \
    libwebkit2gtk-4.1-dev \
    libxdo-dev libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf
fi

echo "==> npm install"
npm install --no-audit --no-fund

if [[ ! -f .env ]]; then
  cp .env.example .env
  # Match the Podman MySQL helper below
  if grep -q '^DB_PORT=' .env; then
    sed -i 's/^DB_PORT=.*/DB_PORT=3310/' .env
  else
    echo 'DB_PORT=3310' >> .env
  fi
  if grep -q '^DB_USER=' .env; then
    sed -i 's/^DB_USER=.*/DB_USER=pbmp/' .env
  fi
  if grep -q '^DB_PASSWORD=' .env; then
    sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=pbmp/' .env
  fi
  if grep -q '^DB_NAME=' .env; then
    sed -i 's/^DB_NAME=.*/DB_NAME=pbmp_workbench/' .env
  fi
  echo "Created .env (edit if your MySQL differs)."
fi

echo
echo "Next:"
echo "  1) Start MySQL:  ./scripts/start-mysql-podman.sh"
echo "  2) API:          npm run server"
echo "  3) Desktop:      npm run desktop:dev"
echo "Or browser only:   npm run client   → http://localhost:5173"
