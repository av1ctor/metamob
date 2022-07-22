import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useModerateUpdate, useUpdateUpdate} from "../../../hooks/updates";
import {Update, UpdateRequest} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import MarkdownField from "../../../components/MarkdownField";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";

interface Props {
    update: Update;
    reportId?: number | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);
    
    const [form, setForm] = useState<UpdateRequest>({
        campaignId: props.update.campaignId,
        body: props.update.body,
    });

    const [modForm, setModForm] = useModerationForm(props.reportId);
    
    const updateMut = useUpdateUpdate();
    const moderateMut = useModerateUpdate();

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const changeModForm = useSetModerationFormField(setModForm);

    const validate = (form: UpdateRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        const isModeration = props.reportId && isModerator(authState.user);

        if(isModeration) {
            const errors = validateModerationForm(modForm);
            if(errors.length > 0) {
                props.onError(errors);
                return;
            }
        }

        const transformReq = (): UpdateRequest => {
            return {
                campaignId: Number(props.update.campaignId),
                body: form.body,
            };
        };
        
        try {
            props.toggleLoading(true);

            if(isModeration) {
                await moderateMut.mutateAsync({
                    main: actorState.main,
                    pubId: props.update.pubId, 
                    req: transformReq(),
                    mod: transformModerationForm(modForm)
                });
                
                props.onSuccess('Update moderated!');
            }
            else {
                await updateMut.mutateAsync({
                    main: actorState.main,
                    pubId: props.update.pubId, 
                    req: transformReq()
                });

                props.onSuccess('Update updated!');
            }
            
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, modForm, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    useEffect(() => {
        setForm({
            campaignId: props.update.campaignId,
            body: props.update.body,
        });
    }, [props.update]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <MarkdownField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    onChange={changeForm}
                />
                {props.reportId && isModerator(authState.user) &&
                    <CreateModerationForm
                        form={modForm}
                        onChange={changeModForm}
                    />
                }
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMut.isLoading}
                        >
                            Update
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

export default EditForm;