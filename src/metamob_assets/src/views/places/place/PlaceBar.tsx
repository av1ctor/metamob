import React, { useCallback, useContext, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useFindByPlaceAndUser } from "../../../hooks/places-users";
import { AuthContext } from "../../../stores/auth";
import { PlaceIcon } from "./PlaceIcon";
import TermsForm from "./TermsForm";

interface Props {
    place?: Place;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const PlaceBar = (props: Props) => {
    const [authState, ] = useContext(AuthContext);

    const [modals, setModals] = useState({
        terms: false,
    });

    const navigate = useNavigate();
    const location = useLocation();

    const toggleTerms = useCallback(() => {
        setModals(modals => ({
            ...modals,
            terms: !modals.terms
        }));
    }, []);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=${location.pathname}`);
    }, []);
    
    const {place} = props;

    const placeUser = useFindByPlaceAndUser(place?._id, authState.user?._id);

    const hasTerms = place && place.terms.length > 0;
    const termsAccepted = hasTerms && placeUser && placeUser.data && placeUser.data.termsAccepted;

    const isLoggedIn = !!authState.user;

    return (
        <>
            <div 
                className="place-bar has-text-primary-dark"
                style={{backgroundImage: `url(${place?.banner[0]})`}}
            >
                <div className="level">
                    <div className="level-left">
                        <PlaceIcon 
                            place={place} 
                            size="lg"
                        />
                        <div className="place-name ml-4">
                            {place? place.name: <Skeleton width={100} />}
                        </div>
                    </div>
                    {hasTerms &&
                        <div className="level-right place-buttons">
                            <div>
                                <Button
                                    color={termsAccepted? 'primary': 'danger'}
                                    title="View terms and conditions"
                                    onClick={isLoggedIn? toggleTerms: redirectToLogon}
                                >
                                    <i className={`la la-${termsAccepted? 'check-square': 'align-left'}`}/>&nbsp;Terms
                                </Button>
                            </div>
                        </div>
                    }
                </div>
            </div>

            <Modal
                header={<span>Terms & Conditions</span>}
                isOpen={modals.terms}
                onClose={toggleTerms}
            >
                {place &&
                    <TermsForm
                        place={place}
                        placeUser={placeUser.data}
                        onClose={toggleTerms}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>            
        </>
    );
};