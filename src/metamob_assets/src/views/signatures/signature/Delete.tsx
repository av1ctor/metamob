import React, {useCallback, useContext} from "react";
import {useDeleteSignature} from "../../../hooks/signatures";
import {SignatureResponse} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import { useFindCampaignById } from "../../../hooks/campaigns";

interface Props {
    signature: SignatureResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};


const DeleteForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    
    const deleteMut = useDeleteSignature();
    const campaign = useFindCampaignById(props.signature.campaignId);

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            props.toggleLoading(true);

            if(!campaign.data) {
                throw new Error("Campaign not found");
            }

            await deleteMut.mutateAsync({
                main: actors.main,
                pubId: props.signature.pubId, 
                campaignPubId: campaign.data.pubId,
            });
            
            props.onSuccess('Signature deleted!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
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
                    <p>Are you sure you want to delete this signature?</p>
                    <p className="has-text-danger">This action can not be reverted!</p>
                </div>
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            disabled={deleteMut.isLoading}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default DeleteForm;