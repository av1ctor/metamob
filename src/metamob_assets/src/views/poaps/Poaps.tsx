import React, {useState, useCallback, Fragment, useContext} from "react";
import {Campaign, Poap} from '../../../../declarations/metamob/metamob.did';
import {Order} from "../../libs/common";
import {useFindPoapsByCampaign} from "../../hooks/poap";
import { Item } from "./Item";
import Modal from "../../components/Modal";
import ReportForm from "../reports/report/Create";
import { EntityType } from "../../libs/common";
import DeleteForm from "./poap/Delete";
import EditForm from "./poap/Edit";
import Button from "../../components/Button";
import ModerationModal from "../moderations/Modal";
import { FormattedMessage } from "react-intl";
import { AuthContext } from "../../stores/auth";
import MintForm from "./poap/Mint";

interface Props {
    campaign: Campaign;
};

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const Poaps = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        report: false,
        moderations: false,
        mint: false,
    });
    const [poap, setPoap] = useState<Poap | undefined>(undefined);

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
        setPoap(undefined);
    }, []);

    const toggleEdit = useCallback((poap: Poap | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setPoap(poap);
    }, []);

    const toggleDelete = useCallback((poap: Poap | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setPoap(poap);
    }, []);

    const toggleReport = useCallback((poap: Poap | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
        setPoap(poap);
    }, []);

    const toggleModerations = useCallback((poap: Poap | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
        setPoap(poap);
    }, []);

    const toggleMint = useCallback((poap: Poap | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            mint: !modals.mint
        }));
        setPoap(poap);
    }, []);

    const campaign = props.campaign;
    const isOwner = campaign.createdBy === auth.user?._id;

    const poaps = useFindPoapsByCampaign(campaign._id, orderBy, 10);

    return (
        <>
            <div className="mb-2">
                <div className="is-size-4 has-text-success-dark"><FormattedMessage defaultMessage="Campaign's POAPs"/></div>
            </div>

            <div className="poaps">
                {poaps.status === 'success' && 
                    poaps.data && 
                        poaps.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(poap => 
                            <Item
                                key={poap._id}
                                poap={poap}
                                campaign={campaign}
                                onEdit={toggleEdit}
                                onDelete={toggleDelete}
                                onReport={toggleReport}
                                onShowModerations={toggleModerations}
                                onMint={toggleMint}
                            />
                        )}
                    </Fragment>
                )}
            </div>
            <div className="has-text-centered">
                <div className="control">
                    <Button
                        size="small"
                        disabled={!poaps.hasNextPage || poaps.isFetchingNextPage}
                        onClick={() => poaps.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;<FormattedMessage id={poaps.hasNextPage? 'Load more': 'All loaded'} defaultMessage={poaps.hasNextPage? 'Load more': 'All loaded'}/>
                    </Button>
                    {isOwner &&
                        <span className="pl-2">
                            <Button 
                                size="small"
                                color="danger"
                                onClick={toggleCreate}>
                                <i className="la la-plus-circle" />&nbsp;<FormattedMessage id="Create" defaultMessage="Create"/>
                            </Button>
                        </span>
                    }
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create poap"/></span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <EditForm
                    campaignId={campaign._id}    
                    poap={undefined} 
                    onClose={toggleCreate}
                    
                    
                    
                />
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit poap"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {poap && 
                    <EditForm
                        campaignId={campaign._id}
                        poap={poap} 
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete poap"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                {poap && 
                    <DeleteForm
                        poap={poap} 
                        onClose={toggleDelete}
                        
                        
                        
                    />
                }
            </Modal>            

            <Modal
                header={<span><FormattedMessage defaultMessage="Report poap"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {poap &&
                    <ReportForm
                        entityId={poap._id}
                        entityPubId={poap.pubId}
                        entityType={EntityType.POAPS}
                        onClose={toggleReport}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Mint poap"/></span>}
                isOpen={modals.mint}
                onClose={toggleMint}
            >
                {poap && 
                    <MintForm
                        poap={poap} 
                        campaign={campaign}
                        onClose={toggleMint}
                        
                        
                        
                    />
                }
            </Modal>     
        
            {poap &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.POAPS}
                    entityId={poap._id}
                    moderated={poap.moderated}
                    onClose={toggleModerations}
                    
                    
                    
                />
            }
        </>
    )
};

export default Poaps;