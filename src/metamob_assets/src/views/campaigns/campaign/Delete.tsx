import React, {useCallback, useContext} from "react";
import {useDeleteCampaign} from "../../../hooks/campaigns";
import {Campaign} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import { FormattedMessage, useIntl } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
    campaign: Campaign;
    onClose: () => void;
};

const DeleteForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext)
    const intl = useIntl();
    
    const {showSuccess, showError, toggleLoading} = useUI();
    
    const deleteMut = useDeleteCampaign();

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            await deleteMut.mutateAsync({
                main: actors.main,
                pubId: props.campaign.pubId, 
            });

            showSuccess(intl.formatMessage({defaultMessage: 'Campaign deleted!'}));
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [actors.main, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    return (
        <>
            <form onSubmit={handleDelete}>
                <Container>
                    <div className="has-text-centered">
                        <p><FormattedMessage defaultMessage="Are you sure you want to delete this campaign?"/></p>
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
        </>
    );
};

export default DeleteForm;