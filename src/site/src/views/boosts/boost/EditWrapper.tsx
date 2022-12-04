import React from "react";
import { useFindBoostByPubId } from "../../../hooks/boosts";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    onClose: () => void;
};

const EditFormWrapper = (props: Props) => {
    
    const boost = useFindBoostByPubId(props.pubId);

    if(boost.status !== 'success' || !boost.data) {
        return null;
    }

    return (
        <EditForm
            boost={boost.data}
            onClose={props.onClose}
        />
    );
};

export default EditFormWrapper;
