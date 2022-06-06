import React, {useState, useCallback, useContext} from "react";
import {useParams} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import {useFindCampaignByPubId} from "../../../hooks/campaigns";
import {AuthContext} from "../../../stores/auth";
import {CategoryContext} from "../../../stores/category";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import {SignFrame} from "./kinds/SignFrame";
import Signatures from "../../signatures/Signatures";
import {VoteFrame} from "./kinds/VoteFrame";
import Votes from "../../votes/Votes";
import Updates from "../../updates/Updates";
import Avatar from "../../users/Avatar";
import EditForm from "./Edit";
import Category from "../../categories/category/Category";
import Tag from "../../../components/Tag";
import { CampaignKind, CampaignState } from "../../../libs/campaigns";
import ReportForm from "../../reports/report/Create";
import Tabs from "../../../components/Tabs";
import { ReportType } from "../../../libs/reports";
import PlaceTree from "../../places/place/PlaceTree";
import { isModerator } from "../../../libs/users";
import DeleteForm from "./Delete";
import Donations from "../../donations/Donations";
import { DonationFrame } from "./kinds/DonationFrame";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Campaign = (props: Props) => {
    const {id} = useParams();
    const [auth] = useContext(AuthContext);
    const [categories] = useContext(CategoryContext);
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false
    });
    
    const res = useFindCampaignByPubId(id);
    const campaign = res.status === 'success' && res.data?
        res.data:
        undefined;

    const toggleEdit = useCallback(() => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
    }, []);

    const toggleDelete = useCallback(() => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
    }, []);

    const toggleReport = useCallback(() => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
    }, []);

    const canEdit = (campaign?.state === CampaignState.PUBLISHED && 
        auth.user && auth.user._id === campaign?.createdBy) ||
        (auth.user && isModerator(auth.user));

    if(!campaign) {
        return null;
    }

    return (
        <>
            <div className="container mb-2">
                <div className="is-size-2 overflow-hidden">
                    {campaign.title}
                </div>
                <div className="overflow-hidden">
                    <Category id={campaign.categoryId} />
                    {campaign.tags.map(id => <Tag key={id} id={id} />)}
                </div>
                <div className="mt-1 mb-2 overflow-hidden">
                    <PlaceTree id={campaign.placeId} />
                </div>
                <div className="columns">
                    <div className="column is-two-thirds overflow-hidden">
                        <div className="image campaign-cover mb-2">
                            <img src={campaign.cover} />
                        </div>
                        <ReactMarkdown className="campaign-body" children={campaign.body}/>
                    </div>
                    <div className="column">
                        {campaign.kind === CampaignKind.SIGNATURES &&
                            <SignFrame
                                campaign={campaign} 
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                                toggleLoading={props.toggleLoading}
                            />
                        }
                        {(campaign.kind === CampaignKind.VOTES || campaign.kind === CampaignKind.WEIGHTED_VOTES) &&
                            <VoteFrame 
                                campaign={campaign} 
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                                toggleLoading={props.toggleLoading}
                            />
                        }
                        {campaign.kind === CampaignKind.DONATIONS &&
                            <DonationFrame
                                campaign={campaign} 
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                                toggleLoading={props.toggleLoading}
                            />
                        }
                    </div>
                </div>
                <div className="mt-4 pt-2 mb-2">
                    <Avatar id={campaign.createdBy} size='lg' />
                </div>
                <p>
                    <small>
                        {canEdit &&
                            <>
                                <a
                                    title="Edit campaign"
                                    onClick={toggleEdit}
                                >
                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                </a>
                                &nbsp;·&nbsp;
                                <a
                                    title="Delete campaign"
                                    onClick={toggleDelete}
                                >
                                    <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                </a>
                                &nbsp;·&nbsp;
                            </>
                        }
                        {auth.user && 
                            <>
                                <a
                                    title="Report campaign"
                                    onClick={toggleReport}
                                >
                                    <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                                </a>
                                &nbsp;·&nbsp;
                            </>
                        }
                        <TimeFromNow 
                            date={BigInt.asIntN(64, campaign.createdAt)}
                        />
                        {campaign.updatedBy && campaign.updatedBy.length > 0 &&
                            <>
                                &nbsp;·&nbsp;<b><i>Edited</i></b>
                            </>
                        }
                    </small>
                </p>                            

            </div>
            
            <Tabs
                tabs={[
                    {
                        title: campaign.kind === CampaignKind.SIGNATURES? 
                            'Signatures': 
                            campaign.kind === CampaignKind.DONATIONS?
                                'Donations':
                                'Votes', 
                        icon: campaign.kind === CampaignKind.SIGNATURES? 
                            'signature':
                            campaign.kind === CampaignKind.DONATIONS?
                                'money-bill':
                                'vote-yea'
                    },
                    {
                        title: 'Updates', 
                        icon: 'newspaper', 
                        badge: campaign.updates > 0? campaign.updates.toString(): ''
                    }
                ]}
            >
                {campaign.kind === CampaignKind.SIGNATURES?
                    <Signatures 
                        campaign={campaign} 
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                :
                    (campaign.kind === CampaignKind.VOTES || campaign.kind === CampaignKind.WEIGHTED_VOTES)?
                        <Votes 
                            campaign={campaign} 
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                            toggleLoading={props.toggleLoading}
                        />
                    :
                        campaign.kind === CampaignKind.DONATIONS?
                            <Donations 
                                campaign={campaign} 
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                                toggleLoading={props.toggleLoading}
                            />
                        :
                            <div></div>
                }
                <Updates
                    campaign={campaign} 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Tabs>

            <Modal
                header={<span>Edit campaign</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                <EditForm 
                    campaign={campaign} 
                    categories={categories.categories} 
                    onClose={toggleEdit}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <Modal
                header={<span>Delete campaign</span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                <DeleteForm 
                    campaign={campaign} 
                    onClose={toggleDelete}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <Modal
                header={<span>Report campaign</span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                <ReportForm
                    entityId={campaign._id}
                    entityType={ReportType.CAMPAIGNS}
                    onClose={toggleReport}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default Campaign;
  