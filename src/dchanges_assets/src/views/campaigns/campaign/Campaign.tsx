import React, {useState, useCallback, useContext} from "react";
import {useParams} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import {useFindCampaignById} from "../../../hooks/campaigns";
import {AuthContext} from "../../../stores/auth";
import {CategoryContext} from "../../../stores/category";
import {TagContext} from "../../../stores/tag";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import Signatures from "../../signatures/Signatures";
import Avatar from "../../users/Avatar";
import EditForm from "./Edit";
import Category from "../../categories/Category";
import Tag from "../../tags/Tag";
import { CampaignState } from "../../../libs/campaigns";
import SignForm from "./Sign";
import { useFindSignatureByCampaignAndUser } from "../../../hooks/signatures";

const maxTb: number[] = [100, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000];

const calcMaxSignatures = (signatures: number): number => {
    for(let i = 0; i < maxTb.length; i++) {
        if(signatures <= maxTb[i]) {
            return maxTb[i];
        }
    }

    return Number.MAX_SAFE_INTEGER;
}

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Campaign = (props: Props) => {
    const {id} = useParams();
    const [auth] = useContext(AuthContext);
    const [categories] = useContext(CategoryContext);
    const [tags] = useContext(TagContext);
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false
    });
    
    const res = useFindCampaignById(['campaign', id], id || '');
    const campaign = res.status === 'success' && res.data?
        res.data:
        undefined;

    const userSignature = useFindSignatureByCampaignAndUser(
        ['campaign-signature', campaign?._id || 0, auth.user?._id || 0], campaign?._id || -1, auth.user?._id || -1);

    const toggleEdit = useCallback(() => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
    }, [modals]);

    const toggleDelete = useCallback(() => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
    }, [modals]);

    const toggleReport = useCallback(() => {
        setModals({
            ...modals,
            report: !modals.report
        });
    }, [modals]);

    const canEdit = campaign?.state === CampaignState.PUBLISHED && auth.user  && auth.user._id === campaign?.createdBy;

    const goal = calcMaxSignatures(campaign?.signaturesCnt || 0);

    return (
        <article className="media campaign">
            {campaign &&
                <>
                    <div className="media-content">
                        <div className="content">
                            <div className="is-size-2">
                                {campaign.title}
                            </div>
                            <div className="mb-2">
                                <Category id={campaign.categoryId} />
                                {campaign.tags.map(id => <Tag key={id} id={id} />)}
                            </div>
                            <div className="columns">
                                <div className="column is-two-thirds">
                                    <div className="image campaign-cover mb-2">
                                        <img src={campaign.cover || "1280x960.png"} />
                                    </div>
                                    <ReactMarkdown className="campaign-body" children={campaign.body}/>
                                </div>
                                <div className="column">
                                    <progress className="progress mb-0 pb-0" value={campaign.signaturesCnt} max={goal}>{campaign.signaturesCnt}</progress>
                                    <div><small><b>{campaign.signaturesCnt}</b> have signed. Let's get to {goal}!</small></div>
                                    <div className="is-size-4 has-text-link">
                                        To {campaign.target}
                                    </div>

                                    <SignForm 
                                        campaign={campaign}
                                        body={userSignature?.data?.body} 
                                        onSuccess={props.onSuccess}
                                        onError={props.onError}
                                    />
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
                                                title="edit"
                                                onClick={toggleEdit}
                                            >
                                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                            </a>
                                            &nbsp;·&nbsp;
                                            <a
                                                title="delete"
                                                onClick={toggleDelete}
                                            >
                                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                            </a>
                                            &nbsp;·&nbsp;
                                        </>
                                    }
                                    <a
                                        title="report"
                                        onClick={toggleReport}
                                    >
                                        <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <TimeFromNow 
                                        date={BigInt.asIntN(64, campaign.createdAt)}
                                    />
                                </small>
                            </p>                            

                        </div>

                        <div className="tabs is-boxed">
                            <ul>
                                <li className="is-active">
                                    <a>
                                        <span className="icon is-small"><i className="la la-signature"/></span>
                                        <span>Signatures</span>
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <span className="icon is-small"><i className="la la-newspaper"/></span>
                                        <span>Updates</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <Signatures 
                            campaign={campaign} 
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                        />

                    </div>
                    
                    <Modal
                        isOpen={modals.edit}
                        onClose={toggleEdit}
                    >
                        <EditForm 
                            campaign={campaign} 
                            categories={categories.categories} 
                            tags={tags.tags}
                            onCancel={toggleEdit}
                            onSuccess={props.onSuccess}
                            onError={props.onError}
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
                </>
            }
        </article>
    );
};

export default Campaign;
  