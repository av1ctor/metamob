import React, {useCallback, useContext} from "react";
import {useDeleteUpdate} from "../../../hooks/updates";
import {Update} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { useUI } from "../../../hooks/ui";

interface Props {
    update: Update;
    onClose: () => void;

};

const DeleteForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();
    
    const deleteMut = useDeleteUpdate();

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            await deleteMut.mutateAsync({pubId: props.update.pubId});
            
            showSuccess('Update deleted!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    return (
        <form onSubmit={handleDelete}>
            <Container>
                <div className="has-text-centered">
                    <p>Are you sure you want to delete this update?</p>
                    <p className="has-text-danger">This action can not be reverted!</p>
                </div>
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            disabled={deleteMut.isLoading}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                    <div className="control">
                        <Button
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

export default DeleteForm;