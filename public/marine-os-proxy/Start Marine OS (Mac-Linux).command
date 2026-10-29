#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js is not installed. Get it from https://nodejs.org first."; exit 1; }
[ -d node_modules ] || { echo "Installing for the first time, this can take a minute..."; npm install; }
( sleep 4; open http://localhost:8080 >/dev/null 2>&1 || xdg-open http://localhost:8080 >/dev/null 2>&1 ) &
npm start
