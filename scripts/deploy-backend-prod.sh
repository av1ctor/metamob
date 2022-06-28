#!/bin/bash
MMT_CANISTER_ID="$(dfx canister --network ic id mmt)"
LEDGER_CANISTER_ID="$(dfx canister --network ic id ledger)"
eval dfx deploy metamob --network ic --with-cycles 1000000000000 --argument="'(\"$LEDGER_CANISTER_ID\", \"$MMT_CANISTER_ID\")'"
