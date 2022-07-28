import React, {useState, useCallback, Fragment} from "react";
import {Campaign, DonationResponse} from '../../../../declarations/metamob/metamob.did';
import {Order} from "../../libs/common";
import {useFindDonationsByCampaign} from "../../hooks/donations";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import { EntityType } from "../../libs/common";
import DeleteForm from "./donation/Delete";
import EditForm from "./donation/Edit";
import Button from "../../components/Button";
import ModerationModal from "../moderations/Modal";

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

const Donations = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
        moderations: false,
    });
    const [donation, setDonation] = useState<DonationResponse | undefined>(undefined);

    const toggleEdit = useCallback((donation: DonationResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setDonation(donation);
    }, []);

    const toggleDelete = useCallback((donation: DonationResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setDonation(donation);
    }, []);

    const toggleReport = useCallback((donation: DonationResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setDonation(donation);
    }, []);

    const toggleModerations = useCallback((donation: DonationResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setDonation(donation);
    }, []);

    const campaign = props.campaign;

    const donations = useFindDonationsByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="donations">
                {donations.status === 'success' && 
                    donations.data && 
                        donations.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(donation => 
                            <Item
                                key={donation._id} 
                                donation={donation}
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
                        disabled={!donations.hasNextPage || donations.isFetchingNextPage}
                        onClick={() => donations.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;{donations.hasNextPage? 'Load more': 'All loaded'}
                    </Button>
                </div>
            </div>

            <Modal
                header={<span>Edit donation</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {donation && 
                    <EditForm
                        donation={donation} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Delete donation</span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {donation && 
                    <DeleteForm
                        donation={donation} 
                        onClose={toggleDelete}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            

            <Modal
                header={<span>Report donation</span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {donation &&
                    <ReportForm
                        entityId={donation._id}
                        entityPubId={donation.pubId}
                        entityType={EntityType.DONATIONS}
                        onClose={toggleReport}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>        
        
            {donation &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.DONATIONS}
                    entityId={donation._id}
                    moderated={donation.moderated}
                    onClose={toggleModerations}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            }
        </>
    )
};

export default Donations;