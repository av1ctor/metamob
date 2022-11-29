#!/bin/bash
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm -o ./canisters-dev/internet_identity.wasm
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did -o ./canisters-dev/internet_identity.did
dfx deploy --no-wallet --argument '(null)' internet_identity