import React, { useCallback, useState } from "react"
import * as yup from 'yup';
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextField from "../../../components/TextField";
import {Place, PlaceEmailRequest} from "../../../../../declarations/metamob/metamob.did";
import { useUI } from "../../../hooks/ui";
import { useActors } from "../../../hooks/actors";

interface Props {
    place: Place;
    onClose: () => void;
}

const formSchema = yup.object().shape({
    email: yup.string().min(3).max(128),
});

const Create = (props: Props) => {
    const {metamob} = useActors();

    const {showSuccess, showError, toggleLoading} = useUI();

    const [form, setForm] = useState<PlaceEmailRequest>({
        placeId: props.place._id,
        email: '',
    });
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = (form: PlaceEmailRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const req: PlaceEmailRequest = {
                placeId: form.placeId,
                email: form.email, 
            };
            
            const res = await metamob.placeEmailCreate(req);
            
            if('ok' in res) {
                showSuccess('E-mail created!');
            }
            else {
                showError(res.err);
            }
        }
        catch(e: any) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleCreate}>
            <Container>
                <TextField 
                    label="E-mail"
                    name="email"
                    value={form.email || ''}
                    required={true}
                    onChange={changeForm} 
                />
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleCreate}>
                            Create
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
            </Container>
        </form>
    );
};

export default Create;