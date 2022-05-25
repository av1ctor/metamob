import React, {useState, ChangeEvent, useContext, useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCreateSignature} from "../../../../hooks/signatures";
import {SignatureRequest, Campaign, SignatureResponse} from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import Button from "../../../../components/Button";
import TextAreaField from "../../../../components/TextAreaField";
import { ActorContext } from "../../../../stores/actor";
import CheckboxField from "../../../../components/CheckboxField";

interface Props {
    campaign: Campaign;
    signature?: SignatureResponse;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
    anonymous: yup.bool().required(),
});

const SignForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<SignatureRequest>({
        campaignId: props.campaign._id,
        body: props.signature?.body || '',
        anonymous: false,
    });
    
    const createMut = useCreateSignature();

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

    const validate = async (form: SignatureRequest): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleSign = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
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
                    anonymous: form.anonymous,
                }
            });
            props.onSuccess('Campaign signed!');
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
            body: props.signature?.body || ''
        }));
    }, [props.signature]);

    const isLoggedIn = !!authState.user;
    const hasSigned = !!props.signature?._id;

    return (
        <form onSubmit={handleSign}>
            <div>
                {isLoggedIn && 
                    <>
                        <TextAreaField
                            label="Message"
                            name="body"
                            value={form.body || ''}
                            rows={6}
                            required={true}
                            disabled={hasSigned}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Sign as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            disabled={hasSigned}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleSign: redirectToLogon}
                            disabled={isLoggedIn? createMut.isLoading || hasSigned: false}
                        >
                            <i className="la la-pen-fancy"/>&nbsp;SIGN
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SignForm;