import React, { useCallback, useContext, useState } from "react";
import Modal from "../../../components/Modal";
import { AuthContext } from "../../../stores/auth";
import { FormattedMessage } from "react-intl";
import { ActorContext } from "../../../stores/actor";
import { useDeleteNotification, useFindNotificationsByUser, useMarkAsReadNotification } from "../../../hooks/notifications";
import { Notification } from "../../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../../components/TimeFromNow";
import { Order } from "../../../libs/common";
import { Paginator } from "../../../components/Paginator";
import Container from "../../../components/Container";
import Button from "../../../components/Button";

const sortByDate: Order[] = [
    {
        key: '_id',
        dir: 'desc'
    }
];

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Notifications = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 8
    });const [modals, setModals] = useState({
        delete: false,
    });
    const [notification, setNotification] = useState<Notification>();

    const notifications = useFindNotificationsByUser(sortByDate, limit, actors.main);
    const markMut = useMarkAsReadNotification();
    const deleteMut = useDeleteNotification();

    const handleMark = useCallback(async (notif: Notification) => {
        try {
            props.toggleLoading(true);
            await markMut.mutateAsync({main: actors.main, pubId: notif.pubId});
            props.onSuccess("Notification marked as read!");
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [actors.main]);

    const handleDelete = useCallback(async () => {
        if(!notification) {
            return;
        }
        
        try {
            props.toggleLoading(true);
            
            await deleteMut.mutateAsync({
                main: actors.main, 
                pubId: notification.pubId
            });
            
            props.onSuccess("Notification deleted!");
            handleCloseDelete();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [actors.main, notification]);

    const toggleDelete = useCallback((notif?: Notification) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setNotification(notif);
    }, []);

    const handleCloseDelete = useCallback((event?: any) => {
        if(event) {
            event.preventDefault();
        }
        toggleDelete();
    }, []);

    const handlePrevPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: Math.max(0, limit.offset - limit.size)|0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: limit.offset + limit.size
        }));
    }, []);

    if(!auth.user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="Notifications" />
            </div>

            <div>
                <div className="notifications columns is-multiline">
                    {notifications.status === 'success' && 
                        notifications.data && 
                            notifications.data.map((notif) => 
                        <div
                            key={notif._id}
                            className="column is-6"
                        >
                            <div className="notification-title">{notif.title}</div>
                            <div className="notification-body">{notif.body}</div>

                            <p>
                                    <small>
                                        {notif.readAt.length === 0 &&
                                            <>
                                                <a
                                                title="Mark as read"
                                                onClick={() => handleMark(notif)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-check-square" /> <FormattedMessage id="Mark as read" defaultMessage="Mark as read"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                            </>
                                        }
                                        <a
                                            title="Delete notification"
                                            onClick={() => toggleDelete(notif)}
                                        >
                                            <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
                                        </a>
                                        &nbsp;·&nbsp;
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, notif.createdAt)}
                                        />
                                    </small>
                                </p>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={notifications.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete notification"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
                <form onSubmit={handleDelete}>
                    <Container>
                        <div className="has-text-centered">
                            <p><FormattedMessage defaultMessage="Are you sure you want to delete this notification?"/></p>
                            <p className="has-text-danger"><FormattedMessage defaultMessage="This action can not be reverted!"/></p>
                        </div>
                        <div className="field is-grouped mt-2">
                            <div className="control">
                                <Button
                                    color="danger"
                                    disabled={deleteMut.isLoading}
                                    onClick={handleDelete}
                                >
                                    <FormattedMessage id="Delete" defaultMessage="Delete"/>
                                </Button>
                            </div>
                            <div className="control">
                                <Button
                                    onClick={handleCloseDelete}
                                >
                                    <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                                </Button>
                            </div>
                        </div>
                    </Container>
                </form>
            </Modal>
        </>
    );
};

export default Notifications;