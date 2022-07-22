import React from "react";
import { useFindVoteByPubId } from "../../../hooks/votes";
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
    
    const vote = useFindVoteByPubId(props.pubId);

    if(vote.status !== 'success' || !vote.data) {
        return null;
    }

    return (
        <EditForm
            vote={vote.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
