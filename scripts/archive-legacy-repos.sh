#!/usr/bin/env bash
# ============================================================================
# archive-legacy-repos.sh
# Archiva y transfiere repos legacy de JCajiao → Sentinels-Hub-Legacy
#
# Uso:
#   chmod +x scripts/archive-legacy-repos.sh
#   ./scripts/archive-legacy-repos.sh [--dry-run]
#
# Requiere: gh CLI autenticado con permisos de admin en ambas orgs
# ============================================================================

set -euo pipefail

SOURCE_OWNER="JCajiao"
TARGET_OWNER="Sentinels-Hub-Legacy"
LOCAL_HUB_DIR="${SENTINELS_HUB_DIR:-$(cd "$(dirname "$0")/.." && pwd)/..}"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# Lista de repos a archivar y transferir
LEGACY_REPOS=(
  "agents-sak"
  "ai-jokes-landing-journal"
  "cerebro-genesis"
  "ironman-hello-world-site-journal"
  "minecraft-marvel-vs-kaiju-journal"
  "oraculo-matrix-ia-journal"
  "sentinel-dummy-api"
  "sentinels-agents-journal"
  "sentinels-labyrinth-journal"
  "sentinels-toolkit-v4"
  "web-hola-mundo-matrix-vs-inception"
  "web-hola-mundo-matrix-vs-inception-journal"
  "web-hola-mundo-matrix-vs-starwars-journal"
  "zion-library-journal"
)

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; }

# Pre-flight checks
preflight() {
  if ! command -v gh &>/dev/null; then
    fail "gh CLI no encontrado. Instálalo: https://cli.github.com/"
    exit 1
  fi

  if ! gh auth status &>/dev/null; then
    fail "gh no autenticado. Ejecuta: gh auth login"
    exit 1
  fi

  # Verificar que el target owner existe
  if ! gh api "users/${TARGET_OWNER}" &>/dev/null && \
     ! gh api "orgs/${TARGET_OWNER}" &>/dev/null; then
    fail "No se encontró la org/usuario '${TARGET_OWNER}' en GitHub"
    exit 1
  fi

  log "Pre-flight checks passed"
}

# Archivar un repo en GitHub
archive_repo() {
  local repo="$1"
  local full_name="${SOURCE_OWNER}/${repo}"

  if $DRY_RUN; then
    log "[DRY-RUN] Archivaría: ${full_name}"
    return 0
  fi

  log "Archivando ${full_name}..."
  if gh repo archive "${full_name}" --yes 2>/dev/null; then
    ok "Archivado: ${full_name}"
  else
    warn "No se pudo archivar ${full_name} (puede que ya esté archivado)"
  fi
}

# Transferir un repo a la org destino
transfer_repo() {
  local repo="$1"
  local full_name="${SOURCE_OWNER}/${repo}"

  if $DRY_RUN; then
    log "[DRY-RUN] Transferiría: ${full_name} → ${TARGET_OWNER}/${repo}"
    return 0
  fi

  log "Transfiriendo ${full_name} → ${TARGET_OWNER}/${repo}..."
  if gh api --method POST "repos/${full_name}/transfer" \
       -f new_owner="${TARGET_OWNER}" 2>/dev/null; then
    ok "Transferido: ${full_name} → ${TARGET_OWNER}/${repo}"
  else
    fail "Error al transferir ${full_name}"
    return 1
  fi
}

# Mover carpeta local a legacy
move_local_folder() {
  local repo="$1"
  local src="${LOCAL_HUB_DIR}/${repo}"
  local legacy_dir="${LOCAL_HUB_DIR}/../Sentinels-Hub-Legacy"

  if $DRY_RUN; then
    log "[DRY-RUN] Movería: ${src} → ${legacy_dir}/${repo}"
    return 0
  fi

  if [[ ! -d "$src" ]]; then
    warn "Carpeta local no encontrada: ${src}"
    return 0
  fi

  mkdir -p "$legacy_dir"
  mv "$src" "$legacy_dir/"
  ok "Movido localmente: ${repo} → Sentinels-Hub-Legacy/"
}

# ============================================================================
# Main
# ============================================================================

echo ""
echo "=============================================="
echo " SENTINELS HUB — Archive Legacy Repos"
echo "=============================================="
echo " Source:  ${SOURCE_OWNER}"
echo " Target:  ${TARGET_OWNER}"
echo " Repos:   ${#LEGACY_REPOS[@]}"
echo " Dry-run: ${DRY_RUN}"
echo "=============================================="
echo ""

preflight

if ! $DRY_RUN; then
  echo ""
  warn "Esto archivará y transferirá ${#LEGACY_REPOS[@]} repos."
  read -rp "¿Continuar? (y/N): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log "Operación cancelada."
    exit 0
  fi
  echo ""
fi

SUCCESS=0
FAILED=0

for repo in "${LEGACY_REPOS[@]}"; do
  echo "──────────────────────────────────────────────"
  log "Procesando: ${repo}"

  # Paso 1: Archivar en GitHub
  if archive_repo "$repo"; then
    # Paso 2: Transferir a Sentinels-Hub-Legacy
    if transfer_repo "$repo"; then
      # Paso 3: Mover carpeta local
      move_local_folder "$repo"
      ((SUCCESS++))
    else
      ((FAILED++))
    fi
  else
    ((FAILED++))
  fi
done

echo ""
echo "=============================================="
echo " RESUMEN"
echo "=============================================="
ok "Exitosos: ${SUCCESS}/${#LEGACY_REPOS[@]}"
[[ $FAILED -gt 0 ]] && fail "Fallidos:  ${FAILED}/${#LEGACY_REPOS[@]}"
echo "=============================================="

if $DRY_RUN; then
  echo ""
  warn "Modo dry-run. No se realizaron cambios."
  warn "Ejecuta sin --dry-run para aplicar."
fi
