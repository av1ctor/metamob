import React from "react";
import { useFindVoteByPubId } from "../../../hooks/votes";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
};

const EditFormWrapper = (props: Props) => {
    
    const vote = useFindVoteByPubId(props.pubId);

    if(vote.status !== 'success' || !vote.data) {
        return null;
    }

    return (
        <EditForm
            vote={vote.data}
            reportId={props.reportId}
            onClose={props.onClose}
        />
    );
};

export default EditFormWrapper;
