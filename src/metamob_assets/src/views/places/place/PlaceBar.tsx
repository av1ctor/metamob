import React, { useCallback, useContext, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useFindByPlaceAndUser } from "../../../hooks/places-users";
import { EntityType } from "../../../libs/common";
import { AuthContext } from "../../../stores/auth";
import { PlaceIcon } from "./PlaceIcon";
import TermsForm from "./TermsForm";
import ReportForm from "../../reports/report/Create";
import ModerationBadge from "../../moderations/moderation/Badge";
import ModerationModal from "../../moderations/Modal";
import EditForm from "./Edit";
import { FormattedMessage } from "react-intl";
import PlaceTree from "./PlaceTree";

interface Props {
    place?: Place;
    onTogglePlaces: () => void;
}

export const PlaceBar = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const [modals, setModals] = useState({
        edit: false,
        terms: false,
        report: false,
        moderations: false,
    });

    const navigate = useNavigate();
    const location = useLocation();

    const toggleEdit = useCallback(() => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit,
        }));
    }, []);
    
    const toggleTerms = useCallback(() => {
        setModals(modals => ({
            ...modals,
            terms: !modals.terms,
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

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=${location.pathname}`);
    }, []);
    
    const {place} = props;

    const placeUser = useFindByPlaceAndUser(place?._id, auth.user?._id);

    const hasTerms = place && place.terms.length > 0;
    const termsAccepted = hasTerms && placeUser && placeUser.data && placeUser.data.termsAccepted;

    const isLoggedIn = !!auth.user;
    const canEdit = auth.user && 
        (auth.user._id === place?.createdBy);

    const banner = place?.banner[0] || '';

    return (
        <>
            <div 
                className="place-bar has-text-primary-dark"
                style={banner? {backgroundImage: `url(${banner})`}: undefined}
            >
                <div className="level">
                    <div className="level-left">
                        <PlaceIcon 
                            place={place} 
                            size="lg"
                        />
                        <div className="place-name ml-4">
                            <span>{place? place.name: <Skeleton width={100} />}</span>
                            <PlaceTree 
                                id={place? place._id: 0} 
                                skipLast
                            />
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
                                    <i className={`la la-${termsAccepted? 'check-square': 'align-left'}`}/>&nbsp;<FormattedMessage id="Terms" defaultMessage="Terms"/>
                                </Button>
                            </div>
                        </div>
                    }
                </div>

                <div className="level place-info">
                    <div className="level-left">
                        {place &&
                            <ModerationBadge
                                reason={place.moderated}
                                onShowModerations={toggleModerations} 
                            />
                        }
                    </div>
                    <div className="level-right">
                        <a
                            className="link-places"
                            title="Toggle children places"
                            onClick={props.onTogglePlaces}
                        >
                            <span className="whitespace-nowrap"><i className="la la-globe" /> <FormattedMessage id="Places" defaultMessage="Places"/></span>
                        </a>
                        {canEdit && 
                            <>
                                &nbsp;·&nbsp;
                                <a
                                    className="link-edit"
                                    title="Edit place"
                                    onClick={toggleEdit}
                                >
                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                </a>
                                &nbsp;·&nbsp;
                            </>
                        }
                        {isLoggedIn &&
                            <a
                                className="link-report"    
                                title="Report place"
                                onClick={toggleReport}
                            >
                                <span className="whitespace-nowrap"><i className="la la-flag" /> <FormattedMessage id="Report" defaultMessage="Report"/></span>
                            </a>
                        }
                    </div>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Edit place"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {place &&
                    <EditForm
                        place={place}
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Terms & Conditions"/></span>}
                isOpen={modals.terms}
                onClose={toggleTerms}
            >
                {place &&
                    <TermsForm
                        place={place}
                        placeUser={placeUser.data}
                        onClose={toggleTerms}
                        
                        
                        
                    />
                }
            </Modal>

            <Modal
                header={<span><FormattedMessage defaultMessage="Report place"/></span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                {place &&
                    <ReportForm
                        entityId={place._id}
                        entityPubId={place.pubId}
                        entityType={EntityType.PLACES}
                        onClose={toggleReport}
                        
                        
                        
                    />
                }
            </Modal>

            {place &&
                <ModerationModal
                    isOpen={modals.moderations}
                    entityType={EntityType.PLACES}
                    entityId={place._id}
                    moderated={place.moderated}
                    onClose={toggleModerations}
                    
                    
                    
                />
            }
        </>
    );
};