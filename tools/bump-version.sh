#!/usr/bin/env bash
# Stamp every local CSS/JS link with ?v=<version> so browsers fetch fresh files after each release
# (GitHub Pages lets browsers cache them for ~10 minutes otherwise). Run before committing a release:
#   tools/bump-version.sh            # version = today's date, e.g. 20261026
#   tools/bump-version.sh 20261026b  # or any label
set -euo pipefail
cd "$(dirname "$0")/.."
v="${1:-$(date +%Y%m%d)}"
files=$(ls *.html blog/*.html admin/*.html 2>/dev/null || true)
# href/src="/....css" or ".js" (local only), with or without an existing ?v=
perl -pi -e 's{((?:href|src)="/(?:[\w./-]+)\.(?:css|js))(?:\?v=[\w-]+)?"}{$1?v='"$v"'"}g' $files
echo "Stamped CSS/JS links with ?v=$v in $(echo "$files" | wc -w) pages"
