import React from "react";
import { Moderation } from "../../../../declarations/metamob/metamob.did";
import Button from "../../components/Button";
import TextAreaField from "../../components/TextAreaField";
import TextField from "../../components/TextField";
import { moderationActionToText, moderationReasonToTitle, ModerationState } from "../../libs/moderations";

interface Props {
    moderation: Moderation;
}

const Item = (props: Props) => {
    const mod = props.moderation;
    
    return (
        <div className="moderation-item mb-4">
            <div className="label has-text-centered">
                Moderation <small>{mod.pubId}</small>
            </div>
            <div>
                <TextField
                    label="Reason"
                    value={moderationReasonToTitle(mod.reason)}
                    disabled
                />
                <TextAreaField
                    label="Description"
                    value={mod.body}
                    rows={5}
                    disabled
                />
                <TextField
                    label="Action"
                    value={moderationActionToText(mod.action)}
                    disabled
                />
                <div className="control">
                    <Button
                        color="danger"
                        disabled={mod.state !== ModerationState.Created}
                    >
                        Challenge
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Item;