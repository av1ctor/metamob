import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as yup from 'yup';
import { Challenge, ChallengeVoteRequest, ModerationResponse } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useGetChallengedModeration, useVoteChallenge } from "../../../hooks/challenges";
import { ActorContext } from "../../../stores/actor";
import Item from "../../moderations/Item";
import Avatar from "../../users/Avatar";
import EntityViewWrapper from "./EntityViewWrapper";
import EntityView from "./EntityView";
import { variantUnbox } from "../../../libs/utils";

interface Props {
    challenge: Challenge;
    onModerate: (challenge: Challenge) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    reason: yup.string().required().min(10).max(2048),
    pro: yup.boolean().required(),
});

const ModerateForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ChallengeVoteRequest>({
        reason: '',
        pro: false,
    });

    const closeMut = useVoteChallenge();
    const moderation = useGetChallengedModeration(props.challenge._id, actors.main);

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
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            await closeMut.mutateAsync({
                main: actors.main,
                pubId: props.challenge.pubId, 
                req: {
                    reason: form.reason,
                    pro: form.pro,
                }
            });
            props.onSuccess('Your vote was cast!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actors.main, props.onClose]);

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
                    Challenger
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
                    Original entity
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
                    Moderated entity
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
                    Decision
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
                        Vote
                    </Button>
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
        </form>
    );
};

export default ModerateForm;