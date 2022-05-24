import React, {useState, useCallback} from "react";
import {Campaign, VoteResponse} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../libs/common";
import {useFindVotesByCampaign} from "../../hooks/votes";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import { ReportType } from "../../libs/reports";
import DeleteForm from "./vote/Delete";
import EditForm from "./vote/Edit";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Votes = (props: Props) => {
    const [orderBy, ] = useState<Order>({
        key: '_id',
        dir: 'desc'
    });
    const [limit, ] = useState<Limit>({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
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

    const campaign = props.campaign;

    const votes = useFindVotesByCampaign(campaign._id, orderBy, limit);

    return (
        <div className="votes">
            {votes.status === 'success' && votes.data? 
                votes.data.map((vote) => 
                    <Item
                        key={vote._id} 
                        vote={vote}
                        campaign={campaign}
                        onEdit={toggleEdit}
                        onDelete={toggleDelete}
                        onReport={toggleReport}
                    />
                ):
                <div>Loading...</div>
            }

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

            <Modal
                header={<span>Report vote</span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {vote &&
                    <ReportForm
                        entityId={vote._id}
                        entityType={ReportType.VOTES}
                        onClose={toggleReport}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            
        </div>
    )
};

export default Votes;