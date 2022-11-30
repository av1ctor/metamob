import React, {useState, useCallback, useContext, useEffect} from "react";
import {useParams} from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import {useFindCampaignByPubId} from "../../../hooks/campaigns";
import {CategoryContext} from "../../../stores/category";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import Updates from "../../updates/Updates";
import Avatar from "../../users/Avatar";
import EditForm from "./Edit";
import Category from "../../categories/category/Category";
import Tag from "../../../components/Tag";
import { CampaignKind, campaignKindToIcon, campaignKindToTitle, CampaignState } from "../../../libs/campaigns";
import ReportForm from "../../reports/report/Create";
import Tabs from "../../../components/Tabs";
import { EntityType } from "../../../libs/common";
import PlaceTree from "../../places/place/PlaceTree";
import DeleteForm from "./Delete";
import Signatures from "../../signatures/Signatures";
import {SignFrame} from "./kinds/signatures/Frame";
import Votes from "../../votes/Votes";
import {VoteFrame} from "./kinds/votes/Frame";
import Donations from "../../donations/Donations";
import { DonationFrame } from "./kinds/donations/Frame";
import Fundings from "../../fundings/Fundings";
import { FundingFrame } from "./kinds/fundings/Frame";
import { Markdown } from "../../../components/Markdown";
import { ScrollToTop } from "../../../components/ScrollToTop";
import ModerationBadge from "../../moderations/moderation/Badge";
import ModerationModal from "../../moderations/Modal";
import { FormattedMessage, useIntl } from "react-intl";
import Box from "../../../components/Box";
import Boost from "./Boost";
import Share from "./Share";
import Result from "./Result";
import Poaps from "../../poaps/Poaps";
import Cover from "./Cover";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";

interface Props {
}

const Campaign = (props: Props) => {
    const {id} = useParams();
    const {user} = useAuth();
    const [categories] = useContext(CategoryContext);
    const intl = useIntl();

    const {toggleLoading, showError} = useUI();
    
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false,
        moderations: false
    });
    
    const campaignReq = useFindCampaignByPubId(id);

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

    const toggleModerations = useCallback(() => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
    }, []);

    useEffect(() => {
        toggleLoading(campaignReq.status === "loading");
        if(campaignReq.status === "error") {
            showError(campaignReq.error.message);
        }
    }, [campaignReq.status]);

    const campaign = campaignReq.status === 'success' && campaignReq.data?
        campaignReq.data:
        undefined;

    const canEdit = campaign?.state === CampaignState.PUBLISHED && 
        user && user._id === campaign?.createdBy;

    return (
        <>
            <ScrollToTop />
            <div className="container mb-2">
                <div className="is-size-2 overflow-hidden">
                    {campaign? <span>{campaign.title}</span>: <Skeleton />}
                </div>
                <div className="overflow-hidden is-flex">
                    <Category id={campaign?.categoryId} />
                    {campaign? 
                        campaign.tags.map(id => <Tag key={id} id={id} />): 
                        <>
                            <Skeleton className="ml-2 mr-2" width={60} />
                            <Skeleton width={50} /></>
                    }
                </div>
                <div className="mt-1 mb-2 overflow-hidden">
                    {campaign? 
                        <PlaceTree id={campaign.placeId} />: 
                        <div className="is-flex">
                            <Skeleton width={60} />&nbsp;/&nbsp;<Skeleton width={50} />
                        </div>
                    }
                </div>
                <div className="columns">
                    <div className="column is-two-thirds overflow-hidden">
                        <div className="image campaign-cover mb-2">
                            {campaign? <Cover cover={campaign.cover} />: <Skeleton height={450} />}
                        </div>
                        {campaign? 
                            <>
                                <div className="has-text-right">
                                    <ModerationBadge 
                                        reason={campaign.moderated}
                                        isLarge
                                        onShowModerations={toggleModerations} 
                                    />
                                </div>
                                <Markdown 
                                    className="campaign-body" 
                                    body={campaign.body}
                                />
                            </>:
                            <>
                                <Skeleton count={3} />
                                <br/>
                                <Skeleton count={4} />
                                <br/>
                                <Skeleton count={2} />
                            </>
                        }
                    </div>
                    <div className="column">
                        {campaign?
                            <>
                                {campaign.kind === CampaignKind.SIGNATURES &&
                                    <SignFrame
                                        campaign={campaign} 
                                    />
                                }
                                {(campaign.kind === CampaignKind.VOTES || campaign.kind === CampaignKind.WEIGHTED_VOTES) &&
                                    <VoteFrame 
                                        campaign={campaign} 
                                    />
                                }
                                {campaign.kind === CampaignKind.FUNDINGS &&
                                    <FundingFrame
                                        campaign={campaign} 
                                    />
                                }
                                {campaign.kind === CampaignKind.DONATIONS &&
                                    <DonationFrame
                                        campaign={campaign} 
                                    />
                                }
                                {campaign.state === CampaignState.PUBLISHED? 
                                    <>
                                        <Box>
                                            <Boost 
                                                campaign={campaign} 
                                            />
                                        </Box>
                                        <Box>
                                            <Poaps
                                                campaign={campaign}
                                            />
                                        </Box>
                                        <Box>
                                            <Share
                                                campaign={campaign}
                                            />
                                        </Box>
                                    </>
                                :
                                    <Result
                                        campaign={campaign} 
                                    />
                                }
                            </>:
                            <>
                                <Skeleton count={2} />
                                <div className="mt-2" />
                                <Skeleton height={300} />
                                <div className="mt-2" />
                                <Skeleton height={250} />
                                <div className="mt-2" />
                                <Skeleton height={125} />
                            </>
                        }
                    </div>
                </div>
                
                {campaign?
                    <>
                        <div className="mt-4 pt-2 mb-2">
                            <Avatar 
                                id={campaign.createdBy} 
                                size='lg' 
                            />
                        </div>
                        <p>
                            <small>
                                {canEdit?
                                    <>
                                        <a
                                            title={intl.formatMessage({id: "Edit campaign", defaultMessage: "Edit campaign"})}
                                            onClick={toggleEdit}
                                        >
                                            <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage defaultMessage="Edit"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <a
                                            title={intl.formatMessage({id: "Delete campaign", defaultMessage: "Delete campaign"})}
                                            onClick={toggleDelete}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage defaultMessage="Delete"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                    </>
                                :
                                    null
                                }
                                {user && 
                                    <>
                                        <a
                                            title={intl.formatMessage({id: "Report campaign", defaultMessage: "Report campaign"})}
                                            onClick={toggleReport}
                                        >
                                            <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> <FormattedMessage defaultMessage="Report"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                    </>
                                }
                                
                                <TimeFromNow 
                                    date={BigInt.asIntN(64, campaign.createdAt)}
                                />

                                {campaign.updatedBy && campaign.updatedBy.length > 0 &&
                                    <>
                                        &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                                    </>
                                }
                            </small>
                        </p>                            
                    </>:
                    <>
                        <div className="is-flex">
                            <Skeleton width={50} height={50} />
                            <Skeleton className="ml-2 mt-4" width={150} />
                        </div>
                        <br/>
                        <div className="is-flex">
                            <Skeleton width={60} />&nbsp;·&nbsp;<Skeleton width={60} />&nbsp;·&nbsp;<Skeleton width={60} />
                        </div>
                    </>
                }

            </div>

            {campaign &&
                <>
                    <Tabs
                        tabs={[
                            {
                                title: intl.formatMessage({id: campaignKindToTitle(campaign.kind), defaultMessage: campaignKindToTitle(campaign.kind)}), 
                                icon: campaignKindToIcon(campaign.kind),
                            },
                            {
                                title: intl.formatMessage({id: "Updates", defaultMessage: 'Updates'}), 
                                icon: 'newspaper', 
                                badge: campaign.updates > 0? campaign.updates.toString(): ''
                            }
                        ]}
                    >
                        {campaign.kind === CampaignKind.SIGNATURES?
                            <Signatures 
                                campaign={campaign} 
                            />
                        :
                            (campaign.kind === CampaignKind.VOTES || campaign.kind === CampaignKind.WEIGHTED_VOTES)?
                                <Votes 
                                    campaign={campaign} 
                                />
                            :
                                campaign.kind === CampaignKind.DONATIONS?
                                    <Donations 
                                        campaign={campaign} 
                                    />
                                :
                                    campaign.kind === CampaignKind.FUNDINGS?
                                        <Fundings 
                                            campaign={campaign} 
                                        />
                                    :
                                        <div></div>
                        }
                        <Updates
                            campaign={campaign} 
                        />
                    </Tabs>

                    <Modal
                        header={<span><FormattedMessage defaultMessage="Edit campaign"/></span>}
                        isOpen={modals.edit}
                        onClose={toggleEdit}
                    >
                        <EditForm 
                            campaign={campaign} 
                            categories={categories.categories} 
                            onClose={toggleEdit}
                        />
                    </Modal>

                    <Modal
                        header={<span><FormattedMessage defaultMessage="Delete campaign"/></span>}
                        isOpen={modals.delete}
                        onClose={toggleDelete}
                    >
                        <DeleteForm 
                            campaign={campaign} 
                            onClose={toggleDelete}
                        />
                    </Modal>

                    <Modal
                        header={<span><FormattedMessage defaultMessage="Report campaign"/></span>}
                        isOpen={modals.report}
                        onClose={toggleReport}
                    >
                        <ReportForm
                            entityId={campaign._id}
                            entityPubId={campaign.pubId}
                            entityType={EntityType.CAMPAIGNS}
                            onClose={toggleReport}
                        />
                    </Modal>

                    <ModerationModal
                        isOpen={modals.moderations}
                        entityType={EntityType.CAMPAIGNS}
                        entityId={campaign._id}
                        moderated={campaign.moderated}
                        onClose={toggleModerations}
                    />
                </>
            }
        </>
    );
};

export default Campaign;
