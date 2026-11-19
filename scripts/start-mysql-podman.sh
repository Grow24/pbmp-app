#!/usr/bin/env bash
# Starts PBMP MySQL on host port 3310 using Podman (or Docker if present).
set -euo pipefail

NAME=pbmp-mysql
IMAGE=docker.io/library/mysql:8.0

if command -v podman >/dev/null; then
  RUNTIME=podman
elif command -v docker >/dev/null; then
  RUNTIME=docker
else
  echo "Install Podman or Docker first."
  exit 1
fi

if $RUNTIME ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "Starting existing container $NAME…"
  $RUNTIME start "$NAME" >/dev/null
else
  echo "Creating $NAME on port 3310…"
  $RUNTIME run -d --name "$NAME" \
    -e MYSQL_ROOT_PASSWORD=pbmp \
    -e MYSQL_DATABASE=pbmp_workbench \
    -e MYSQL_USER=pbmp \
    -e MYSQL_PASSWORD=pbmp \
    -p 3310:3306 \
    "$IMAGE" \
    --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
fi

echo "Waiting for MySQL…"
for i in $(seq 1 60); do
  if $RUNTIME exec "$NAME" mysqladmin ping -h127.0.0.1 -upbmp -ppbmp --silent 2>/dev/null; then
    echo "MySQL ready on 127.0.0.1:3310 (user/db/password: pbmp / pbmp_workbench / pbmp)"
    exit 0
  fi
  sleep 2
done

echo "MySQL did not become ready in time. Check: $RUNTIME logs $NAME"
exit 1
