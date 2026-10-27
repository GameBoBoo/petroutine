#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export DELIVERY_PROJECT="${DELIVERY_PROJECT:-pawroutine-delivery}"
export DELIVERY_IMAGE="${DELIVERY_IMAGE:-pawroutine-delivery:local}"
export DELIVERY_REVISION="${DELIVERY_REVISION:-$(git rev-parse HEAD 2>/dev/null || printf working-tree)}"
[[ "$DELIVERY_PROJECT" =~ ^[a-z0-9][a-z0-9_-]*$ ]] || { echo 'Invalid DELIVERY_PROJECT' >&2; exit 1; }
config="${DELIVERY_ENV_FILE:-.delivery.env}"
mkdir -p artifacts/verification artifacts/backups
app() { docker compose --env-file "$config" -p "$DELIVERY_PROJECT" -f compose.delivery.yml "$@"; }
verify() { docker compose --env-file .env.example -p "${DELIVERY_PROJECT}-verify" -f compose.verify.yml "$@"; }
smoke() { app exec -T web node scripts/delivery-smoke.mjs | tee artifacts/smoke.json; }
case "${1:-help}" in
  init)
    if [[ -e "$config" ]]; then echo 'Delivery environment already exists'; exit 0; fi
    umask 077
    printf 'JWT_SECRET=%s\nDELIVERY_DB_PASSWORD=%s\nDELIVERY_PORT=3000\nDELIVERY_BIND_ADDRESS=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 24)" "${DELIVERY_BIND_ADDRESS:-127.0.0.1}" > "$config"
    echo 'Created private delivery environment (AI disabled)'
    ;;
  verify)
    trap 'verify down --remove-orphans' EXIT
    verify build verify
    verify up -d --wait testdb
    verify run --rm verify
    ;;
  build)
    docker build --label "org.opencontainers.image.revision=$DELIVERY_REVISION" -t "$DELIVERY_IMAGE" .
    docker image inspect "$DELIVERY_IMAGE" --format '{{.Id}}' > artifacts/image-id.txt
    printf '%s\n' "$DELIVERY_REVISION" > artifacts/revision.txt
    ;;
  deploy)
    app config --quiet
    app up -d --wait --wait-timeout 180
    smoke
    ;;
  smoke) smoke ;;
  backup)
    backup="artifacts/backups/$(date -u +%Y%m%dT%H%M%SZ).dump"
    umask 077
    app exec -T db pg_dump -U pawroutine -d pawroutine -Fc > "$backup"
    printf '%s\n' "$backup" > artifacts/latest-backup.txt
    sha256sum "$backup" > "$backup.sha256"
    echo "Backup saved: $backup"
    ;;
  recovery-check)
    backup="$(cat artifacts/latest-backup.txt)"
    [[ "$backup" =~ ^artifacts/backups/[0-9TZ]+\.dump$ ]] || { echo 'Invalid backup path' >&2; exit 1; }
    sha256sum --check "$backup.sha256"
    restored="recovery_$(date -u +%Y%m%d%H%M%S)"
    counts='SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM households), (SELECT count(*) FROM pets), (SELECT count(*) FROM routines);'
    original="$(app exec -T db psql -U pawroutine -d pawroutine -Atc "$counts")"
    app exec -T db createdb -U pawroutine "$restored"
    # Leave the restored database available for inspection. Never overwrite the live database.
    app exec -T db pg_restore -U pawroutine -d "$restored" --exit-on-error --no-owner < "$backup"
    recovered="$(app exec -T db psql -U pawroutine -d "$restored" -Atc "$counts")"
    [[ "$original" == "$recovered" ]] || { echo 'Restored row counts differ' >&2; exit 1; }
    printf 'PASS backup checksum, pg_restore, core row counts=%s; restored database=%s\n' "$recovered" "$restored" | tee artifacts/recovery.txt
    ;;
  rollback)
    : "${PREVIOUS_IMAGE:?Set PREVIOUS_IMAGE to the previously verified image tag}"
    export DELIVERY_IMAGE="$PREVIOUS_IMAGE"
    app up -d --wait --wait-timeout 180 web
    smoke
    ;;
  down) app down ;;
  *) echo 'Usage: bash scripts/delivery.sh init|verify|build|deploy|smoke|backup|recovery-check|rollback|down'; exit 2 ;;
esac
