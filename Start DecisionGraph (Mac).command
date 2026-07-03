#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js is required to run DecisionGraph."
  echo "  Download the LTS version from https://nodejs.org, install it,"
  echo "  then double-click this file again."
  echo
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies — first run only, takes a minute or two..."
  npm install
fi

echo
echo "  Starting DecisionGraph at http://localhost:3000"
echo

(sleep 3 && open http://localhost:3000) &
npm run dev
