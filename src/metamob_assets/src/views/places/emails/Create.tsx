import React, { useCallback, useContext, useState } from "react"
import * as yup from 'yup';
import {metamob} from "../../../../../declarations/metamob";
import { AuthActionType, AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextField from "../../../components/TextField";
import {Place, PlaceEmailRequest, ProfileRequest } from "../../../../../declarations/metamob/metamob.did";
import { ActorContext } from "../../../stores/actor";

interface Props {
    place: Place;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    onClose: () => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    email: yup.string().min(3).max(128),
});

const Create = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);

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
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            if(!actorState.main) {
                throw Error('Main actor undefined');
            }

            const req: PlaceEmailRequest = {
                placeId: form.placeId,
                email: form.email, 
            };
            
            const res = await actorState.main.placeEmailCreate(req);
            
            if('ok' in res) {
                props.onSuccess('E-mail created!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
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