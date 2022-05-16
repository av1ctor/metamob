import React, { useCallback, useState } from "react";
import CampaignReports from "./campaigns/Reports";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Reports = (props: Props) => {
    
    return (
        <>
            <div>
                <div className="is-size-3"><b>Campaign reports</b></div>
                <CampaignReports 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </div>
        </>
    );
};

export default Reports;