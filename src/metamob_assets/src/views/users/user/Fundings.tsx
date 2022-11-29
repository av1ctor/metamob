import React, { useCallback, useEffect, useState } from "react";
import { FundingResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserFundings } from "../../../hooks/fundings";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../fundings/Item";
import DeleteForm from "../../fundings/funding/Delete";
import EditForm from "../../fundings/funding/Edit";
import { Paginator } from "../../../components/Paginator";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Fundings = (props: Props) => {
    const {user} = useAuth();

    const {toggleLoading, showError} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [funding, setFunding] = useState<FundingResponse>();

    const fundings = useFindUserFundings(orderBy, limit, user?._id);
    
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
        toggleLoading(fundings.status === "loading");
        if(fundings.status === "error") {
            showError(fundings.error.message);
        }
    }, [fundings.status]);

    if(!user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="My fundraisings" />
            </div>

            <div>
                <div className="fundings columns is-multiline">
                    {fundings.status === 'success' && 
                        fundings.data && 
                            fundings.data.map((funding) => 
                        <div
                            key={funding._id}
                            className="column is-6"
                        >
                            <BaseItem 
                                funding={funding} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit funding"
                                        onClick={() => toggleEdit(funding)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete funding"
                                            onClick={() => toggleDelete(funding)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, funding.createdAt)}
                                        />
                                        {funding.updatedBy && funding.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                <FormattedMessage id="Campaign" defaultMessage="Campaign"/>: <CampaignLink 
                                    id={funding.campaignId} 
                                />
                                
                            </BaseItem>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={fundings.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
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
        </>
    );
};

export default Fundings;