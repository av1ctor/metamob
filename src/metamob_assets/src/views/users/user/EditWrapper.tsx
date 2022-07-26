import React, { useContext } from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindUserById } from "../../../hooks/users";
import { ActorContext } from "../../../stores/actor";
import EditForm from "./Edit";

interface Props {
    id: number;
    reportId: number;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const EditFormWrapper = (props: Props) => {
    const [actors] = useContext(ActorContext);
    
    const user = useFindUserById(props.id, actors.main);

    if(user.status !== 'success' || !user.data) {
        return null;
    }

    return (
        <EditForm
            user={user.data as Profile}
            reportId={props.reportId}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
