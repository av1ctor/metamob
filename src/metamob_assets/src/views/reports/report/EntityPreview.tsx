import React, { useCallback } from "react";
import { ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import { Preview as CampaignPreview } from "../../campaigns/campaign/Preview";
import { Preview as SignaturePreview } from "../../signatures/signature/Preview";
import { Preview as VotePreview } from "../../votes/vote/Preview";
import { Preview as DonationPreview } from "../../donations/donation/Preview";
import { Preview as FundingPreview } from "../../fundings/funding/Preview";
import { Preview as UpdatePreview } from "../../updates/update/Preview";
import { Preview as PlacePreview } from "../../places/place/Preview";
import { EntityType } from "../../../libs/common";
import Button from "../../../components/Button";
import Avatar from "../../users/Avatar";

interface Props {
    report: ReportResponse;
    partial?: boolean;
    onModerate?: (report: ReportResponse) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const EntityPreview = (props: Props) => {
    const {report} = props; 

    switch(report.entityType) {
        case EntityType.CAMPAIGNS:
            return (
                <CampaignPreview 
                    id={report.entityId} 
                    partial={props.partial}
                />
            );

        case EntityType.SIGNATURES:
            return (
                <SignaturePreview 
                    id={report.entityId}   
                    partial={props.partial}
                />
            );
        
        case EntityType.UPDATES:
            return (
                <UpdatePreview 
                    id={report.entityId} 
                    partial={props.partial}
                />
            );

        case EntityType.VOTES:
            return (
                <VotePreview 
                    id={report.entityId}
                    partial={props.partial}
                />
            );

        case EntityType.DONATIONS:
            return (
                <DonationPreview 
                    id={report.entityId}
                    partial={props.partial}
                />
            );

        case EntityType.FUNDINGS:
            return (
                <FundingPreview 
                    id={report.entityId}
                    partial={props.partial}
                />
            );

        case EntityType.PLACES:
            return (
                <PlacePreview 
                    id={report.entityId}
                    partial={props.partial}
                />
            );

        case EntityType.USERS:
            return (
                <div>
                    <label className="label">
                        User:
                    </label>
                    <Avatar
                        id={report.entityId}
                        size="xl"
                    />
                </div>
            )

        default:
            return (
                <div></div>
            );
    }
};

const EntityPreviewContainer = (props: Props) => {

    const handleModerate = useCallback((e: any) => {
        e.preventDefault();

        if(props.onModerate) {
            props.onModerate(props.report);
        }
    }, [props.report, props.onModerate]);

    return (
        <>
            <EntityPreview
                {...props}
            />
            {!props.partial && props.onModerate &&
                <div className="mt-2 has-text-centered">
                    <Button
                        color="danger"
                        onClick={handleModerate}
                    >
                        Moderate
                    </Button>
                </div>
            }
        </>
    );   
};

export default EntityPreviewContainer;