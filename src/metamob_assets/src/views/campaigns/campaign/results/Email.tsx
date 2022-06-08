import React, { useCallback, useRef } from "react";
import ContentEditable from "react-contenteditable";
import { Campaign } from "../../../../../../declarations/metamob/metamob.did";
import Box from "../../../../components/Box";
import Button from "../../../../components/Button";
import { config } from "../../../../config";
import { CampaignKind } from "../../../../libs/campaigns";
import { icpToDecimal } from "../../../../libs/icp";
import { copyToClipboard } from "../../../../libs/utils";

interface Props {
    campaign: Campaign;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Email = (props: Props): React.ReactElement => {

    const reasons = useRef('Click here to edit reasons...');
    const details = useRef('Click here to add more details...');
    const bodyRef = useRef(null);
    
    const {campaign} = props;

    const handleChangeReasons = useCallback((e: any) => {
        reasons.current = e.target.value;
    }, []);

    const handleChangeDetails = useCallback((e: any) => {
        details.current = e.target.value;
    }, []);

    const handleCopy = useCallback(() => {
        if(bodyRef.current) {
            copyToClipboard(bodyRef.current)
        }
    }, [bodyRef.current]);

    const kind = (campaign: Campaign) => {
        switch(campaign.kind) {
            case CampaignKind.DONATIONS:
                if(!('donations' in campaign.info)) {
                    return null;
                }
                return `${icpToDecimal(campaign.total)} ICP donations`;

            case CampaignKind.SIGNATURES:
                if(!('signatures' in campaign.info)) {
                    return null;
                }
                return `${campaign.total} signatures`;

            case CampaignKind.VOTES:
                if(!('votes' in campaign.info)) {
                    return null;
                }
                return `${campaign.info.votes.pro.toString()} in favor votes`;

            default:
                return null;
            }
    };
    
    return (
        <>
            <Box 
                className="email-body"
            >
                <div
                    ref={bodyRef}
                >
                    <p>
                        Dear <b>{campaign.target}</b>,
                    </p>
                    <br/>
                    <p>
                        Our campaign, <b>{campaign.title}</b>, created to <ContentEditable tagName="span" html={reasons.current} onChange={handleChangeReasons}/> ended with a total of <b>{kind(campaign)}</b>.
                    </p>
                    <br/>
                    <p>
                        <ContentEditable tagName="span" html={details.current} onChange={handleChangeDetails}/>
                    </p>
                    <br/>
                    <p>
                        More info can be found at the campaign's page: <a href={`${config.APP_URL}/#/c/${campaign.pubId}`} target="_blank">{config.APP_URL}/#/c/{campaign.pubId}</a>
                    </p>
                </div>
            </Box>
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button 
                        onClick={handleCopy}
                    >
                        Copy
                    </Button>
                </div>
                <div className="control">
                    <Button 
                        color="danger"
                        onClick={props.onClose} 
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    )
};

export default Email;