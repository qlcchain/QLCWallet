#!/bin/bash

set -e

version='v1.0.1-b32960b'

echo 'download macOS x64 binary'
mkdir -p extra/darwin/x64/
wget -O extra/darwin/x64/gqlc https://github.com/qlcchain/go-qlc/releases/download/v1.0.1/gqlc-darwin-amd64-${version}
chmod +x extra/darwin/x64/gqlc
echo 'download linux x64 binary'
mkdir -p extra/linux/x64/
wget -O extra/linux/x64/gqlc https://github.com/qlcchain/go-qlc/releases/download/v1.0.1/gqlc-linux-amd64-${version}
chmod +x extra/linux/x64/gqlc
echo 'download win32 i386 binary'
wget -O extra/win32/ia32/gqlc.exe https://github.com/qlcchain/go-qlc/releases/download/v1.0.1/gqlc-windows-386-${version}.exe
echo 'download win32 x64 binary'
wget -O extra/win32/x64/gqlc.exe https://github.com/qlcchain/go-qlc/releases/download/v1.0.1/gqlc-windows-amd64-${version}.exe