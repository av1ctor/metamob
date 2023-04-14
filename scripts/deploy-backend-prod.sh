#!/bin/bash
MMT_CANISTER_ID="$(dfx canister --network ic id mmt)"
LEDGER_CANISTER_ID="$(dfx canister --network ic id ledger)"
BTCWALLET_CANISTER_ID="$(dfx canister --network ic id btcwallet)"
EMAILER_CANISTER_ID="$(dfx canister --network ic id emailer)"
FILESTORE_CANISTER_ID="$(dfx canister --network ic id filestore)"
LOGGER_CANISTER_ID="$(dfx canister --network ic id logger)"
eval dfx deploy metamob --network ic --identity deployer --with-cycles 1000000000000 --argument="'(\"$LEDGER_CANISTER_ID\", \"$BTCWALLET_CANISTER_ID\", \"$EMAILER_CANISTER_ID\", \"$MMT_CANISTER_ID\", \"$FILESTORE_CANISTER_ID\", \"$LOGGER_CANISTER_ID\")'"
