#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob)"
dfx build btcwallet
eval dfx canister install btcwallet --mode auto --argument="'(variant { Regtest }, vec {principal \"$METAMOB_CANISTER_ID\"})'"