import React, { useCallback, useContext, useEffect, useState } from "react";
import { DonationResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserDonations } from "../../../hooks/donations";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../donations/Item";
import DeleteForm from "../../donations/donation/Delete";
import EditForm from "../../donations/donation/Edit";
import { Paginator } from "../../../components/Paginator";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Donations = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [donation, setDonation] = useState<DonationResponse>();

    const donations = useFindUserDonations(orderBy, limit, auth.user?._id, actors.main);
    
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
        props.toggleLoading(donations.status === "loading");
        if(donations.status === "error") {
            props.onError(donations.error.message);
        }
    }, [donations.status]);

    if(!auth.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                My donations
            </div>

            <div>
                <div className="donations columns is-multiline">
                    {donations.status === 'success' && 
                        donations.data && 
                            donations.data.map((donation) => 
                        <div
                            key={donation._id}
                            className="column is-6"
                        >
                            <BaseItem 
                                donation={donation} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit donation"
                                        onClick={() => toggleEdit(donation)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete donation"
                                            onClick={() => toggleDelete(donation)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, donation.createdAt)}
                                        />
                                        {donation.updatedBy && donation.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i>Edited</i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                Campaign: <CampaignLink 
                                    id={donation.campaignId} 
                                />
                                
                            </BaseItem>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={donations.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
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
        </>
    );
};

export default Donations;