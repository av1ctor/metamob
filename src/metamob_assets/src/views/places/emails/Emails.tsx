import React, {useState, useCallback, useEffect, useContext} from "react";
import { FormattedMessage } from "react-intl";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useDeletePlaceEmail, useFindPlacesEmails } from "../../../hooks/places-emails";
import { useUI } from "../../../hooks/ui";
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

}

const PlaceEmails = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();

    const [modals, setModals] = useState({
        create: false,
        delete: false,
    });

    const emails = useFindPlacesEmails(props.place._id, orderBy, limit);
    const deleteMut = useDeletePlaceEmail();

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const handleDelete = useCallback(async (_id: number) => {
        try
        {
            toggleLoading(true);

            await deleteMut.mutateAsync({_id: _id});
            showSuccess("E-mail deleted!")
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
        
    }, []);
    
    useEffect(() => {
        toggleLoading(emails.status === "loading");
        if(emails.status === "error") {
            showError(emails.error.message);
        }
    }, [emails.status]);

    return (
        <>
            <div className="tabled">
                <div className="header">
                    <div className="columns">
                        <div className="column">
                            <FormattedMessage id="E-mail" defaultMessage="E-mail"/>
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
                                        size="small"
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
                        <i className="la la-plus-circle" />&nbsp;<FormattedMessage id="Create" defaultMessage="Create"/>
                    </Button>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create e-mail"/></span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <Create
                    place={props.place}
                    onClose={toggleCreate}
                />
            </Modal>
        </>
    );
};

export default PlaceEmails;
  