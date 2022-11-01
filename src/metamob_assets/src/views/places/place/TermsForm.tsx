import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as yup from 'yup';
import { Place, PlaceUser, PlaceUserRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import { Markdown } from "../../../components/Markdown";
import { useCreatePlaceUser } from "../../../hooks/places-users";
import { ActorContext } from "../../../stores/actor";

interface Props {
    place: Place;
    placeUser?: PlaceUser;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    placeId: yup.number().required(),
    termsAccepted: yup.bool(),
});

const TermsForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const intl = useIntl();

    const [form, setForm] = useState<PlaceUserRequest>({
        placeId: props.place._id,
        termsAccepted: props.placeUser?.termsAccepted || false,
    });

    const createMut = useCreatePlaceUser();

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

    const validate = (form: PlaceUserRequest): string[] => {
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

            await createMut.mutateAsync({
                main: actors.main,
                req: {
                    placeId: form.placeId,
                    termsAccepted: form.termsAccepted
                }
            });
            props.onSuccess(`Place terms ${form.termsAccepted? 'accepted': 'refused'}!`);
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
            ...form,
            termsAccepted: props.placeUser?.termsAccepted || false
        });
    }, [props.placeUser]);
    
    const terms = props.place.terms.length > 0?
        props.place.terms[0]:
        '';
    
    if(!terms) {
        return null;
    }
    
    return (
        <form onSubmit={handleCreate}>
            <Markdown 
                body={terms}
            />
            <br/>
            <CheckboxField
                label={intl.formatMessage({id: "I have read and agree to the terms and conditions", defaultMessage: "I have read and agree to the terms and conditions"})}
                id="termsAccepted"
                value={form.termsAccepted}
                onChange={changeForm}
            />
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleCreate}
                        disabled={createMut.isLoading}
                    >
                        <FormattedMessage id="Submit" defaultMessage="Submit"/>
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TermsForm;