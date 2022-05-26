import React, { useCallback, useContext, useState } from "react";
import { VoteResponse } from "../../../../../declarations/dchanges/dchanges.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserVotes } from "../../../hooks/votes";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../votes/Item";
import DeleteForm from "../../votes/vote/Delete";
import EditForm from "../../votes/vote/Edit";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = {
    key: '_id',
    dir: 'desc'
};

const limit = {
    offset: 0,
    size: 10
};

const Votes = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [vote, setVote] = useState<VoteResponse>();

    const votes = useFindUserVotes(authState.user?._id || 0, orderBy, limit, actorState.main);
    
    const toggleEdit = useCallback((vote: VoteResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setVote(vote);
    }, []);

    const toggleDelete = useCallback((vote: VoteResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setVote(vote);
    }, []);

    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                My votes
            </div>

            <div>
                {votes.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {votes.status === 'error' &&
                    <div className="form-error">
                        {votes.error.message}
                    </div>
                }
                
                <div className="votes">
                    {votes.status === 'success' && votes.data && votes.data.map((vote) => 
                        <BaseItem 
                            key={vote._id}    
                            user={authState.user}
                            vote={vote} 
                        >
                            <p>
                                <small>
                                    <a
                                    title="Edit vote"
                                    onClick={() => toggleEdit(vote)}
                                    >
                                        <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <a
                                        title="Delete vote"
                                        onClick={() => toggleDelete(vote)}
                                    >
                                        <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <TimeFromNow 
                                        date={BigInt.asIntN(64, vote.createdAt)}
                                    />
                                    {vote.updatedBy && vote.updatedBy.length > 0 &&
                                        <>
                                            &nbsp;·&nbsp;<b><i>Edited</i></b>
                                        </>
                                    }
                                </small>
                            </p>

                            Campaign: <CampaignLink 
                                id={vote.campaignId} 
                            />
                            
                        </BaseItem>
                    )}
                </div>        
            </div>

            <Modal
                header={<span>Edit vote</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {vote && 
                    <EditForm
                        vote={vote} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Delete vote</span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {vote && 
                    <DeleteForm
                        vote={vote} 
                        onClose={toggleDelete}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal> 
        </>
    );
};

export default Votes;