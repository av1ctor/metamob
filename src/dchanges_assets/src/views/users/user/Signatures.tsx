import React, { useCallback, useContext, useState } from "react";
import { SignatureResponse } from "../../../../../declarations/dchanges/dchanges.did";
import Modal from "../../../components/Modal";
import { Paginator } from "../../../components/Paginator";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserSignatures } from "../../../hooks/signatures";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../signatures/Item";
import DeleteForm from "../../signatures/signature/Delete";
import EditForm from "../../signatures/signature/Edit";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Signatures = (props: Props) => {
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
    const [signature, setSignature] = useState<SignatureResponse>();

    const signatures = useFindUserSignatures(authState.user?._id || 0, orderBy, limit, actorState.main);
    
    const toggleEdit = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setSignature(signature);
    }, []);

    const toggleDelete = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setSignature(signature);
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

    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                My signatures
            </div>

            <div>
                {signatures.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {signatures.status === 'error' &&
                    <div className="form-error">
                        {signatures.error.message}
                    </div>
                }
                
                <div className="signatures columns is-multiline">
                    {signatures.status === 'success' && 
                        signatures.data && 
                            signatures.data.map((signature) => 
                        <div 
                            key={signature._id}
                            className="column is-6"
                        >
                            <BaseItem                                     
                                user={authState.user}
                                signature={signature} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit signature"
                                        onClick={() => toggleEdit(signature)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete signature"
                                            onClick={() => toggleDelete(signature)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, signature.createdAt)}
                                        />
                                        {signature.updatedBy && signature.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i>Edited</i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                Campaign: <CampaignLink 
                                    id={signature.campaignId} 
                                />
                                
                            </BaseItem>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={signatures.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span>Edit signature</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {signature && 
                    <EditForm
                        signature={signature} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Delete signature</span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {signature && 
                    <DeleteForm
                        signature={signature} 
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

export default Signatures;