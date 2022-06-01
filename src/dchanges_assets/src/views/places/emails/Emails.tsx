import React, {useState, useCallback, useEffect, useContext} from "react";
import { Place } from "../../../../../declarations/dchanges/dchanges.did";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useDeletePlaceEmail, useFindPlacesEmails } from "../../../hooks/places-emails";
import { ActorContext } from "../../../stores/actor";
import Create from "./Create";

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const limit = {
    offset: 0,
    size: 10
};

interface Props {
    place: Place;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const PlaceEmails = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);

    const [modals, setModals] = useState({
        create: false,
        delete: false,
    });

    const emails = useFindPlacesEmails(props.place._id, orderBy, limit, actorState.main);
    const deleteMut = useDeletePlaceEmail();

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const toggleDelete = useCallback(() => {
        setModals(modals => ({
            ...modals,
            delete: !modals.delete
        }));
    }, []);

    const handleCreated = useCallback((message: string) => {
        toggleCreate();
        props.onSuccess(message);
        emails.refetch();
    }, [props.onSuccess]);

    const handleDelete = useCallback(async (_id: number) => {
        try
        {
            props.toggleLoading(true);

            await deleteMut.mutateAsync({
                main: actorState.main,
                _id: _id
            });
            props.onSuccess("E-mail deleted!")
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
        
    }, []);
    
    useEffect(() => {
        props.toggleLoading(emails.status === "loading");
        if(emails.status === "error") {
            props.onError(emails.error.message);
        }
    }, [emails.status]);

    return (
        <>
            <div className="tabled">
                <div className="header">
                    <div className="columns">
                        <div className="column">
                            E-mail
                        </div>
                    </div>
                </div>
                <div className="body">
                    {emails.isSuccess && emails.data && 
                        emails.data.map((item, index) => 
                            <div 
                                className="columns is-mobile" 
                                key={index}
                            >
                                <div className="column">
                                    {item.email}
                                </div>
                                <div className="column is-1">
                                    <Button
                                        color="danger"
                                        small
                                        title="Delete"
                                        onClick={() => handleDelete(item._id)}
                                    >
                                            <i className="la la-times-circle"/>
                                    </Button>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
            <div className="level mt-5">
                <div className="level-left">
                </div>
                <div className="level-right">
                    <Button
                        onClick={toggleCreate}
                    >
                        <i className="la la-plus-circle" />&nbsp;Create
                    </Button>
                </div>
            </div>

            <Modal
                header={<span>Create e-mail</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <Create
                    place={props.place}
                    onClose={toggleCreate}
                    onSuccess={handleCreated}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default PlaceEmails;
  