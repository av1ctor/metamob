import React, {useState, ChangeEvent, useContext, useCallback} from "react";
import * as yup from 'yup';
import { useNavigate } from "react-router-dom";
import {useCreateSignature} from "../../../hooks/signatures";
import {SignatureRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../stores/auth";
import Grid from "../../../components/Grid";
import Button from "../../../components/Button";
import TextAreaField from "../../../components/TextAreaField";

interface Props {
    petition: Petition;
    body?: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const SignForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);

    const [form, setForm] = useState<SignatureRequest>({
        petitionId: props.petition._id,
        body: props.body || '',
    });
    
    const createMut = useCreateSignature();

    const navigate = useNavigate();

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };

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
            await createMut.mutateAsync({
                petitionId: props.petition._id,
                body: form.body,
            });
            props.onSuccess('Petition signed!');
        }
        catch(e) {
            props.onError(e);
        }
    }, [form]);

    const redirectToLogon = useCallback(() => {
        navigate(`/login?return=/p/${props.petition.pubId}`);
    }, [props.petition.pubId]);

    const isLoggedIn = !!authState.principal;

    return (
        <form onSubmit={handleSign}>
            <Grid container>
                {isLoggedIn && 
                    <TextAreaField
                        label="Message"
                        name="body"
                        value={form.body || ''}
                        rows={6}
                        required={true}
                        disabled={!!props.body}
                        onChange={changeForm}
                    />
                }

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleSign: redirectToLogon}
                            disabled={createMut.isLoading || !!props.body}
                        >
                            SIGN
                        </Button>
                    </div>
                </div>
            </Grid>
        </form>
    );
};

export default SignForm;