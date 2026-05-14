#!/usr/bin/env bash
set -euo pipefail

# Script de migración a pnpm (bash/unix)
# Úsalo desde la raíz del repo: ./frontend-react/scripts/migrate-to-pnpm.sh

cd "$(dirname "$0")/.." || exit 1

if command -v corepack >/dev/null 2>&1; then
  echo "Habilitando Corepack y preparando pnpm..."
  corepack enable
  corepack prepare pnpm@latest --activate
else
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm no encontrado; instalando globalmente con npm..."
    npm install -g pnpm
  fi
fi

if [ -d node_modules ]; then
  echo "Eliminando node_modules para una instalación limpia..."
  rm -rf node_modules
fi

if [ -f package-lock.json ]; then
  echo "Importando package-lock.json -> pnpm-lock.yaml"
  pnpm import
else
  echo "No se encontró package-lock.json; ejecutando pnpm install"
  pnpm install
fi

echo "Instalación completada. Ejecuta: pnpm run dev"
