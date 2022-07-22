import React, { useCallback, useContext } from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import { useFindFundingById } from "../../../hooks/fundings";
import { ActorContext } from "../../../stores/actor";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    id: number;
    partial?: boolean;
    reportId?: number | null;
    onModerate?: () => void;
    onEditUser?: (user: Profile) => void;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const funding = useFindFundingById(props.id, actorState.main);

    const handleModerate = useCallback((e: any) => {
        e.preventDefault();
        if(props.onModerate) {
            props.onModerate();
        }
    }, [props.onModerate]);
    
    return (
        <div className="mb-2">
            {funding.data?
                props.partial?
                    <div>
                        <b>Fundraising at campaign</b>:&nbsp;
                        <CampaignLink id={funding.data.campaignId} />
                    </div>
                :
                    <div className="field">
                        <label className="label">
                            Funding
                        </label>
                        <div className="control preview-box">
                            <div>
                                <label className="label">
                                    Id
                                </label>
                                {funding.data.pubId}
                            </div>
                            <div>
                                <label className="label">
                                    Value
                                </label>
                                {funding.data.value.toString()}
                            </div>
                            <div>
                                <label className="label">
                                    Message
                                </label>
                                {limitText(funding.data.body, 60)}
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Author
                                </label>
                                <Avatar 
                                    id={funding.data.createdBy} 
                                    size='lg'
                                    onClick={props.onEditUser}
                                />
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Campaign
                                </label>
                                <CampaignLink id={funding.data.campaignId} />
                            </div>
                            {props.onModerate &&
                                <div className="mt-2 has-text-centered">
                                    <Button
                                        color="danger"
                                        onClick={handleModerate}
                                    >
                                        Moderate
                                    </Button>
                                </div>
                            }
                        </div>
                    </div>
                :
                    null
            }
        </div>
    );
};