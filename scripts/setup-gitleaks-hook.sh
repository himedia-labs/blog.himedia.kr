#!/usr/bin/env sh

set -eu

HOOK_PATH=".git/hooks/pre-commit"

cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env sh

set -eu

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "[pre-commit] gitleaks가 설치되어 있지 않습니다."
  echo "[pre-commit] 설치 후 다시 커밋해주세요. (https://github.com/gitleaks/gitleaks)"
  exit 1
fi

STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACM)"

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "[pre-commit] gitleaks 스캔 시작..."

echo "$STAGED_FILES" | while IFS= read -r file; do
  [ -f "$file" ] || continue
  gitleaks detect --no-git --source "$file" --redact --exit-code 1 >/dev/null
done

echo "[pre-commit] gitleaks 스캔 통과"
EOF

chmod +x "$HOOK_PATH"

echo "pre-commit hook 설치 완료: $HOOK_PATH"
