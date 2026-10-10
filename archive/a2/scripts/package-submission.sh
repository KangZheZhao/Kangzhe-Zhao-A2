#!/bin/sh
set -eu

archive_prefix=${1:-username}
case "$archive_prefix" in
  ''|*[!A-Za-z0-9_-]*)
    echo "Use a username containing only letters, digits, underscores or hyphens." >&2
    exit 2
    ;;
esac

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"
mkdir -p output

client_archive="output/${archive_prefix}A2-clientside.zip"
api_archive="output/${archive_prefix}A2-api.zip"
rm -f "$client_archive" "$api_archive"

zip -q "$client_archive" \
  clientside/index.html clientside/search.html clientside/event.html clientside/about.html \
  clientside/styles.css \
  clientside/js/common.js clientside/js/home.js \
  clientside/js/search.js clientside/js/event.js \
  clientside/assets/sydney-harbour.jpg clientside/assets/community-run.jpg \
  clientside/assets/market.jpg clientside/assets/dinner.jpg \
  clientside/assets/concert.jpg clientside/assets/art-gallery.jpg \
  clientside/assets/BarlowCondensed-Bold.ttf \
  clientside/assets/OFL.txt clientside/assets/CREDITS.md

zip -q "$api_archive" \
  README.md api/.env.example api/package.json api/package-lock.json \
  api/event_db.js api/server.js api/charityevents_db.sql \
  api/test/smoke.mjs

unzip -tq "$client_archive" >/dev/null
unzip -tq "$api_archive" >/dev/null
printf 'Created %s and %s\n' "$client_archive" "$api_archive"
