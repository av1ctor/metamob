import React, {useState, useCallback, Fragment} from "react";
import {Campaign, FundingResponse} from '../../../../declarations/metamob/metamob.did';
import {EntityType, Order} from "../../libs/common";
import {useFindFundingsByCampaign} from "../../hooks/fundings";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import DeleteForm from "./funding/Delete";
import EditForm from "./funding/Edit";
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

const Fundings = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
        moderations: false,
    });
    const [funding, setFunding] = useState<FundingResponse | undefined>(undefined);

    const toggleEdit = useCallback((funding: FundingResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setFunding(funding);
    }, []);

    const toggleDelete = useCallback((funding: FundingResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setFunding(funding);
    }, []);

    const toggleReport = useCallback((funding: FundingResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setFunding(funding);
    }, []);

    const toggleModerations = useCallback((funding: FundingResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setFunding(funding);
    }, []);

    const campaign = props.campaign;

    const fundings = useFindFundingsByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="fundings">
                {fundings.status === 'success' && 
                    fundings.data && 
                        fundings.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(funding => 
                            <Item
                                key={funding._id} 
                                funding={funding}
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
                        disabled={!fundings.hasNextPage || fundings.isFetchingNextPage}
                        onClick={() => fundings.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;<FormattedMessage id={fundings.hasNextPage? 'Load more': 'All loaded'} defaultMessage={fundings.hasNextPage? 'Load more': 'All loaded'}/>
                    </Button>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit funding"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {funding && 
                    <EditForm
                        funding={funding} 
                        onClose={toggleEdit}
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete funding"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {funding && 
                    <DeleteForm
                        funding={funding} 
                        onClose={toggleDelete}
                    />
                }
            </Modal>            

            <Modal
                header={<span><FormattedMessage defaultMessage="Report funding"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {funding &&
                    <ReportForm
                        entityId={funding._id}
                        entityPubId={funding.pubId}
                        entityType={EntityType.FUNDINGS}
                        onClose={toggleReport}
                    />
                }
            </Modal>        

            {funding &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.FUNDINGS}
                    entityId={funding._id}
                    moderated={funding.moderated}
                    onClose={toggleModerations}
                />
            }
        </>
    )
};

export default Fundings;