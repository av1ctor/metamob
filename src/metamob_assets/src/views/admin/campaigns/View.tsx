import React, { useCallback, useContext } from "react";
import { Campaign, Profile } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import { usePublishCampaign } from "../../../hooks/campaigns";
import { CampaignState } from "../../../libs/campaigns";
import { ActorContext } from "../../../stores/actor";
import { Preview } from "../../campaigns/campaign/Preview";

interface Props {
    campaign: Campaign;
    onEditUser?: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const View = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const mutation = usePublishCampaign();
    
    const handlePublish = useCallback(async (e: any) => {
        e.preventDefault();
        
        try {
            props.toggleLoading(true);

            await mutation.mutateAsync({
                main: actorState.main,
                pubId: props.campaign.pubId
            });
            props.onSuccess('Campaign published!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [props.campaign.pubId]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {campaign} = props;

    return (
        <>
            <Preview
                id={campaign._id}
                onEditUser={props.onEditUser}
            />
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        color="success"
                        disabled={campaign.state !== CampaignState.CREATED}
                        onClick={handlePublish}
                    >
                        Publish
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
};

export default View;

