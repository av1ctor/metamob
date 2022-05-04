import React, {useState, useCallback, useContext} from "react";
import {Comment, Petition} from '../../../../declarations/dchanges/dchanges.did';
import {Limit, Order} from "../../interfaces/common";
import {useFindCommentsByPetition} from "../../hooks/comments";
import { Item } from "./Item";
import { AuthContext } from "../../stores/auth";
import Modal from "../../components/Modal";
import EditForm from "./comment/Edit";
import ReplyForm from "./comment/Create";

interface Props {
    petition: Petition;
};

const Comments = (props: Props) => {
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
    const [comment, setComment] = useState<Comment | undefined>(undefined);

    const petition = props.petition;

    const queryKey = ['comments', petition._id, orderBy.key, orderBy.dir];

    const comments = useFindCommentsByPetition(queryKey, petition._id, orderBy, limit);

    const canReply = !petition?.locked && auth.user;
    const canEdit = !petition?.locked && auth.user && auth.user._id === petition?.createdBy;

    const reorderComments = useCallback((orderBy: React.SetStateAction<Order>) => {
        setOrderBy(orderBy);
    }, [orderBy]);

    const toggleEdit = useCallback((comment: Comment | undefined = undefined) => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
        setComment(comment);
    }, [modals, comment]);

    const toggleReply = useCallback((comment: Comment | undefined = undefined) => {
        setModals({
            ...modals,
            reply: !modals.reply
        });
        setComment(comment);
    }, [modals, comment]);

    const toggleDelete = useCallback((comment: Comment | undefined = undefined) => {
        setModals({
            ...modals,
            delete: !modals.delete
        });
        setComment(comment);
    }, [modals, comment]);

    const toggleReport = useCallback((comment: Comment | undefined = undefined) => {
        setModals({
            ...modals,
            report: !modals.report
        });
        setComment(comment);
    }, [modals, comment]);

    return (
        <div className="comments">
            {comments.status === 'success' && comments.data? 
                comments.data.map((comment) => 
                    <Item
                        key={comment._id} 
                        comment={comment}
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
                {comment && 
                    <EditForm
                        comment={comment} 
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
                    body={comment?.body} 
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

export default Comments;