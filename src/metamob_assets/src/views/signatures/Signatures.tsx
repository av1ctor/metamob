import React, {useState, useCallback, Fragment} from "react";
import {Campaign, SignatureResponse} from '../../../../declarations/metamob/metamob.did';
import {Order} from "../../libs/common";
import {useFindSignaturesByCampaign} from "../../hooks/signatures";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import EditForm from "./signature/Edit";
import ReportForm from "../reports/report/Create";
import { ReportType } from "../../libs/reports";
import DeleteForm from "./signature/Delete";
import Button from "../../components/Button";

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

const Signatures = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
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
                        <i className="la la-sync" />&nbsp;{signatures.hasNextPage? 'Load more': 'All loaded'}
                    </Button>
                </div>
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

            <Modal
                header={<span>Report signature</span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {signature &&
                    <ReportForm
                        entityId={signature._id}
                        entityType={ReportType.SIGNATURES}
                        onClose={toggleReport}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            
        </>
    )
};

export default Signatures;