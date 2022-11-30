import React, { useCallback } from "react";
import { ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import { PreviewWrapper as CampaignPreview } from "../../campaigns/campaign/PreviewWrapper";
import { PreviewWrapper as SignaturePreview } from "../../signatures/signature/PreviewWrapper";
import { PreviewWrapper as VotePreview } from "../../votes/vote/PreviewWrapper";
import { PreviewWrapper as DonationPreview } from "../../donations/donation/PreviewWrapper";
import { PreviewWrapper as FundingPreview } from "../../fundings/funding/PreviewWrapper";
import { PreviewWrapper as UpdatePreview } from "../../updates/update/PreviewWrapper";
import { PreviewWrapper as PlacePreview } from "../../places/place/PreviewWrapper";
import { PreviewWrapper as PoapPreview } from "../../poaps/poap/PreviewWrapper";
import { EntityType } from "../../../libs/common";
import Button from "../../../components/Button";
import Avatar from "../../users/Avatar";

interface Props {
    report: ReportResponse;
    partial?: boolean;
    onModerate?: (report: ReportResponse) => void;
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
            );

        case EntityType.POAPS:
            return (
                <PoapPreview 
                    id={report.entityId}
                    partial={props.partial}
                />
            );

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