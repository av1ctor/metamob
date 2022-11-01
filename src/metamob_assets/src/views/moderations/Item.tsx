import React, { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { ModerationResponse } from "../../../../declarations/metamob/metamob.did";
import Button from "../../components/Button";
import TextAreaField from "../../components/TextAreaField";
import TextField from "../../components/TextField";
import { moderationActionToText, moderationReasonToTitle, ModerationState, moderationStateToText } from "../../libs/moderations";

interface Props {
    moderation: ModerationResponse;
    onChallenge?: (moderation: ModerationResponse) => void;
}

const Item = (props: Props) => {
    const mod = props.moderation;

    const handleChallenge = useCallback(() => {
        if(props.onChallenge) {
            props.onChallenge(props.moderation);
        }
    }, [props.moderation, props.onChallenge]);
    
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
                {props.onChallenge &&
                    <div className="control has-text-centered">
                        <Button
                            color="success"
                            disabled={mod.state !== ModerationState.Created}
                            onClick={handleChallenge}
                        >
                            <FormattedMessage id="Challenge" defaultMessage="Challenge"/>
                        </Button>
                    </div>
                }
            </div>
        </div>
    );
};

export default Item;