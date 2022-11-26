import React from "react";
import { useFindUpdateByPubId } from "../../../hooks/updates";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
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
        />
    );
};

export default EditFormWrapper;
