import React from "react";
import { Profile, ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import { Preview as CampaignPreview } from "../../campaigns/campaign/Preview";
import { Preview as SignaturePreview } from "../../signatures/signature/Preview";
import { Preview as VotePreview } from "../../votes/vote/Preview";
import { Preview as DonationPreview } from "../../donations/donation/Preview";
import { Preview as FundingPreview } from "../../fundings/funding/Preview";
import { Preview as UpdatePreview } from "../../updates/update/Preview";
import { Preview as PlacePreview } from "../../places/place/Preview";
import { ReportType } from "../../../libs/reports";

interface Props {
    report: ReportResponse;
    partial?: boolean;
    onEditUser?: (user: Profile) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Entity = (props: Props) => {
    const {report} = props; 

    return (
        <>
            {report.entityType === ReportType.CAMPAIGNS &&
                <CampaignPreview 
                    id={report.entityId} 
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.SIGNATURES &&
                <SignaturePreview 
                    id={report.entityId} 
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.UPDATES &&
                <UpdatePreview 
                    id={report.entityId} 
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.VOTES &&
                <VotePreview 
                    id={report.entityId}
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.DONATIONS &&
                <DonationPreview 
                    id={report.entityId}
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.FUNDINGS &&
                <FundingPreview 
                    id={report.entityId}
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.PLACES &&
                <PlacePreview 
                    id={report.entityId}
                    partial={props.partial}
                    onEditUser={props.onEditUser}
                />
            }
        </>
    );
};

export default Entity;