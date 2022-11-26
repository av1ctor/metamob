import React from "react";
import { useFindDonationByPubId } from "../../../hooks/donations";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
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
        />
    );
};

export default EditFormWrapper;
