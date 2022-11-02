# metamob

https://wbpm2-ciaaa-aaaan-qajta-cai.ic0.app/

Welcome to your new metamob project and to the internet computer development community. By default, creating a new project adds this README and some template files to your project directory. You can edit these template files to customize your project and to include your own code to speed up the development cycle.

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with metamob, see the following documentation available online:

- [Quick Start](https://sdk.dfinity.org/docs/quickstart/quickstart-intro.html)
- [SDK Developer Tools](https://sdk.dfinity.org/docs/developers-guide/sdk-guide.html)
- [Motoko Programming Language Guide](https://sdk.dfinity.org/docs/language-guide/motoko.html)
- [Motoko Language Quick Reference](https://sdk.dfinity.org/docs/language-guide/language-manual.html)
- [JavaScript API Reference](https://erxue-5aaaa-aaaab-qaagq-cai.raw.ic0.app)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd metamob/
dfx help
dfx config --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start

# Deploys your canisters to the replica and generates your candid interface
npm run dev:back
```

Once the job completes, your application will be available at `http://localhost:8000?canisterId={asset_canister_id}`.

Additionally, if you are making frontend changes, you can start a development server with

```bash
npm run dev:front
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 8000.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`NODE_ENV` to `production` if you are using Webpack
- use your own preferred method to replace `process.env.NODE_ENV` in the autogenerated declarations
- Write your own `createActor` constructor

### deploying the local internet_identity canister:
- Run: ./deploy-ii.sh
- Copy the local II address and replace the II_URL_LOCAL variable at .env with http://localhost:8000/?canisterId=**{II_CANISTER_ID}**&id=**{II_CANISTER_ID}**

### deploying the local ledger canister:
- Follow: https://github.com/dfinity/ic/tree/master/rs/rosetta-api/ledger_canister#deploying-locally
- Run: ./deploy-ledger.sh

### tranfering ICP from the LEDGER_ACC to the admin account:
- Run: dfx ledger transfer --amount 1000.0 --ledger-canister-id ${dfx canister id ledger} --memo 1234 **{ADMIN_ACCOUNT_IDENTIFIER_32_BYTES_IN_HEX}**

### deploying the metamob token:
- Run: ./deploy-mmt.sh

### deploying the mydaocoin for testing:
- Add to dfx.json: "mydaocoin": {"main": "src/mydaocoin/token.mo","type": "motoko"},
- Fill on ./deploy-mydaocoin.sh: **ADMIN_PRINCIPAL**
- Run: ./deploy-mydaocoin.sh
- Remove from dfx.json: "mydaocoin": ...
