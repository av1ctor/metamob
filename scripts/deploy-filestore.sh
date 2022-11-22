#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob)"
dfx canister create filestore
dfx build filestore
eval dfx canister install filestore --mode auto --argument="'(vec {principal \"$METAMOB_CANISTER_ID\"}, vec {\"localhost:8080\"; \"127.0.0.1:8080\"})'"