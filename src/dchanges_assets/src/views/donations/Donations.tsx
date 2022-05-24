import React, {useState, useCallback} from "react";
import {Campaign, DonationResponse} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../libs/common";
import {useFindDonationsByCampaign} from "../../hooks/donations";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import { ReportType } from "../../libs/reports";
import DeleteForm from "./donation/Delete";
import EditForm from "./donation/Edit";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Donations = (props: Props) => {
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

    const campaign = props.campaign;

    const donations = useFindDonationsByCampaign(campaign._id, orderBy, limit);

    return (
        <div className="donations">
            {donations.status === 'success' && donations.data? 
                donations.data.map((donation) => 
                    <Item
                        key={donation._id} 
                        donation={donation}
                        campaign={campaign}
                        onEdit={toggleEdit}
                        onDelete={toggleDelete}
                        onReport={toggleReport}
                    />
                ):
                <div>Loading...</div>
            }

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

export default Donations;