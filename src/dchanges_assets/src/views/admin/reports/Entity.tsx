import React from "react";
import { Profile, Report } from "../../../../../declarations/dchanges/dchanges.did";
import { Preview } from "../../campaigns/campaign/Preview";
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
                <Preview 
                    id={report.entityId} 
                    onEditUser={props.onEditUser}
                />
            }
        </>
    );
};

export default Entity;