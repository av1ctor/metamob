import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useCreatePoap, useMintPoap, useModeratePoap, useUpdatePoap} from "../../../hooks/poap";
import {Poap, PoapRequest} from "../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../declarations/ledger";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorActionType, ActorContext } from "../../../stores/actor";
import TextField from "../../../components/TextField";
import { depositIcp, getIcpBalance, isModerator } from "../../../libs/users";
import { AuthContext } from "../../../stores/auth";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { FormattedMessage, useIntl } from "react-intl";
import FileDropArea from "../../../components/FileDropArea";
import NumberField from "../../../components/NumberField";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { Identity } from "@dfinity/agent";
import { icpToDecimal } from "../../../libs/icp";
import { getConfigAsNat64 } from "../../../libs/dao";
import { formatPoapBody } from "../../../libs/poap";

interface Props {
    poap: Poap;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const MintForm = (props: Props) => {
    const [actors, actorsDispatch] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);
    const intl = useIntl();
    
    const [balance, setBalance] = useState(BigInt(0));

    const mintMut = useMintPoap();

    const fees = LEDGER_TRANSFER_FEE * BigInt(2);

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actors.ledger) {
            return actors.ledger;
        }
        
        if(!auth.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(auth.identity);
        actorsDispatch({
            type: ActorActionType.SET_LEDGER,
            payload: ledger
        });

        return ledger;
    };

    const checkUserBalance = async (
        identity: Identity, 
        ledger: Ledger
    ) => {
        const balance = await getIcpBalance(identity, ledger);
        setBalance(balance);
    };

    const updateState = useCallback(async(
    ) => {
        const ledger = await getLedgerCanister();
        if(!ledger) {
            return;
        }

        const identity = auth.identity;
        if(!identity) {
            return;
        }

        checkUserBalance(identity, ledger);
    }, [auth.identity]);

    const handleMint = useCallback(async (e: any) => {
        e.preventDefault();


        try {
            props.toggleLoading(true);

            if(!auth.user) {
                throw Error("Not logged in");
            }

            if(!actors.main) {
                throw Error("Main canister undefined");
            }
            
            if(props.poap.price + fees >= balance) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(props.poap.price + fees)} ICP.`)
            }

            await depositIcp(auth.user, props.poap.price + fees, actors.main, actors.ledger);
            
            try {
                await mintMut.mutateAsync({
                    main: actors.main,
                    pubId: props.poap.pubId
                });
                props.onSuccess(intl.formatMessage({defaultMessage: 'Poap minted!'}));
            }
            catch(e) {
                throw e;
            }
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [props.poap, balance, updateState, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    useEffect(() => {
        updateState();
    }, [updateState]);

    const {poap} = props;

    return (
        <form onSubmit={handleMint}>
            <Container>
                <TextField
                    label="Canister Id"
                    value={poap.canisterId}
                    disabled
                />
                <TextField
                    label="Name"
                    value={poap.name}
                    disabled
                />
                <TextField
                    label="Symbol"
                    value={poap.symbol}
                    disabled
                />
                <TextField
                    label="Price (ICP)"
                    value={icpToDecimal(poap.price)}
                    disabled
                />
                <TextField
                    label="Supply"
                    value={poap.totalSupply.toString() + (poap.maxSupply.length > 0? `/${poap.maxSupply[0]}`: '')}
                    disabled
                />
                <div>
                    <label className="label">
                        <FormattedMessage id="Example" defaultMessage="Example"/>
                    </label>
                    <div className="poap-body">
                        <img 
                            className="full"
                            src={"data:image/svg+xml;utf8," + encodeURIComponent(formatPoapBody(poap.body, poap.width, poap.height))}
                            width={poap.width}
                            height={poap.height}
                        />
                    </div>
                </div>
                <div className="warning-box">
                    <FormattedMessage defaultMessage="A total of {value} ICP will be billed from your wallet!" values={{value: icpToDecimal(poap.price + fees)}} />
                </div>
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleMint}
                            disabled={mintMut.isLoading}
                        >
                            <FormattedMessage id="Mint" defaultMessage="Mint"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default MintForm;
