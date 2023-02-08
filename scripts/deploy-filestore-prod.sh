#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob --network ic)"
eval dfx deploy filestore --network ic --with-cycles 1000000000000 --argument="'(vec {principal \"$METAMOB_CANISTER_ID\"}, vec {\"localhost:8080\"; \"127.0.0.1:8080\"})'"