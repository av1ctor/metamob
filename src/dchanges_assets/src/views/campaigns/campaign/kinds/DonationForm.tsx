import React, {useState, useContext, useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCreateDonation} from "../../../../hooks/donations";
import {DonationRequest, Campaign, DonationResponse} from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import Button from "../../../../components/Button";
import TextAreaField from "../../../../components/TextAreaField";
import { ActorContext } from "../../../../stores/actor";
import CheckboxField from "../../../../components/CheckboxField";
import TextField from "../../../../components/TextField";

interface Props {
    campaign: Campaign;
    donation?: DonationResponse;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0).notOneOf([0]),
    anonymous: yup.bool().required(),
});

const DonationForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: props.donation?.body || '',
        value: props.donation?.value || BigInt(0)
    });
    
    const createMut = useCreateDonation();

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

    const validate = async (form: DonationRequest): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleDonation = useCallback(async (e: any) => {
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
                    value: BigInt(form.value),
                    anonymous: form.anonymous,
                }
            });
            props.onSuccess('Your donation has been cast!');
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
            value: props.donation?.value || BigInt(0),
            body: props.donation?.body || ''
        }));
    }, [props.donation]);

    const isLoggedIn = !!authState.user;
    const hasDonated = !!props.donation?._id;

    return (
        <form onSubmit={handleDonation}>
            <div>
                {isLoggedIn && 
                    <>
                        <TextField
                            label="Value (ICP)"
                            id="value"
                            value={form.value.toString()}
                            disabled={hasDonated}
                            onChange={changeForm}
                        />
                        <TextAreaField
                            label="Message"
                            name="body"
                            value={form.body || ''}
                            rows={4}
                            disabled={hasDonated}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Donate as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            disabled={hasDonated}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleDonation: redirectToLogon}
                            disabled={isLoggedIn? createMut.isLoading || hasDonated: false}
                        >
                            <i className="la la-money-bill"/>&nbsp;DONATE
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default DonationForm;