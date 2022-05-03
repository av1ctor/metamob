import React, {useState, useCallback, useContext} from "react";
import {useParams} from "react-router-dom";
import {useFindPetitionById} from "../../../hooks/petitions";
import {AuthContext} from "../../../stores/auth";
import {CategoryContext} from "../../../stores/category";
import {TagContext} from "../../../stores/tag";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import Comments from "../../comments/Comments";
import Avatar from "../../users/Avatar";
import EditForm from "./Edit";
import CommentForm from "../../comments/comment/Create";
import Category from "../../categories/Category";
import Tag from "../../tags/Tag";

const Petition = () => {
    const {id} = useParams();
    const [auth] = useContext(AuthContext);
    const [categories] = useContext(CategoryContext);
    const [tags] = useContext(TagContext);
    const [modals, setModals] = useState({
        edit: false,
        reply: false,
        delete: false,
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

    const toggleComment = useCallback(() => {
        setModals({
            ...modals,
            reply: !modals.reply
        });
    }, [modals]);

    const toggleDelete = useCallback(() => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
    }, [modals]);

    const canReply = !petition?.locked && auth.user;
    const canEdit = !petition?.locked && auth.user && auth.user._id === petition?.createdBy;

    return (
        <div>
            <div>
                {petition &&
                    <>
                        <div className="pb-1">
                            <div className="is-size-2">
                                {petition.title}
                            </div>
                            <div>
                                <Category id={petition.categoryId} />
                                {petition.tags.map(id => <Tag key={id} id={id} />)}
                            </div>
                            <div className="flex border-t mt-4 pt-2">
                                <div className="flex-node w-12">
                                    <Avatar id={petition.createdBy} size='lg' />
                                </div>
                                <div className="flex-1"></div>
                                <div className="flex-none w-8 has-text-grey-light">
                                    <TimeFromNow 
                                        date={BigInt.asIntN(64, petition.createdAt)}
                                    />
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex-none w-12"></div>
                                <div className="flex-1 pl-2 pb-12">
                                    {petition.body}
                                </div>
                            </div>
                            <div className="field is-grouped mt-2">
                                {canEdit && 
                                    <>
                                        <div className="control" title="edit">
                                            <Button
                                                onClick={toggleEdit}
                                            >
                                                <i className="la la-pencil" />
                                            </Button>
                                        </div>
                                        <div className="control" title="delete">
                                            <Button
                                                color='danger'
                                                onClick={toggleDelete}
                                            >
                                                <i className="la la-trash" />
                                            </Button>
                                        </div>
                                    </>
                                }
                                {canReply && 
                                    <div className="control" title="comment">
                                        <Button
                                            onClick={toggleComment}>
                                            <span className="whitespace-nowrap"><i className="la la-reply" /> Comment</span>
                                        </Button>
                                    </div>
                                }
                            </div>
                        </div>
                        
                        <Comments 
                            petition={petition} 
                        />
                        
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
                            isOpen={modals.reply}
                            onClose={toggleComment}
                        >
                            <CommentForm 
                                petition={petition} 
                                onCancel={toggleComment}
                            />
                        </Modal>

                        <Modal
                            isOpen={modals.delete}
                            onClose={toggleDelete}
                        >
                            delete
                        </Modal>
                    </>
                }
            </div>
        </div>
    );
};

export default Petition;
  