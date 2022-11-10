import React from "react";
import { useFindPoapByPubId } from "../../../hooks/poap";
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
    
    const poap = useFindPoapByPubId(props.pubId);

    if(poap.status !== 'success' || !poap.data) {
        return null;
    }

    return (
        <EditForm
            campaignId={poap.data.campaignId}    
            poap={poap.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
