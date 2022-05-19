import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Place } from "../../../../../declarations/dchanges/dchanges.did";

interface Props {
    place?: Place;
}

export const PlaceButton = (props: Props) => {
    
    const {place} = props;

    const navigate = useNavigate();

    const handleRedirect = useCallback(() => {
        if(props.place) {
            navigate(`/p/${props.place.pubId}`);
        }
    }, [props.place]);

    if(!place) {
        return null;
    }
    
    return (
        <div 
            className="place-button has-text-primary-dark is-clickable" 
            onClick={handleRedirect}
        >
            <div className="place-icon">
                <i className={`la la-${place.icon || 'map'}`} />
            </div>
            <div className="place-name">
                {place.name}
            </div>
        </div>
    );
};