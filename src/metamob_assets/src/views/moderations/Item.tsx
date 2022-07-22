import React from "react";
import { Moderation } from "../../../../declarations/metamob/metamob.did";
import Button from "../../components/Button";
import TextAreaField from "../../components/TextAreaField";
import TextField from "../../components/TextField";
import { moderationActionToText, moderationReasonToTitle, ModerationState, moderationStateToText } from "../../libs/moderations";

interface Props {
    moderation: Moderation;
}

const Item = (props: Props) => {
    const mod = props.moderation;
    
    return (
        <div className="moderation-item mb-4">
            <div className="label has-text-centered">
                Moderation <span className="is-size-7">{mod.pubId}</span>
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
                <div className="columns">
                    <div className="column is-6">
                        <TextField
                            label="Action"
                            value={moderationActionToText(mod.action)}
                            disabled
                        />
                    </div>
                    <div className="column is-6">
                        <TextField
                            label="State"
                            value={moderationStateToText(mod.state)}
                            disabled
                        />
                    </div>
                </div>
                <div className="control">
                    <Button
                        color="success"
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