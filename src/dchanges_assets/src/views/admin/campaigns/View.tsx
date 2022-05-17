import React, { useCallback } from "react";
import { Campaign, Profile } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import { Preview } from "../../campaigns/campaign/Preview";

interface Props {
    campaign: Campaign;
    onEditUser?: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const View = (props: Props) => {
    const {campaign} = props;

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <>
            <Preview
                id={campaign._id}
                onEditUser={props.onEditUser}
            />
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
};

export default View;

