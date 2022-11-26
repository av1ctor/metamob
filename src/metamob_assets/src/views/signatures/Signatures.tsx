import React, {useState, useCallback, Fragment} from "react";
import {Campaign, SignatureResponse} from '../../../../declarations/metamob/metamob.did';
import {EntityType, Order} from "../../libs/common";
import {useFindSignaturesByCampaign} from "../../hooks/signatures";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import EditForm from "./signature/Edit";
import ReportForm from "../reports/report/Create";
import DeleteForm from "./signature/Delete";
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

const Signatures = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
        moderations: false,
    });
    const [signature, setSignature] = useState<SignatureResponse | undefined>(undefined);

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

    const toggleReport = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setSignature(signature);
    }, []);

    const toggleModerations = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setSignature(signature);
    }, []);

    const campaign = props.campaign;

    const signatures = useFindSignaturesByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="signatures">
                {signatures.status === 'success' && 
                    signatures.data &&
                        signatures.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(signature =>
                            <Item
                                key={signature._id} 
                                signature={signature}
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
                        disabled={!signatures.hasNextPage || signatures.isFetchingNextPage}
                        onClick={() => signatures.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;{<FormattedMessage id={signatures.hasNextPage? 'Load more': 'All loaded'} defaultMessage={signatures.hasNextPage? 'Load more': 'All loaded'}/>}
                    </Button>
                </div>
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

            <Modal
                header={<span><FormattedMessage defaultMessage="Report signature"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {signature &&
                    <ReportForm
                        entityId={signature._id}
                        entityPubId={signature.pubId}
                        entityType={EntityType.SIGNATURES}
                        onClose={toggleReport}
                        
                        
                        
                    />
                }
            </Modal>

            {signature &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.SIGNATURES}
                    entityId={signature._id}
                    moderated={signature.moderated}
                    onClose={toggleModerations}
                    
                    
                    
                />
            }
        </>
    )
};

export default Signatures;