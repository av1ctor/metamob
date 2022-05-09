import React, {useState, useCallback, useContext} from "react";
import {Update, Campaign} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../libs/common";
import {CampaignState} from "../../libs/campaigns";
import {useFindUpdatesByCampaign} from "../../hooks/updates";
import { Item } from "./Item";
import { AuthContext } from "../../stores/auth";
import Modal from "../../components/Modal";
import EditForm from "./update/Edit";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Updates = (props: Props) => {
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
        delete: false,
        report: false,
    });
    const [update, setUpdate] = useState<Update | undefined>(undefined);

    const campaign = props.campaign;

    const queryKey = ['updates', campaign._id, orderBy.key, orderBy.dir];

    const updates = useFindUpdatesByCampaign(queryKey, campaign._id, orderBy, limit);

    const canEdit = campaign?.state === CampaignState.PUBLISHED && auth.user && auth.user._id === campaign?.createdBy;

    const toggleEdit = useCallback((update: Update | undefined = undefined) => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
        setUpdate(update);
    }, [modals, update]);

    const toggleDelete = useCallback((update: Update | undefined = undefined) => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
        setUpdate(update);
    }, [modals, update]);

    const toggleReport = useCallback((update: Update | undefined = undefined) => {
        setModals({
            ...modals,
            report: !modals.report
        });
        setUpdate(update);
    }, [modals, update]);

    return (
        <div className="updates">
            {updates.status === 'success' && updates.data? 
                updates.data.map((update) => 
                    <Item
                        key={update._id} 
                        update={update}
                        canEdit={canEdit? true: false}
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
                {update && 
                    <EditForm
                        update={update} 
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
                report
            </Modal>            
        </div>
    )
};

export default Updates;