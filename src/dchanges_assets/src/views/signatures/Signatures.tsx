import React, {useState, useCallback, useContext} from "react";
import {Signature, Petition} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order, PetitionState} from "../../interfaces/common";
import {useFindSignaturesByPetition} from "../../hooks/signatures";
import { Item } from "./Item";
import { AuthContext } from "../../stores/auth";
import Modal from "../../components/Modal";
import EditForm from "./signature/Edit";
import ReplyForm from "./signature/Create";

interface Props {
    petition: Petition;
};

const Signatures = (props: Props) => {
    const [auth] = useContext(AuthContext);
    const [orderBy, setOrderBy] = useState<Order>({
        key: '_id',
        dir: 'asc'
    });
    const [limit, ] = useState<Limit>({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        edit: false,
        reply: false,
        delete: false,
        report: false,
    });
    const [signature, setSignature] = useState<Signature | undefined>(undefined);

    const petition = props.petition;

    const queryKey = ['signatures', petition._id, orderBy.key, orderBy.dir];

    const signatures = useFindSignaturesByPetition(queryKey, petition._id, orderBy, limit);

    const canReply = petition?.state === PetitionState.PUBLISHED && auth.user;
    const canEdit = petition?.state === PetitionState.PUBLISHED && auth.user && auth.user._id === petition?.createdBy;

    const reorderSignatures = useCallback((orderBy: React.SetStateAction<Order>) => {
        setOrderBy(orderBy);
    }, [orderBy]);

    const toggleEdit = useCallback((signature: Signature | undefined = undefined) => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
        setSignature(signature);
    }, [modals, signature]);

    const toggleReply = useCallback((signature: Signature | undefined = undefined) => {
        setModals({
            ...modals,
            reply: !modals.reply
        });
        setSignature(signature);
    }, [modals, signature]);

    const toggleDelete = useCallback((signature: Signature | undefined = undefined) => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
        setSignature(signature);
    }, [modals, signature]);

    const toggleReport = useCallback((signature: Signature | undefined = undefined) => {
        setModals({
            ...modals,
            report: !modals.report
        });
        setSignature(signature);
    }, [modals, signature]);

    return (
        <div className="signatures">
            {signatures.status === 'success' && signatures.data? 
                signatures.data.map((signature) => 
                    <Item
                        key={signature._id} 
                        signature={signature}
                        canReply={canReply? true: false}
                        canEdit={canEdit? true: false}
                        onEdit={toggleEdit}
                        onReply={toggleReply}
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
                    />
                }
            </Modal>

            <Modal
                isOpen={modals.reply}
                onClose={toggleReply}
            >
                <ReplyForm 
                    petition={petition}
                    body={signature?.body} 
                    onCancel={toggleReply}
                />
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
                report
            </Modal>            
        </div>
    )
};

export default Signatures;