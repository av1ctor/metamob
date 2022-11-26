import React, {useCallback, useContext} from "react";
import {useDeleteVote} from "../../../hooks/votes";
import {VoteResponse} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import { useFindCampaignById } from "../../../hooks/campaigns";
import { FormattedMessage, useIntl } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
    vote: VoteResponse;
    onClose: () => void;
};


const DeleteForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const deleteMut = useDeleteVote();
    const campaign = useFindCampaignById(props.vote.campaignId);

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            if(!campaign.data) {
                throw new Error("Campaign not found");
            }

            await deleteMut.mutateAsync({
                main: actors.main,
                pubId: props.vote.pubId, 
                campaignPubId: campaign.data?.pubId
            });
            
            showSuccess(intl.formatMessage({defaultMessage: 'Vote deleted!'}));
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleDelete}>
            <Container>
                <div className="has-text-centered">
                    <p><FormattedMessage defaultMessage="Are you sure you want to delete this vote?"/></p>
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