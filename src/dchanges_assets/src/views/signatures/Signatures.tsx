import React, {useState, useCallback} from "react";
import {Campaign, SignatureResponse} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../libs/common";
import {useFindSignaturesByCampaign} from "../../hooks/signatures";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import EditForm from "./signature/Edit";
import ReportForm from "../reports/report/Create";
import { ReportType } from "../../libs/reports";
import DeleteForm from "./signature/Delete";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Signatures = (props: Props) => {
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

    const queryKey = ['signatures', campaign._id, orderBy.key, orderBy.dir];

    const signatures = useFindSignaturesByCampaign(queryKey, campaign._id, orderBy, limit);

    return (
        <div className="signatures">
            {signatures.status === 'success' && signatures.data? 
                signatures.data.map((signature) => 
                    <Item
                        key={signature._id} 
                        signature={signature}
                        campaign={campaign}
                        onEdit={toggleEdit}
                        onDelete={toggleDelete}
                        onReport={toggleReport}
                    />
                ):
                <div>Loading...</div>
            }

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
                    />
                }
            </Modal>            
        </div>
    )
};

export default Signatures;