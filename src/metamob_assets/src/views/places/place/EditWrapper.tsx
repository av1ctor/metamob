import React from "react";
import { useFindPlaceByPubId } from "../../../hooks/places";
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
    
    const place = useFindPlaceByPubId(props.pubId);

    if(place.status !== 'success' || !place.data) {
        return null;
    }

    return (
        <EditForm
            place={place.data}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
