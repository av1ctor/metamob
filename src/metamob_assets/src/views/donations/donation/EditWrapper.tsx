import React from "react";
import { useFindDonationByPubId } from "../../../hooks/donations";
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
    
    const donation = useFindDonationByPubId(props.pubId);

    if(donation.status !== 'success' || !donation.data) {
        return null;
    }

    return (
        <EditForm
            donation={donation.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
