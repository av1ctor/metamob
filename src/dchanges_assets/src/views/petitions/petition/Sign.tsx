import React, {useState, ChangeEvent, useContext, useCallback} from "react";
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

    const handleSign = useCallback(async () => {
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
        <Grid container>
            <form>
                <TextAreaField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    required={true}
                    disabled={!!props.body}
                    onChange={changeForm}
                />

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
            </form>
        </Grid>
    );
};

export default SignForm;