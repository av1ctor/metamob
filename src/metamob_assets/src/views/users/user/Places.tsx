import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserPlaces } from "../../../hooks/places";
import PlaceEmails from "../../places/emails/Emails";
import EditForm from "../../places/place/Edit";
import CreateForm from '../../places/place/Create';
import Button from "../../../components/Button";
import { Paginator } from "../../../components/Paginator";
import { PlaceIcon } from "../../places/place/PlaceIcon";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Places = (props: Props) => {
    const {user} = useAuth();

    const {toggleLoading, showError} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        editEmails: false,
    });
    const [place, setPlace] = useState<Place>();

    const places = useFindUserPlaces(user?._id || 0, orderBy, limit);

    const navigate = useNavigate();

    const handleRedirect = useCallback((place: Place) => {
        navigate(`/p/${place.pubId}`);
    }, []);

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const toggleEdit = useCallback((place: Place | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setPlace(place);
    }, []);

    const toggleDelete = useCallback((place: Place | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
        setPlace(place);
    }, []);

    const toggleEditEmails = useCallback((place: Place | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            editEmails: !modals.editEmails
        }));
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

    useEffect(() => {
        toggleLoading(places.status === "loading");
        if(places.status === "error") {
            showError(places.error.message);
        }
    }, [places.status]);
    
    if(!user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="My places"/>
            </div>
            
            <div className="level">
                <div className="level-left">
                </div>
                <div className="level-right">
                    <Button 
                        title="Create a new place"
                        onClick={toggleCreate}
                    >
                        <i className="la la-plus-circle" />&nbsp;<FormattedMessage id="Create" defaultMessage="Create"/>
                    </Button>
                </div>
            </div>
            
            <div className="user-places">
                <div className="columns is-multiline is-align-items-center">
                    {places.status === 'success' && 
                        places.data && 
                            places.data.map((place) => 
                        <div 
                            key={place._id} 
                            className="column is-6-desktop"
                        >
                            <article className="media">
                                <div className="media-left">
                                    <div className="place-icon has-text-primary-dark">
                                        <PlaceIcon place={place} size="lg" />
                                    </div>
                                </div>
                                <div className="media-content">
                                    <div className="content">
                                        <strong>{place.name}</strong>
                                        <p>{place.description}</p>
                                        <p>
                                            <small>
                                                <a
                                                    title="View place"
                                                    onClick={() => handleRedirect(place)}
                                                >
                                                    <span className="whitespace-nowrap has-text-primary-dark"><i className="la la-eye" /> <FormattedMessage id="View" defaultMessage="View"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                                <a
                                                    title="Edit place"
                                                    onClick={() => toggleEdit(place)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                                <a
                                                    title="Delete place"
                                                    onClick={() => toggleDelete(place)}
                                                >
                                                    <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage defaultMessage="Delete"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                                <TimeFromNow 
                                                    date={BigInt.asIntN(64, place.createdAt)}
                                                />
                                            </small>
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={places.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create place"/></span>}
                isOpen={modals.create}
                isOverOtherModal={true}
                onClose={toggleCreate}
            >
                <CreateForm 
                    onClose={toggleCreate}
                />
            </Modal>            
            
            <Modal
                header={<span><FormattedMessage defaultMessage="Edit place"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {place && 
                    <EditForm
                        place={place} 
                        onEditEmails={toggleEditEmails}
                        onClose={toggleEdit}
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Delete place"/></span>}
                isOpen={modals.delete}
                onClose={toggleDelete}
            >
            </Modal> 

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit place e-mails"/></span>}
                isOpen={modals.editEmails}
                onClose={toggleEditEmails}
            >
                {place && 
                    <PlaceEmails
                        place={place}
                    />
                }
            </Modal> 
        </>    
    );
};

export default Places;