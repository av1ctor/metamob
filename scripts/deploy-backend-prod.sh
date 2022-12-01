#!/bin/bash
MMT_CANISTER_ID="$(dfx canister --network ic id mmt)"
LEDGER_CANISTER_ID="$(dfx canister --network ic id ledger)"
BTCWALLET_CANISTER_ID="$(dfx canister --network ic id btcwallet)"
FILESTORE_CANISTER_ID="$(dfx canister --network ic id filestore)"
LOGGER_CANISTER_ID="$(dfx canister --network ic id logger)"
eval dfx deploy metamob --network ic --with-cycles 1000000000000 --argument="'(\"$LEDGER_CANISTER_ID\", \"$BTCWALLET_CANISTER_ID\", \"$MMT_CANISTER_ID\", \"$FILESTORE_CANISTER_ID\", \"$LOGGER_CANISTER_ID\")'"
