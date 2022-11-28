import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as yup from 'yup';
import { Challenge, ChallengeVoteRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useGetChallengedModeration, useVoteChallenge } from "../../../hooks/challenges";
import Item from "../../moderations/Item";
import Avatar from "../../users/Avatar";
import EntityViewWrapper from "./EntityViewWrapper";
import EntityView from "./EntityView";
import { variantUnbox } from "../../../libs/utils";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
    challenge: Challenge;
    onModerate: (challenge: Challenge) => void;
    onClose: () => void;
}

const formSchema = yup.object().shape({
    reason: yup.string().required().min(10).max(2048),
    pro: yup.boolean().required(),
});

const ModerateForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<ChallengeVoteRequest>({
        reason: '',
        pro: false,
    });

    const closeMut = useVoteChallenge();
    const moderation = useGetChallengedModeration(props.challenge._id);

    const entity = useMemo(() => {
        if(!moderation.data) {
            return undefined;
        }
        
        return moderation.data.entityOrg.reduce((obj, entry) => {
            obj[entry.key] = variantUnbox(entry.value);
            return obj;
        }, {} as any);

    }, [moderation.data]);

    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({...form, [field]: value}));
    }, []);

    const validate = (form: ChallengeVoteRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleVote = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            await closeMut.mutateAsync({
                pubId: props.challenge.pubId, 
                req: {
                    reason: form.reason,
                    pro: form.pro,
                }
            });
            showSuccess('Your vote was cast!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    useEffect(() => {
        setForm({
            reason: '',
            pro: false
        });
    }, [props.challenge]);

    const {challenge} = props;

    return (
        <form onSubmit={handleVote}>
            <TextField
                label="Id"
                name="id"
                value={challenge.pubId}
                disabled
            />
            <TextAreaField
                label="Description"
                name="description"
                rows={5}
                value={challenge.description}
                disabled
            />
            <div className="field">
                <label className="label">
                    <FormattedMessage id="Challenger" defaultMessage="Challenger" />
                </label>
                <div className="control">
                    <Avatar 
                        id={challenge.createdBy} 
                        size='lg'
                    />
                </div>
            </div>

            {moderation.data && 
                <Item
                    moderation={moderation.data as any}
                />
            }

            <div className="field">
                <label className="label">
                    <FormattedMessage id="Original entity" defaultMessage="Original entity"/>
                </label>
                <div className="control preview-box">
                    <EntityView
                        entity={entity}
                        type={moderation.data?.entityType}
                    />
                </div>
            </div>

            <div className="field">
                <label className="label">
                    <FormattedMessage id="Moderated entity" defaultMessage="Moderated entity"/>
                </label>
                <div className="control preview-box">
                    <EntityViewWrapper
                        pubId={moderation.data?.entityPubId}
                        type={moderation.data?.entityType}
                    />
                </div>
            </div>
            
            <div className="field">
                <label className="label">
                    <FormattedMessage id="Decision" defaultMessage="Decision"/>
                </label>
                <div className="control preview-box">
                    <CheckboxField
                        label="Revert/redo moderation"
                        id="pro"
                        value={form.pro}
                        onChange={changeForm}
                    />

                    <TextAreaField
                        label="Reason"
                        name="reason"
                        rows={5}
                        value={form.reason}
                        onChange={changeForm}
                    />
                </div>
            </div>
            
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        onClick={handleVote}
                        disabled={closeMut.isLoading}
                    >
                        <FormattedMessage id="Vote" defaultMessage="Vote"/>
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default ModerateForm;