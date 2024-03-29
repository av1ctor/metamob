#!/bin/bash
MMT_CANISTER_ID="$(dfx canister id mmt)"
LEDGER_CANISTER_ID="$(dfx canister id ledger)"
BTCWALLET_CANISTER_ID="$(dfx canister id btcwallet)"
EMAILER_CANISTER_ID="$(dfx canister id emailer)"
FILESTORE_CANISTER_ID="$(dfx canister id filestore)"
LOGGER_CANISTER_ID="$(dfx canister id logger)"
eval dfx deploy metamob --argument="'(\"$LEDGER_CANISTER_ID\", \"$BTCWALLET_CANISTER_ID\", \"$EMAILER_CANISTER_ID\", \"$MMT_CANISTER_ID\", \"$FILESTORE_CANISTER_ID\", \"$LOGGER_CANISTER_ID\")'"