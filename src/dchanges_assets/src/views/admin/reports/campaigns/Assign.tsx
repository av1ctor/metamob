import React, { useCallback, useContext, useState } from "react";
import * as yup from 'yup';
import { Report } from "../../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../../components/AutocompleteField";
import Button from "../../../../components/Button";
import { CampaignLink } from "../../../../components/CampaignLink";
import { Option } from "../../../../components/SelectField";
import TextAreaField from "../../../../components/TextAreaField";
import TextField from "../../../../components/TextField";
import { useAssignReport } from "../../../../hooks/reports";
import { useFindUserById } from "../../../../hooks/users";
import { search } from "../../../../libs/users";
import { ActorContext } from "../../../../stores/actor";
import Avatar from "../../../users/Avatar";

interface Props {
    report: Report;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const formSchema = yup.object().shape({
    userId: yup.number().required(),
});


const AssignForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState({
        userId: 0,
    });

    const assignMut = useAssignReport();
    const assignedTo = useFindUserById(['users', form.userId], form.userId);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = async (form: Object): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleAssign = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            await assignMut.mutateAsync({
                main: actorState.main,
                pubId: props.report.pubId, 
                userId: form.userId
            });
            props.onSuccess('Report assigned!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, actorState.main, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const handleSearchUser = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            if(!actorState.main) {
                throw Error("Main actor undefined");
            }
            return search(actorState.main, value);
        }
        catch(e) {
            props.onError(e);
            return [];
        }
    }, [actorState.main]);

    const {report} = props;
    
    return (
        <form onSubmit={handleAssign}>
            <TextField
                label="Id"
                name="id"
                value={report.pubId}
                disabled
            />
            <TextAreaField
                label="Description"
                name="description"
                rows={5}
                value={report.description}
                disabled
            />
            <div className="field">
                <label className="label">
                    User
                </label>
                <div className="control">
                    <Avatar 
                        id={report.createdBy} 
                        size='lg'
                    />
                </div>
            </div>

            <CampaignLink id={report.entityId} />

            <AutocompleteField
                label="Moderator"
                name="assignedTo"
                value={assignedTo.data?.name || ''}
                required={true}
                onSearch={handleSearchUser}
                onChange={changeForm}
            />
            
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        onClick={handleAssign}
                        disabled={assignMut.isLoading}
                    >
                        Assign
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
        </form>
    );
};

export default AssignForm;