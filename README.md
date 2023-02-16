# metamob

https://wbpm2-ciaaa-aaaan-qajta-cai.ic0.app/

## install a local Bitcoin network
- Follow: https://internetcomputer.org/docs/current/developer-docs/integrations/bitcoin/local-development

## start dfx
- Run: dfx start --enable-bitcoin

### deploy the local internet_identity canister:
- Add to dfx.json: "internet_identity": {"type": "custom", "wasm": "canisters-dev/internet_identity.wasm", "candid": "canisters-dev/internet_identity.did", "build": ""},
- Run: ./scripts/deploy-ii.sh
- Copy the local II address and replace the II_URL_LOCAL variable at .env with http://127.0.0.1:4943/?canisterId=**II_CANISTER_ID**
- Remove from dfx.json: "internet_identity": ...

### deploy the local ledger canister:
- Follow: https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/ledger-local-setup from step 5 to 6
- Run: ./scripts/deploy-ledger.sh
- Do steps 11 and above

### create the metamob canister
- Run: dfx canister create metamob

### create the btcwallet canister
- Run: dfx canister create btcwallet

### create the emailer canister
- Run: dfx canister create emailer

### deploy the metamob token:
- Run: ./scripts/deploy-mmt.sh

### deploy the logger:
- Run: ./scripts/deploy-logger.sh

### deploy the btcwallet:
- Run: ./scripts/deploy-btcwallet.sh

### deploy the emailer:
- Set your https://sendinblue.com/ API key executing "export SENDINBLUE_API_KEY=..."
- Run: ./scripts/deploy-emailer.sh

### deploy the file store:
- Run: ./scripts/deploy-filestore.sh
- Update the FILESTORE_URL_LOCAL variable at .env with http://127.0.0.1:4943/{id}?canisterId=**FILESTORE_CANISTER_ID**

### deploy metamob backend:
- Run: npm run dev:back

### configure the frontend
- Change the "const [form, setForm] = useState<ProfileRequest>({" at site/src/views/users/user/Create.tsx to include "roles: [[{admin: null}]], active: [true],"
- Run: npm run generate
- Run: npm run dev:front
- Go to the login page and create a new Internet Identity anchor: http://localhost:8080/
- Create a new account with the admin role
- Revert the changes done at the 1st step above
- Create new categories and places at the http://localhost:8080/#/admin page
- Find out the ADMIN_ACCOUNT_IDENTIFIER_32_BYTES_IN_HEX at your profile page (the "Ledger account id" field)

### tranfer ICP from the LEDGER_ACC to the admin account:
- Run: dfx ledger transfer --amount 10000.0 --ledger-canister-id **LEDGER_CANISTER_ID** --memo 1234 **ADMIN_ACCOUNT_IDENTIFIER_32_BYTES_IN_HEX**

### optional: deploy the mydaocoin for testing:
- Add to dfx.json: "mydaocoin": {"main": "src/mydaocoin/token.mo","type": "motoko"},
- Fill on ./scripts/deploy-mydaocoin.sh: **ADMIN_PRINCIPAL**
- Run: ./scripts/deploy-mydaocoin.sh
- Remove from dfx.json: "mydaocoin": ...
