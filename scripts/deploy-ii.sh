#!/bin/bash
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm -o ../internet_identity.wasm
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did -o ../internet_identity.did
dfx deploy --no-wallet --argument '(null)' internet_identity