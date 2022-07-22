import React from "react";
import { useFindFundingByPubId } from "../../../hooks/fundings";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
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
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
