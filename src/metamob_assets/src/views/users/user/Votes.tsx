import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { VoteResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import { Paginator } from "../../../components/Paginator";
import TimeFromNow from "../../../components/TimeFromNow";
import { useUI } from "../../../hooks/ui";
import { useFindUserVotes } from "../../../hooks/votes";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../votes/Item";
import DeleteForm from "../../votes/vote/Delete";
import EditForm from "../../votes/vote/Edit";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Votes = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const {toggleLoading, showError} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [vote, setVote] = useState<VoteResponse>();

    const votes = useFindUserVotes(orderBy, limit, auth.user?._id);
    
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

    const handlePrevPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: Math.max(0, limit.offset - limit.size)|0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: limit.offset + limit.size
        }));
    }, []);

    useEffect(() => {
        toggleLoading(votes.status === "loading");
        if(votes.status === "error") {
            showError(votes.error.message);
        }
    }, [votes.status]);
    
    if(!auth.user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="My votes"/>
            </div>

            <div>
                <div className="votes columns is-multiline">
                    {votes.status === 'success' && 
                        votes.data && 
                            votes.data.map((vote) => 
                        <div 
                            key={vote._id}
                            className="column is-6"
                        >
                            <BaseItem 
                                vote={vote} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit vote"
                                        onClick={() => toggleEdit(vote)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete vote"
                                            onClick={() => toggleDelete(vote)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, vote.createdAt)}
                                        />
                                        {vote.updatedBy && vote.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                <FormattedMessage id="Campaign" defaultMessage="Campaign"/>: <CampaignLink 
                                    id={vote.campaignId} 
                                />
                                
                            </BaseItem>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={votes.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit vote"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {vote && 
                    <EditForm
                        vote={vote} 
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete vote"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {vote && 
                    <DeleteForm
                        vote={vote} 
                        onClose={toggleDelete}
                        
                        
                        
                    />
                }
            </Modal> 
        </>
    );
};

export default Votes;