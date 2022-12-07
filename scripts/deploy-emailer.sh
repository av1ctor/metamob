#!/bin/bash
METAMOB_CANISTER_ID="$(dfx canister id metamob)"
API_KEY=$SENDINBLUE_API_KEY
dfx build emailer
eval dfx canister install emailer --mode auto --argument="'(\"api.sendinblue.com\", \"$API_KEY\", vec {principal \"$METAMOB_CANISTER_ID\"})'"