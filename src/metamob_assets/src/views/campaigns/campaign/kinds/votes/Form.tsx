import React, {useState, useContext, useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCreateVote} from "../../../../../hooks/votes";
import {VoteRequest, Campaign, VoteResponse} from "../../../../../../../declarations/metamob/metamob.did";
import { AuthContext } from "../../../../../stores/auth";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import { ActorContext } from "../../../../../stores/actor";
import CheckboxField from "../../../../../components/CheckboxField";

interface Props {
    campaign: Campaign;
    vote?: VoteResponse;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    pro: yup.boolean().required(),
    anonymous: yup.bool().required(),
});

const VoteForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<VoteRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: props.vote?.body || '',
        pro: props.vote?.pro || true
    });
    
    const createMut = useCreateVote();

    const navigate = useNavigate();

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const validate = (form: VoteRequest): string[] => {
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

            await createMut.mutateAsync({
                main: actorState.main,
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    pro: Boolean(form.pro),
                    anonymous: form.anonymous,
                },
                campaignPubId: props.campaign.pubId
            });
            props.onSuccess('Your vote has been cast!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    useEffect(() => {
        setForm(form => ({
            ...form,
            pro: props.vote?.pro || true,
            body: props.vote?.body || ''
        }));
    }, [props.vote]);

    const isLoggedIn = !!authState.user;
    const hasVoted = !!props.vote?._id;

    return (
        <form onSubmit={handleVote}>
            <div>
                {isLoggedIn && 
                    <>
                        <CheckboxField
                            label="In favor"
                            id="pro"
                            value={!!form.pro}
                            disabled={hasVoted}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Against"
                            id="pro"
                            value={!form.pro}
                            disabled={hasVoted}
                            onChange={changeForm}
                        />
                        <TextAreaField
                            label="Message"
                            name="body"
                            value={form.body || ''}
                            rows={3}
                            disabled={hasVoted}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Vote as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            disabled={hasVoted}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleVote: redirectToLogon}
                            disabled={isLoggedIn? createMut.isLoading || hasVoted: false}
                        >
                            <i className="la la-vote-yea"/>&nbsp;VOTE
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default VoteForm;