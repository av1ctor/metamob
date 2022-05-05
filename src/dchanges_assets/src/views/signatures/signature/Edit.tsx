import React, {useState, ChangeEvent, useCallback} from "react";
import {useUpdateSignature} from "../../../hooks/signatures";
import {Signature, SignatureRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";

interface Props {
    signature: Signature;
    onCancel: () => void;
};

const EditForm = (props: Props) => {
    const [form, setForm] = useState<SignatureRequest>({
        petitionId: 0,
        body: props.signature.body,
    });
    
    const updateMut = useUpdateSignature();

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };

    const handleUpdate = useCallback(async () => {
        try {
            await updateMut.mutateAsync({pubId: props.signature.pubId, req: {
                petitionId: Number(props.signature.petitionId),
                body: form.body,
            }});
            props.onCancel();
        }
        catch(e) {
            alert(e);
        }
    }, [form]);

    return (
        <Grid container>
            <TextAreaField
                label="Body"
                name="body"
                value={form.body || ''}
                rows={6}
                onChange={changeForm}
            />
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        color="danger"
                        onClick={props.onCancel}
                    >
                        Cancel
                    </Button>
                </div>
                <div className="control">
                    <Button
                        onClick={handleUpdate}
                        disabled={updateMut.isLoading}
                    >
                        Update
                    </Button>
                </div>
            </div>
        </Grid>
    );
};

export default EditForm;