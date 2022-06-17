#!/bin/bash
MMT_CANISTER_ID=tbqmo-6aaaa-aaaan-qajoq-cai
LEDGER_CANISTER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai
eval dfx deploy metamob --network ic --with-cycles 1000000000000 --argument="'(\"$LEDGER_CANISTER_ID\", \"$MMT_CANISTER_ID\")'"
