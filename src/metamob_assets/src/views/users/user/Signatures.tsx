import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SignatureResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import { Paginator } from "../../../components/Paginator";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserSignatures } from "../../../hooks/signatures";
import { useUI } from "../../../hooks/ui";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../signatures/Item";
import DeleteForm from "../../signatures/signature/Delete";
import EditForm from "../../signatures/signature/Edit";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Signatures = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const {toggleLoading, showError} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
    });
    const [signature, setSignature] = useState<SignatureResponse>();

    const signatures = useFindUserSignatures(orderBy, limit, auth.user?._id);
    
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

    useEffect(() => {
        toggleLoading(signatures.status === "loading");
        if(signatures.status === "error") {
            showError(signatures.error.message);
        }
    }, [signatures.status]);

    if(!auth.user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
            <FormattedMessage defaultMessage="My signatures"/>
            </div>

            <div>
                <div className="signatures columns is-multiline">
                    {signatures.status === 'success' && 
                        signatures.data && 
                            signatures.data.map((signature) => 
                        <div 
                            key={signature._id}
                            className="column is-6"
                        >
                            <BaseItem
                                signature={signature} 
                            >
                                <p>
                                    <small>
                                        <a
                                        title="Edit signature"
                                        onClick={() => toggleEdit(signature)}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title="Delete signature"
                                            onClick={() => toggleDelete(signature)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, signature.createdAt)}
                                        />
                                        {signature.updatedBy && signature.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                                            </>
                                        }
                                    </small>
                                </p>

                                <FormattedMessage defaultMessage="Campaign"/>: <CampaignLink 
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
                header={<span><FormattedMessage defaultMessage="Edit signature"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {signature && 
                    <EditForm
                        signature={signature} 
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete signature"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {signature && 
                    <DeleteForm
                        signature={signature} 
                        onClose={toggleDelete}
                        
                        
                        
                    />
                }
            </Modal> 
        </>
    );
};

export default Signatures;