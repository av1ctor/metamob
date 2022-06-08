import React, { useCallback, useContext, useEffect, useState } from "react";
import { FundingResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserFundings } from "../../../hooks/fundings";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../fundings/Item";
import DeleteForm from "../../fundings/funding/Delete";
import EditForm from "../../fundings/funding/Edit";
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

const Fundings = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [funding, setFunding] = useState<FundingResponse>();

    const fundings = useFindUserFundings(authState.user?._id || 0, orderBy, limit, actorState.main);
    
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
        props.toggleLoading(fundings.status === "loading");
        if(fundings.status === "error") {
            props.onError(fundings.error.message);
        }
    }, [fundings.status]);

    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                My fundings
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
                                user={authState.user}
                                funding={funding} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit funding"
                                        onClick={() => toggleEdit(funding)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete funding"
                                            onClick={() => toggleDelete(funding)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, funding.createdAt)}
                                        />
                                        {funding.updatedBy && funding.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i>Edited</i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                Campaign: <CampaignLink 
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
                header={<span>Edit funding</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {funding && 
                    <EditForm
                        funding={funding} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Delete funding</span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {funding && 
                    <DeleteForm
                        funding={funding} 
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

export default Fundings;