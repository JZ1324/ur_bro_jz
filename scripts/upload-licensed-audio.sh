#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if ! npm exec supabase -- projects list >/dev/null 2>&1; then
  echo "Supabase CLI is not signed in. Run: npm exec supabase -- login"
  exit 1
fi

npm exec supabase -- --experimental storage cp \
  "local-audio/so-easy-320.mp3" \
  "ss:///licensed-audio/so-easy/so-easy-320.mp3" \
  --content-type "audio/mpeg" \
  --cache-control "max-age=31536000, public, immutable"

npm exec supabase -- --experimental storage cp \
  "local-audio/so-easy-160.mp3" \
  "ss:///licensed-audio/so-easy/so-easy-160.mp3" \
  --content-type "audio/mpeg" \
  --cache-control "max-age=31536000, public, immutable"

npm exec supabase -- --experimental storage cp \
  "local-audio/so-easy-96.mp3" \
  "ss:///licensed-audio/so-easy/so-easy-96.mp3" \
  --content-type "audio/mpeg" \
  --cache-control "max-age=31536000, public, immutable"

echo "Licensed audio uploaded to Supabase Storage."
