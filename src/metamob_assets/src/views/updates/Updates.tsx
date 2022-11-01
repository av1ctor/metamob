import React, {useState, useCallback, useContext, Fragment} from "react";
import {Update, Campaign} from '../../../../declarations/metamob/metamob.did';
import {EntityType, Order} from "../../libs/common";
import {CampaignState} from "../../libs/campaigns";
import {useFindUpdatesByCampaign} from "../../hooks/updates";
import { Item } from "./Item";
import { AuthContext } from "../../stores/auth";
import Modal from "../../components/Modal";
import CreateForm from "./update/Create";
import EditForm from "./update/Edit";
import ReportForm from "../reports/report/Create";
import Button from "../../components/Button";
import DeleteForm from "./update/Delete";
import ModerationModal from "../moderations/Modal";
import { FormattedMessage } from "react-intl";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const Updates = (props: Props) => {
    const [auth] = useContext(AuthContext);
    
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        report: false,
        moderations: false,
    });
    const [update, setUpdate] = useState<Update | undefined>(undefined);

    const campaign = props.campaign;

    const updates = useFindUpdatesByCampaign(campaign._id, orderBy, 10);

    const canEdit = (campaign?.state === CampaignState.PUBLISHED && 
        auth.user && auth.user._id === campaign?.createdBy);

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
        setUpdate(undefined);
    }, []);

    const toggleEdit = useCallback((update: Update | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setUpdate(update);
    }, []);

    const toggleDelete = useCallback((update: Update | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setUpdate(update);
    }, []);

    const toggleReport = useCallback((update: Update | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setUpdate(update);
    }, []);

    const toggleModerations = useCallback((update: Update | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setUpdate(update);
    }, []);

    return (
        <>
            <div className="updates">
                <div className="level">
                    <div className="level-left">
                        <div>
                            {updates.status === 'success' && 
                                updates.data && 
                                    updates.data.pages.map((page, index) => 
                                <Fragment key={index}>
                                    {page.map(update => 
                                        <Item
                                            key={update._id} 
                                            update={update}
                                            canEdit={canEdit? true: false}
                                            onEdit={toggleEdit}
                                            onDelete={toggleDelete}
                                            onReport={toggleReport}
                                            onShowModerations={toggleModerations}
                                        />
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </div>
                    <div className="level-right is-align-self-baseline">
                        {auth.user?._id === props.campaign.createdBy &&
                            <Button
                                onClick={toggleCreate}
                            >
                                <i className="la la-plus-circle" />&nbsp;<FormattedMessage id="Create" defaultMessage="Create"/>
                            </Button>
                        }
                    </div>
                </div>
                <div className="has-text-centered">
                    <div className="control">
                        <Button
                            disabled={!updates.hasNextPage || updates.isFetchingNextPage}
                            onClick={() => updates.fetchNextPage()}
                        >
                            <i className="la la-sync" />&nbsp;<FormattedMessage id={updates.hasNextPage? 'Load more': 'All loaded'} defaultMessage={updates.hasNextPage? 'Load more': 'All loaded'}/>
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create update"/></span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    campaign={props.campaign}
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit update"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {update && 
                    <EditForm
                        update={update} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete update"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {update && 
                    <DeleteForm
                        update={update}
                        onClose={toggleDelete}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            

            <Modal
                header={<span><FormattedMessage defaultMessage="Report update"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {update &&
                    <ReportForm
                        entityId={update._id}
                        entityPubId={update.pubId}
                        entityType={EntityType.UPDATES}
                        onClose={toggleReport}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            
        
            {update &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.UPDATES}
                    entityId={update._id}
                    moderated={update.moderated}
                    onClose={toggleModerations}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            }
        </>
    )
};

export default Updates;