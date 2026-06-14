#!/bin/bash
set -euo pipefail
cd "D:/Programing/go/chainreactors/malice-network"
echo "Generating command reference..."
go run ./client/cmd/genhelp/
echo "Generating Lua API reference..."
go run ./client/cmd/genlua/
echo "Copying to wiki..."
cp docs/reference/commands/*.md "D:/Programing/blog/chainreactor-docs/docs/IoM/reference/commands/"
cp docs/reference/lua-api/*.md "D:/Programing/blog/chainreactor-docs/docs/IoM/reference/lua-api/"
echo "Done. Remember to add frontmatter if needed."
