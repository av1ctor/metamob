import React from "react";
import { useFindSignatureByPubId } from "../../../hooks/signatures";
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
    
    const signature = useFindSignatureByPubId(props.pubId);

    if(signature.status !== 'success' || !signature.data) {
        return null;
    }

    return (
        <EditForm
            signature={signature.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
