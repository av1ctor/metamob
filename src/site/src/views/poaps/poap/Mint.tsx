import React, {useCallback} from "react";
import {useMintPoap} from "../../../hooks/poap";
import {Campaign, Poap, ProfileResponse} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { FormattedMessage, useIntl } from "react-intl";
import { LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { icpToDecimal } from "../../../libs/icp";
import { formatPoapBody } from "../../../libs/poap";
import { CampaignKind } from "../../../libs/campaigns";
import { findByCampaignAndUser as findSignatureByCampaignAndUser } from "../../../libs/signatures";
import { findByCampaignAndUser as findDonationByCampaignAndUser } from "../../../libs/donations";
import { findByCampaignAndUser as findVoteByCampaignAndUser } from "../../../libs/votes";
import { findByCampaignAndUser as findFundingByCampaignAndUser } from "../../../libs/fundings";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";

interface Props {
    campaign: Campaign;
    poap: Poap;
    onClose: () => void;
};

const MintForm = (props: Props) => {
    const {user} = useAuth();
    const {balances, depositICP} = useWallet();
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();
    
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

    const handleMint = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            if(!user) {
                throw Error("Not logged in");
            }

            if(!await checkParticipation(props.campaign, user)) {
                throw Error("Only users that participated in the campaign can mint a POAP");
            }

            if(props.poap.price + fees >= balances.icp) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(props.poap.price + fees)} ICP.`)
            }

            await depositICP(props.poap.price + fees);
            
            try {
                await mintMut.mutateAsync({
                    pubId: props.poap.pubId
                });
                showSuccess(intl.formatMessage({defaultMessage: 'Poap minted!'}));
            }
            catch(e) {
                throw e;
            }
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.poap, props.campaign, balances, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

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
                            disabled={isLoading}
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
