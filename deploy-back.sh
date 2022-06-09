#!/bin/bash
MMT_CANISTER_ID="$(dfx canister id mmt)"
eval dfx deploy metamob --argument="'(\"$MMT_CANISTER_ID\")'"