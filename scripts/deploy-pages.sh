#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Refusing to deploy with tracked working-tree changes. Commit them first." >&2
  exit 1
fi

pnpm check
pnpm build

REMOTE_URL="$(git remote get-url origin)"
SOURCE_SHA="$(git rev-parse --short=12 HEAD)"
DEPLOY_DIR="$ROOT/.tmp/pages-deploy"

rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp -R "$ROOT/dist/." "$DEPLOY_DIR/"
touch "$DEPLOY_DIR/.nojekyll"

# Keep GitHub Pages source branch artifact-only and independent from source history.
git -C "$DEPLOY_DIR" init -q
git -C "$DEPLOY_DIR" checkout --orphan gh-pages >/dev/null 2>&1
git -C "$DEPLOY_DIR" config user.name "kikutadev"
git -C "$DEPLOY_DIR" config user.email "actions@users.noreply.github.com"
git -C "$DEPLOY_DIR" add -A
git -C "$DEPLOY_DIR" commit -q -m "deploy: $SOURCE_SHA"
git -C "$DEPLOY_DIR" remote add origin "$REMOTE_URL"
git -C "$DEPLOY_DIR" push --force origin HEAD:gh-pages

rm -rf "$DEPLOY_DIR"
echo "Published dist/ from $SOURCE_SHA to gh-pages."
