#!/usr/bin/env bash
# AtlasLab Code — C++ mühiti üçün wasm-clang fayllarını yükləyir və yoxlayır.
# İstifadə:  bash setup-wasm-clang.sh   (problem.html olan qovluqda işlət)
set -euo pipefail
DIR="wasm-clang"
BASE="https://raw.githubusercontent.com/binji/wasm-clang/master"
mkdir -p "$DIR"
cd "$DIR"

get() { echo "↓ $2"; curl -fL --retry 3 -o "$2" "$BASE/$1"; }
get clang       clang.wasm      # ~31 MB (brauzerə sıxılmış ~10 MB gedir, host sıxırsa)
get lld         lld.wasm        # ~19 MB
get memfs       memfs.wasm
get sysroot.tar sysroot.tar     # ~9 MB
get shared.js   shared.js
get LICENSE     LICENSE         # Apache-2.0 — saytda saxla

# Bu skriptin yoxladığı (test olunmuş) fayllarla tam eyni olmalıdır:
cat > SHA256SUMS <<'SUMS'
2a466f0e990329d3230b869d04fc20803eae96a7feb3a3f6c93e25a77b8aed1d  clang.wasm
36419ed202011765222098d7701218378b67f634d50f0a4625059ae2c9860f48  lld.wasm
2c72ee42bd9430029dda8c6bafc9f37143f6fe88d5f1ea950a70259ab748bcfe  memfs.wasm
2435a7b549af30c2be7ec249c405bc2e911ab0c6003012f0909ec3c131bff867  sysroot.tar
4de0be862bda1a7571c1f0632abe3c62c47a56e734cc6b703155805a4b160b1c  shared.js
SUMS
sha256sum -c SHA256SUMS
echo
echo "OK. İndi cpp-core.js və cpp-worker.js fayllarını da bu qovluğa ($DIR/) köçür."