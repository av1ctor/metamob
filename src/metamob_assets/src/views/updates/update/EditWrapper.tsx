import React from "react";
import { useFindUpdateByPubId } from "../../../hooks/updates";
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
    
    const update = useFindUpdateByPubId(props.pubId);

    if(update.status !== 'success' || !update.data) {
        return null;
    }

    return (
        <EditForm
            update={update.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
