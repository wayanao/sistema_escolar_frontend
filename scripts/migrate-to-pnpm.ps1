# Script de migración a pnpm (PowerShell)
# Úsalo desde la raíz del repo: .\frontend-react\scripts\migrate-to-pnpm.ps1

Set-StrictMode -Version Latest
Push-Location -LiteralPath (Join-Path $PSScriptRoot '..')
try {
    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        Write-Output 'Habilitando Corepack y preparando pnpm...'
        corepack enable
        corepack prepare pnpm@latest --activate
    } elseif (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Output 'pnpm no encontrado; instalando globalmente con npm...'
        npm install -g pnpm
    }

    if (Test-Path -LiteralPath 'node_modules') {
        Write-Output 'Eliminando node_modules para una instalación limpia...'
        Remove-Item -LiteralPath 'node_modules' -Recurse -Force
    }

    if (Test-Path -LiteralPath 'package-lock.json') {
        Write-Output 'Importando package-lock.json -> pnpm-lock.yaml'
        pnpm import
    } else {
        Write-Output 'No se encontró package-lock.json; ejecutando pnpm install'
        pnpm install
    }

    Write-Output 'Instalación completada. Ejecuta: pnpm run dev'
} finally {
    Pop-Location
}
