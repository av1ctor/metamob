import React, {useState, useCallback, Fragment} from "react";
import {Campaign, VoteResponse} from '../../../../declarations/metamob/metamob.did';
import {EntityType, Order} from "../../libs/common";
import {useFindVotesByCampaign} from "../../hooks/votes";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import DeleteForm from "./vote/Delete";
import EditForm from "./vote/Edit";
import Button from "../../components/Button";
import ModerationModal from "../moderations/Modal";
import { FormattedMessage } from "react-intl";

interface Props {
    campaign: Campaign;
};

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const Votes = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
        moderations: false,
    });
    const [vote, setVote] = useState<VoteResponse | undefined>(undefined);

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

    const toggleReport = useCallback((vote: VoteResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setVote(vote);
    }, []);

    const toggleModerations = useCallback((vote: VoteResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setVote(vote);
    }, []);

    const campaign = props.campaign;

    const votes = useFindVotesByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="votes">
                {votes.status === 'success' && 
                    votes.data &&
                        votes.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map((vote) => 
                            <Item
                                key={vote._id} 
                                vote={vote}
                                campaign={campaign}
                                onEdit={toggleEdit}
                                onDelete={toggleDelete}
                                onReport={toggleReport}
                                onShowModerations={toggleModerations}
                            />
                        )}
                    </Fragment>
                )}
            </div>
            <div className="has-text-centered">
                <div className="control">
                    <Button
                        disabled={!votes.hasNextPage || votes.isFetchingNextPage}
                        onClick={() => votes.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;<FormattedMessage id={votes.hasNextPage? 'Load more': 'All loaded'} defaultMessage={votes.hasNextPage? 'Load more': 'All loaded'}/>
                    </Button>
                </div>
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

            <Modal
                header={<span><FormattedMessage defaultMessage="Report vote"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {vote &&
                    <ReportForm
                        entityId={vote._id}
                        entityPubId={vote.pubId}
                        entityType={EntityType.VOTES}
                        onClose={toggleReport}
                    />
                }
            </Modal>

            {vote &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.VOTES}
                    entityId={vote._id}
                    moderated={vote.moderated}
                    onClose={toggleModerations}
                />
            }
        </>
    )
};

export default Votes;