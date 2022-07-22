import React, { useCallback } from "react";
import { Profile, ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import { Preview as CampaignPreview } from "../../campaigns/campaign/Preview";
import { Preview as SignaturePreview } from "../../signatures/signature/Preview";
import { Preview as VotePreview } from "../../votes/vote/Preview";
import { Preview as DonationPreview } from "../../donations/donation/Preview";
import { Preview as FundingPreview } from "../../fundings/funding/Preview";
import { Preview as UpdatePreview } from "../../updates/update/Preview";
import { Preview as PlacePreview } from "../../places/place/Preview";
import { EntityType } from "../../../libs/common";

interface Props {
    report: ReportResponse;
    partial?: boolean;
    onModerate?: (report: ReportResponse) => void;
    onEditUser?: (user: Profile) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const EntityPreview = (props: Props) => {
    const {report} = props; 

    const handleModerate = useCallback(() => {
        if(props.onModerate) {
            props.onModerate(props.report);
        }
    }, [props.report, props.onModerate]);

    switch(report.entityType) {
        case EntityType.CAMPAIGNS:
            return (
                <CampaignPreview 
                    id={report.entityId} 
                    partial={props.partial}
                    params={[{key: 'reportId', value: report._id}]}
                    onEditUser={props.onEditUser}
                />
            );

        case EntityType.SIGNATURES:
            return (
                <SignaturePreview 
                    id={report.entityId}   
                    reportId={report._id}
                    partial={props.partial}
                    onModerate={props.onModerate? handleModerate: undefined}
                    onEditUser={props.onEditUser}
                />
            );
        
        case EntityType.UPDATES:
            return (
                <UpdatePreview 
                    id={report.entityId} 
                    reportId={report._id}
                    partial={props.partial}
                    onModerate={props.onModerate? handleModerate: undefined}
                    onEditUser={props.onEditUser}
                />
            );

        case EntityType.VOTES:
            return (
                <VotePreview 
                    id={report.entityId}
                    reportId={report._id}
                    partial={props.partial}
                    onModerate={props.onModerate? handleModerate: undefined}
                    onEditUser={props.onEditUser}
                />
            );

        case EntityType.DONATIONS:
            return (
                <DonationPreview 
                    id={report.entityId}
                    reportId={report._id}
                    partial={props.partial}
                    onModerate={props.onModerate? handleModerate: undefined}
                    onEditUser={props.onEditUser}
                />
            );

        case EntityType.FUNDINGS:
            return (
                <FundingPreview 
                    id={report.entityId}
                    reportId={report._id}
                    partial={props.partial}
                    onModerate={props.onModerate? handleModerate: undefined}
                    onEditUser={props.onEditUser}
                />
            );

        case EntityType.PLACES:
            return (
                <PlacePreview 
                    id={report.entityId}
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            );

        default:
            return (
                <div></div>
            );
    }
};

export default EntityPreview;