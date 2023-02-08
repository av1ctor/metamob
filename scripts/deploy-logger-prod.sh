#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob --network ic)"
eval dfx deploy logger --network ic --with-cycles 1000000000000 --argument="'(vec {principal \"$METAMOB_CANISTER_ID\"})'"