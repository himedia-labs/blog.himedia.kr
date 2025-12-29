#!/usr/bin/env bash

# PostgreSQL 마이그레이션 적용 스크립트
# 사용법:
# 1) PostgreSQL 서버가 실행 중인지 확인합니다.
# 2) script/.env 또는 환경변수(DB_URL/DB_USERNAME/DB_PASSWORD)를 설정합니다.
# 3) ./script/migrate-db.sh 실행 (실행 권한 필요: chmod +x script/migrate-db.sh)

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
  if [ -t 1 ]; then
    echo -e "${BLUE}[INFO]${NC} $1"
  else
    echo "[INFO] $1"
  fi
}

log_success() {
  if [ -t 1 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} $1"
  else
    echo "[SUCCESS] $1"
  fi
}

log_warning() {
  if [ -t 1 ]; then
    echo -e "${YELLOW}[WARNING]${NC} $1"
  else
    echo "[WARNING] $1"
  fi
}

log_error() {
  if [ -t 1 ]; then
    echo -e "${RED}[ERROR]${NC} $1"
  else
    echo "[ERROR] $1"
  fi
}

# 스크립트 디렉토리 및 프로젝트 루트
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

readonly DEFAULT_WAIT_TIMEOUT="60"
readonly DEFAULT_MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"

# 오직 script/.env만 로드합니다. 이미 설정된 환경변수는 덮어쓰지 않습니다.
maybe_source_env() {
  [ "${NO_DOTENV:-}" = "1" ] && return 0
  local candidates=(
    "$SCRIPT_DIR/.env"
  )
  for f in "${candidates[@]}"; do
    if [ -f "$f" ]; then
      log_info "환경변수 파일 로드: $f"
      # shellcheck disable=SC2046,SC2163
      while IFS='=' read -r k v; do
        # skip comments/empty
        if [[ -z "$k" || "$k" =~ ^\s*# ]]; then continue; fi
        # strip export and whitespace
        k="${k#export }"; k="${k// /}"
        export "$k"="${v}"
      done < <(grep -E '^[A-Za-z_][A-Za-z0-9_]*\s*=.*' "$f" | sed -e 's/\r$//')
    fi
  done
}

# DB_URL 파싱 (jdbc:postgresql://host:port/name?...)
parse_db_url() {
  local url="$1"
  [ -z "$url" ] && return 0
  # jdbc 프리픽스 제거
  local rest="${url#jdbc:postgresql://}"
  # 쿼리스트링 제거
  rest="${rest%%\?*}"
  # host:port/db
  local hostport="${rest%%/*}"
  local dbname="${rest#*/}"
  if [ -z "$dbname" ] || [ "$dbname" = "$rest" ]; then
    log_warning "DB_URL에서 데이터베이스 이름을 찾지 못했습니다: $url"
  fi
  local host="$hostport" port=""
  if [[ "$hostport" == *:* ]]; then
    host="${hostport%%:*}"
    port="${hostport#*:}"
  fi
  # 환경변수가 비어 있을 때만 채움
  [ -z "${DB_HOST:-}" ] && [ -n "$host" ] && export DB_HOST="$host"
  [ -z "${DB_PORT:-}" ] && [ -n "$port" ] && export DB_PORT="$port"
  [ -z "${DB_NAME:-}" ] && [ -n "$dbname" ] && export DB_NAME="$dbname"
}

# --- config bootstrap ---
init_config() {
  # .env 로드 및 DB_URL 해석 (환경변수 우선)
  maybe_source_env
  parse_db_url "${DB_URL:-}"

  for var in DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD; do
    if [ -z "${!var:-}" ]; then
      log_error "$var 환경변수가 설정되어 있지 않습니다."
      exit 1
    fi
  done

  # 환경변수로 오버라이드 가능
  DB_HOST="${DB_HOST}"
  DB_PORT="${DB_PORT}"
  DB_USER="${DB_USERNAME:-${DB_USER}}"
  DB_NAME="${DB_NAME}"
  MIGRATIONS_DIR="${MIGRATIONS_DIR:-$DEFAULT_MIGRATIONS_DIR}"
  WAIT_TIMEOUT="${WAIT_TIMEOUT:-$DEFAULT_WAIT_TIMEOUT}"

  if [[ "$MIGRATIONS_DIR" != /* ]]; then
    local project_candidate="$PROJECT_ROOT/$MIGRATIONS_DIR"
    if [ -d "$project_candidate" ]; then
      MIGRATIONS_DIR="$project_candidate"
    fi
  fi
}

# PostgreSQL CLI가 PATH에 있는지 확인합니다. 필요한 경우 대표 설치 경로를 자동 추가합니다.
add_psql_path_if_needed() {
  local dir="$1"
  [ -d "$dir" ] || return 1
  [ -x "$dir/psql" ] || return 1
  case ":$PATH:" in
    *":$dir:"*) : ;;
    *) PATH="$dir:$PATH" ;;
  esac
  return 0
}

ensure_psql_tools() {
  if [ -n "${PSQL_BIN_DIR:-}" ]; then
    add_psql_path_if_needed "$PSQL_BIN_DIR" || true
  fi

  if ! command -v psql >/dev/null 2>&1; then
    local candidates=(
      /opt/homebrew/bin
      /usr/local/bin
      /opt/homebrew/opt/libpq/bin
      /usr/local/opt/libpq/bin
      /opt/homebrew/opt/postgresql/bin
      /usr/local/opt/postgresql/bin
      /Applications/Postgres.app/Contents/Versions/latest/bin
    )
    for dir in "${candidates[@]}" \
      /Library/PostgreSQL/*/bin \
      /opt/homebrew/opt/postgresql@*/bin \
      /usr/local/opt/postgresql@*/bin \
      /opt/homebrew/Cellar/postgresql@*/[0-9]*/bin \
      /usr/local/Cellar/postgresql@*/[0-9]*/bin \
      /usr/lib/postgresql/*/bin \
      /usr/pgsql-*/bin \
      /usr/local/pgsql/bin; do
      add_psql_path_if_needed "$dir" || true
      if command -v psql >/dev/null 2>&1; then
        break
      fi
    done
  fi

  if ! command -v psql >/dev/null 2>&1; then
    log_error "필요한 명령어 'psql' 을 찾을 수 없습니다. PATH를 확인하거나 PSQL_BIN_DIR 환경변수로 경로를 지정하세요."
    exit 1
  fi
}

# prepare psql and common options when needed
prepare_psql() {
  ensure_psql_tools

  if [ -n "${DB_PASSWORD:-}" ]; then
    export PGPASSWORD="$DB_PASSWORD"
  fi

  PSQL_OPTS=( -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" )
}

# prepare_psql()가 먼저 호출되어야 PSQL_OPTS가 채워집니다.
psql_db() {
  local database="$1"
  shift
  psql -X "${PSQL_OPTS[@]}" -d "$database" "$@"
}

ensure_migrations_table() {
  psql_db "$DB_NAME" -v ON_ERROR_STOP=1 -c "\
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );" > /dev/null
}

apply_migrations() {
  if [ ! -d "$MIGRATIONS_DIR" ]; then
    log_warning "마이그레이션 폴더 '$MIGRATIONS_DIR'을 찾을 수 없습니다."
    return 0
  fi

  shopt -s nullglob
  local files=("$MIGRATIONS_DIR"/*.sql)
  shopt -u nullglob

  if [ "${#files[@]}" -eq 0 ]; then
    log_warning "적용할 마이그레이션이 없습니다."
    return 0
  fi

  for file in "${files[@]}"; do
    local filename
    filename="$(basename "$file")"

    local escaped_filename
    escaped_filename="${filename//\'/\'\'}"

    local applied
    applied=$(psql_db "$DB_NAME" -At -c "SELECT 1 FROM schema_migrations WHERE filename = '${escaped_filename}';")
    if [ "$applied" = "1" ]; then
      log_info "스킵: $filename (이미 적용됨)"
      continue
    fi

    log_info "마이그레이션 적용: $filename"
    psql_db "$DB_NAME" -v ON_ERROR_STOP=1 -f "$file" > /dev/null
    psql_db "$DB_NAME" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (filename) VALUES ('${escaped_filename}');" > /dev/null
    log_success "완료: $filename"
  done
}

main() {
  init_config
  prepare_psql

  ensure_migrations_table
  apply_migrations
}

main "$@"
