import React, {useState, ChangeEvent, useContext, useCallback, useEffect} from "react";
import {useCreateSignature} from "../../../hooks/signatures";
import {SignatureRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import Button from "../../../components/Button";
import TextAreaField from "../../../components/TextAreaField";

interface Props {
    petition: Petition;
    body?: string;
};

const SignForm = (props: Props) => {
    const [form, setForm] = useState<SignatureRequest>({
        petitionId: props.petition._id,
        body: props.body || '',
    });
    
    const createMut = useCreateSignature();

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
        }
        catch(e) {
            console.log(e);
        }
    }, [form]);

    return (
        <Grid container>
            <form>
                <TextAreaField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    disabled={!!props.body}
                    onChange={changeForm}
                />

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleSign}
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