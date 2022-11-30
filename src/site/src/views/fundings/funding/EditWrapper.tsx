import React from "react";
import { useFindFundingByPubId } from "../../../hooks/fundings";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
};

const EditFormWrapper = (props: Props) => {
    
    const funding = useFindFundingByPubId(props.pubId);

    if(funding.status !== 'success' || !funding.data) {
        return null;
    }

    return (
        <EditForm
            funding={funding.data}
            reportId={props.reportId}
            onClose={props.onClose}
        />
    );
};

export default EditFormWrapper;
