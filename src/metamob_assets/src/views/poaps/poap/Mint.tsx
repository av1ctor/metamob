import React, {useState, useCallback, useContext, useEffect} from "react";
import {useMintPoap} from "../../../hooks/poap";
import {Campaign, Poap, ProfileResponse} from "../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../declarations/ledger";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorActionType, ActorContext } from "../../../stores/actor";
import TextField from "../../../components/TextField";
import { depositIcp, getIcpBalance } from "../../../libs/users";
import { AuthContext } from "../../../stores/auth";
import { FormattedMessage, useIntl } from "react-intl";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { Identity } from "@dfinity/agent";
import { icpToDecimal } from "../../../libs/icp";
import { formatPoapBody } from "../../../libs/poap";
import { CampaignKind, CampaignState } from "../../../libs/campaigns";
import { findByCampaignAndUser as findSignatureByCampaignAndUser } from "../../../libs/signatures";
import { findByCampaignAndUser as findDonationByCampaignAndUser } from "../../../libs/donations";
import { findByCampaignAndUser as findVoteByCampaignAndUser } from "../../../libs/votes";
import { findByCampaignAndUser as findFundingByCampaignAndUser } from "../../../libs/fundings";

interface Props {
    campaign: Campaign;
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

    const checkParticipation = async (
        campaign: Campaign,
        user: ProfileResponse
    ): Promise<boolean> => {
        if(campaign.kind == CampaignKind.SIGNATURES) { 
            const res = await findSignatureByCampaignAndUser(campaign._id, user._id);
            if(!res._id) {
                return false;
            }
        }
        else if(campaign.kind == CampaignKind.VOTES || campaign.kind == CampaignKind.WEIGHTED_VOTES) {
            const res = await findVoteByCampaignAndUser(campaign._id, user._id);
            if(!res._id) {
                return false;
            }
        }
        else if(campaign.kind == CampaignKind.FUNDINGS) {
            const res = await findFundingByCampaignAndUser(campaign._id, user._id);
            if(!res._id) {
                return false;
            }
        }
        else if(campaign.kind == CampaignKind.DONATIONS) {
            const res = await findDonationByCampaignAndUser(campaign._id, user._id);
            if(!res._id) {
                return false;
            }
        }
        else {
            return false;
        };

        return true;
    };    

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
            
            if(!checkParticipation(props.campaign, auth.user)) {
                throw Error("You didn't participate in the campaign");
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
    }, [props.poap, props.campaign, balance, updateState, props.onClose]);

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
                    value={poap.totalSupply.toString() + `/${poap.maxSupply.length > 0? poap.maxSupply[0]?.toString(): '∞'}`}
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
