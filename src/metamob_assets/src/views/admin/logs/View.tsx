import React, { useCallback } from "react";
import { Msg } from "../../../../../declarations/logger/logger.did";
import Button from "../../../components/Button";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { kindToText } from "../../../libs/logs";

interface Props {
    log: Msg;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const View = (props: Props) => {

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {log} = props;

    return (
        <>
            <div className="mb-2">
                <TextField
                    label="Kind"
                    value={kindToText(log.kind)}
                    disabled
                />
                <TextField
                    label="Actor"
                    value={log.act.toString()}
                    disabled
                />
                <TextAreaField
                    label="Message"
                    value={log.msg}
                    rows={10}
                    disabled
                />
                <TextField
                    label="Date"
                    value={new Date(Number(log.date / 1000000n)).toISOString()}
                    disabled
                />
            </div>
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

