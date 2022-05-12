import React, {useState, useCallback, useContext} from "react";
import {Campaign, SignatureResponse} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../libs/common";
import {CampaignState} from "../../libs/campaigns";
import {useFindSignaturesByCampaign} from "../../hooks/signatures";
import { Item } from "./Item";
import { AuthContext } from "../../stores/auth";
import Modal from "../../components/Modal";
import EditForm from "./signature/Edit";
import ReportForm from "../reports/Create";
import { ReportType } from "../../libs/reports";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Signatures = (props: Props) => {
    const [auth] = useContext(AuthContext);
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
        setModals({
            ...modals,
            edit: !modals.edit
        });
        setSignature(signature);
    }, [modals, signature]);

    const toggleDelete = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
        setSignature(signature);
    }, [modals, signature]);

    const toggleReport = useCallback((signature: SignatureResponse | undefined = undefined) => {
        setModals({
            ...modals,
            report: !modals.report
        });
        setSignature(signature);
    }, [modals, signature]);

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
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {signature && 
                    <EditForm
                        signature={signature} 
                        onCancel={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>

            <Modal
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                delete
            </Modal>            

            <Modal
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {signature &&
                    <ReportForm
                        entityId={signature._id}
                        entityType={ReportType.SIGNATURES}
                        onCancel={toggleReport}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>            
        </div>
    )
};

export default Signatures;