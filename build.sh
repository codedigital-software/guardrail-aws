#!/usr/bin/env bash
# Guardrail — produce store-ready packages for Chrome and Edge (same MV3 zip,
# two names). Uses `zip` when available, otherwise Python's zipfile (Windows Git
# Bash ships no `zip`, and `tar -a` would silently emit a tar, not a zip).
set -e
cd "$(dirname "$0")"
mkdir -p dist
INCLUDE="manifest.json src data icons"
rm -f dist/guardrail-aws-chrome.zip dist/guardrail-aws-edge.zip

if command -v zip >/dev/null 2>&1; then
  zip -rq dist/guardrail-aws-chrome.zip $INCLUDE -x '*.sync*' -x '*.DS_Store' -x '*/.*'
else
  PY="$(command -v python || command -v python3 || true)"
  [ -n "$PY" ] || { echo "Need 'zip' or python to build." >&2; exit 1; }
  "$PY" - "$INCLUDE" <<'PYEOF'
import os, sys, zipfile
items = sys.argv[1].split()
def skip(name):
    return ".sync" in name or name == ".DS_Store" or name.startswith(".")
with zipfile.ZipFile("dist/guardrail-aws-chrome.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for it in items:
        if os.path.isfile(it):
            z.write(it, it)
        else:
            for dp, dirs, files in os.walk(it):
                for f in sorted(files):
                    full = os.path.join(dp, f)
                    rel = os.path.relpath(full, ".").replace(os.sep, "/")
                    if not skip(os.path.basename(rel)):
                        z.write(full, rel)
PYEOF
fi

cp dist/guardrail-aws-chrome.zip dist/guardrail-aws-edge.zip
echo "Built:"
echo "  dist/guardrail-aws-chrome.zip  -> Chrome Web Store"
echo "  dist/guardrail-aws-edge.zip    -> Microsoft Edge Add-ons"
"${PY:-python}" -c "import zipfile;z=zipfile.ZipFile('dist/guardrail-aws-chrome.zip');n=z.namelist();print('  %d files, manifest.json at root: %s' % (len(n), 'manifest.json' in n))" 2>/dev/null || true
