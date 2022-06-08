import React from "react";
import { Profile, Report } from "../../../../../declarations/metamob/metamob.did";
import { Preview as CampaignPreview } from "../../campaigns/campaign/Preview";
import { Preview as SignaturePreview } from "../../signatures/signature/Preview";
import { Preview as VotePreview } from "../../votes/vote/Preview";
import { Preview as DonationPreview } from "../../donations/donation/Preview";
import { Preview as FundingPreview } from "../../fundings/funding/Preview";
import { Preview as UpdatePreview } from "../../updates/update/Preview";
import { ReportType } from "../../../libs/reports";

interface Props {
    report: Report;
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
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.SIGNATURES &&
                <SignaturePreview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.UPDATES &&
                <UpdatePreview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.VOTES &&
                <VotePreview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.DONATIONS &&
                <DonationPreview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
            {report.entityType === ReportType.FUNDINGS &&
                <FundingPreview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
        </>
    );
};

export default Entity;