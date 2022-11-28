import React, {useCallback} from "react";
import {useDeleteDonation} from "../../../hooks/donations";
import {DonationResponse} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { useFindCampaignById } from "../../../hooks/campaigns";
import { FormattedMessage, useIntl } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
    donation: DonationResponse;
    onClose: () => void;
};

const DeleteForm = (props: Props) => {
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const deleteMut = useDeleteDonation();
    const campaign = useFindCampaignById(props.donation.campaignId);

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            if(!campaign.data) {
                throw new Error("Campaign not found");
            }

            await deleteMut.mutateAsync({
                pubId: props.donation.pubId, 
                campaignPubId: campaign.data.pubId,
            });
            
            showSuccess(intl.formatMessage({defaultMessage: 'Donation deleted!'}));
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onClose, campaign.data]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleDelete}>
            <Container>
                <div className="has-text-centered">
                    <p><FormattedMessage defaultMessage="Are you sure you want to delete this donation?"/></p>
                    <p className="has-text-danger"><FormattedMessage defaultMessage="This action can not be reverted!"/></p>
                </div>
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            disabled={deleteMut.isLoading}
                            onClick={handleDelete}
                        >
                            <FormattedMessage id="Delete" defaultMessage="Delete"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
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

export default DeleteForm;