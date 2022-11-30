import React from "react";
import { useFindPoapByPubId } from "../../../hooks/poap";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
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
        />
    );
};

export default EditFormWrapper;
