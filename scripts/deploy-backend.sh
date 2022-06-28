#!/bin/bash
MMT_CANISTER_ID="$(dfx canister id mmt)"
LEDGER_CANISTER_ID="$(dfx canister id ledger)"
eval dfx deploy metamob --argument="'(\"$LEDGER_CANISTER_ID\", \"$MMT_CANISTER_ID\")'"