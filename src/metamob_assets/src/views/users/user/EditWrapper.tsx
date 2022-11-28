import React from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindUserById } from "../../../hooks/users";
import EditForm from "./Edit";

interface Props {
    id: number;
    reportId: number;
    onClose: () => void;
};

const EditFormWrapper = (props: Props) => {
    const user = useFindUserById(props.id);

    if(user.status !== 'success' || !user.data) {
        return null;
    }

    return (
        <EditForm
            user={user.data as Profile}
            reportId={props.reportId}
            onClose={props.onClose}
        />
    );
};

export default EditFormWrapper;
