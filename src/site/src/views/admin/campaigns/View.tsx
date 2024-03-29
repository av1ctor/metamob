import React, { useCallback } from "react";
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import { PreviewWrapper as Preview } from "../../campaigns/campaign/PreviewWrapper";

interface Props {
    campaign: Campaign;
    onClose: () => void;
}

const View = (props: Props) => {

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {campaign} = props;

    return (
        <>
            <Preview
                id={campaign._id}
            />
            <div className="field is-grouped mt-2">
                <div className="control">
                </div>
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

