#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob --network ic)"
dfx build btcwallet
eval dfx deploy btcwallet --network ic --with-cycles 1000000000000 --argument="'(variant { Regtest }, 1, vec {principal \"$METAMOB_CANISTER_ID\"})'"