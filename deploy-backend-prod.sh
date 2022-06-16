#!/bin/bash
MMT_CANISTER_ID=lyp45-xyaaa-aaaah-abldq-cai
LEDGER_CANISTER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai
eval dfx deploy metamob --network ic --with-cycles 100000000000 --argument="'(\"$LEDGER_CANISTER_ID\", \"$MMT_CANISTER_ID\")'"
