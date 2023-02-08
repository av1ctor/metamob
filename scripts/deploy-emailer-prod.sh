#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob --network ic)"
API_KEY=$SENDINBLUE_API_KEY
eval dfx deploy emailer --network ic --with-cycles 1000000000000 --argument="'(\"api.sendinblue.com\", \"$API_KEY\", vec {principal \"$METAMOB_CANISTER_ID\"})'"