import React, {useState, useCallback, Fragment} from "react";
import {Campaign, BoostResponse} from '../../../../declarations/metamob/metamob.did';
import {Order} from "../../libs/common";
import {useFindBoostsByCampaign} from "../../hooks/boosts";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import EditForm from "./boost/Edit";
import Button from "../../components/Button";
import { FormattedMessage } from "react-intl";

interface Props {
    campaign: Campaign;
};

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const Boosts = (props: Props) => {
    const [modals, setModals] = useState({
        edit: false,
    });
    const [boost, setBoost] = useState<BoostResponse | undefined>(undefined);

    const toggleEdit = useCallback((boost: BoostResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setBoost(boost);
    }, []);

    const campaign = props.campaign;

    const boosts = useFindBoostsByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="boosts">
                {boosts.status === 'success' && 
                    boosts.data && 
                        boosts.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(boost => 
                            <Item
                                key={boost._id} 
                                boost={boost}
                                campaign={campaign}
                                onEdit={toggleEdit}
                            />                        
                        )}
                    </Fragment>
                )}
            </div>
            <div className="has-text-centered">
                <div className="control">
                    <Button
                        disabled={!boosts.hasNextPage || boosts.isFetchingNextPage}
                        onClick={() => boosts.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;<FormattedMessage id={boosts.hasNextPage? 'Load more': 'All loaded'} defaultMessage={boosts.hasNextPage? 'Load more': 'All loaded'}/>
                    </Button>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit boost"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {boost && 
                    <EditForm
                        boost={boost} 
                        onClose={toggleEdit}
                    />
                }
            </Modal>
        </>
    )
};

export default Boosts;