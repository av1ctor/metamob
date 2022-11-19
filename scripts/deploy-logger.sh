#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob)"
dfx canister create logger
dfx build logger
eval dfx canister install logger --mode auto --argument="'(vec {principal \"$METAMOB_CANISTER_ID\"})'"