import React from "react";
import { useFindPlaceByPubId } from "../../../hooks/places";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
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
        />
    );
};

export default EditFormWrapper;
