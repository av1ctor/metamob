import React from "react";
import { Report } from "../../../../../declarations/dchanges/dchanges.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import { ReportType } from "../../../libs/reports";

interface Props {
    report: Report;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Entity = (props: Props) => {
    const {report} = props; 

    return (
        <>
            {report.entityType === ReportType.CAMPAIGNS &&
                <CampaignLink id={report.entityId} />
            }
        </>
    );
};

export default Entity;