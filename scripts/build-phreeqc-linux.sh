#!/usr/bin/env bash
# Rebuild the pinned Linux x64 runtime; run on Linux with curl, tar and make.
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
cd "$scratch"
curl -fsSL https://water.usgs.gov/water-resources/software/PHREEQC/phreeqc-3.8.6-17100.tar.gz -o source.tar.gz
echo 'b5c4a6dfea1a6bb6a3436857a50346bb943904a49582714494b4f1b1e54e64e1  source.tar.gz' | sha256sum -c -
curl -fsSL https://ziglang.org/download/0.15.2/zig-x86_64-linux-0.15.2.tar.xz -o zig.tar.xz
echo '02aa270f183da276e5b5920b1dac44a63f1a49e55050ebde3aecc9eb82f93239  zig.tar.xz' | sha256sum -c -
mkdir compiler
tar xf zig.tar.xz -C compiler --strip-components=1
tar xzf source.tar.gz
cd phreeqc-3.8.6-17100
./configure CC="$scratch/compiler/zig cc -target x86_64-linux-musl" \
  CXX="$scratch/compiler/zig c++ -target x86_64-linux-musl" \
  CFLAGS='-O2' CXXFLAGS='-O2' LDFLAGS='-static -s'
make -j4
destination="$repo/tools/research/phreeqc-pin/3.8.6-17100"
cp src/phreeqc "$destination/bin/phreeqc-linux-x64"
{
  cat doc/NOTICE
  printf '\n\n=== Zig compiler runtime ===\n\n'
  cat "$scratch/compiler/LICENSE"
  for notice in libc/musl/COPYRIGHT libcxx/LICENSE.TXT libcxxabi/LICENSE.TXT libunwind/LICENSE.TXT; do
    printf '\n\n=== %s ===\n\n' "$notice"
    cat "$scratch/compiler/lib/$notice"
  done
} | sed 's/[[:blank:]]*$//' > "$destination/NOTICE-linux.txt"
sha256sum "$destination/bin/phreeqc-linux-x64"
# Record the new executable hash in PIN.json after reviewing/testing a rebuild.
