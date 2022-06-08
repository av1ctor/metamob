import React, {useCallback, useContext} from "react";
import {useDeleteVote} from "../../../hooks/votes";
import {VoteResponse} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";

interface Props {
    vote: VoteResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};


const DeleteForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const deleteMut = useDeleteVote();

    const handleDelete = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            props.toggleLoading(true);

            await deleteMut.mutateAsync({
                main: actorState.main,
                pubId: props.vote.pubId, 
            });
            
            props.onSuccess('Vote deleted!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
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
                    <p>Are you sure you want to delete this vote?</p>
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