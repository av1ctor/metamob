import React, {useState, useCallback, useContext} from "react";
import {useParams} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import {useFindPetitionById} from "../../../hooks/petitions";
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
import { PetitionState } from "../../../interfaces/common";

const Petition = () => {
    const {id} = useParams();
    const [auth] = useContext(AuthContext);
    const [categories] = useContext(CategoryContext);
    const [tags] = useContext(TagContext);
    const [modals, setModals] = useState({
        edit: false,
        delete: false,
        report: false
    });
    
    const res = useFindPetitionById(['petition', id], id || '');
    const petition = res.status === 'success' && res.data?
        res.data:
        undefined;

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

    const canEdit = petition?.state === PetitionState.CREATED && auth.user && auth.user._id === petition?.createdBy;

    return (
        <article className="media">
            {petition &&
                <>
                    <div className="media-content">
                        <div className="content">
                            <div className="is-size-2">
                                {petition.title}
                            </div>
                            <div>
                                <Category id={petition.categoryId} />
                                {petition.tags.map(id => <Tag key={id} id={id} />)}
                            </div>
                            <div className="columns">
                                <div className="column is-full">
                                    {petition.target}
                                </div>
                            </div>
                            <div className="columns">
                                <div className="column is-two-thirds">
                                    <div className="image is-4by3 mb-2">
                                        <img src={petition.cover || "1280x960.png"} />
                                    </div>
                                    <ReactMarkdown className="petition-body" children={petition.body}/>
                                </div>
                                <div className="column">
                                    Sign now
                                </div>
                            </div>
                            <div className="mt-4 pt-2 mb-2">
                                <Avatar id={petition.createdBy} size='lg' />
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
                                        date={BigInt.asIntN(64, petition.createdAt)}
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
                            petition={petition} 
                        />

                    </div>
                    
                    <Modal
                        isOpen={modals.edit}
                        onClose={toggleEdit}
                    >
                        <EditForm 
                            petition={petition} 
                            categories={categories.categories} 
                            tags={tags.tags}
                            onCancel={toggleEdit}
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

export default Petition;
  