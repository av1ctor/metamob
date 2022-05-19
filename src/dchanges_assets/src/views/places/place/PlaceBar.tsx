import React from "react";
import { Place } from "../../../../../declarations/dchanges/dchanges.did";

interface Props {
    place?: Place;
}

export const PlaceBar = (props: Props) => {
    
    const {place} = props;

    if(!place) {
        return null;
    }
    
    return (
        <div className="place-bar has-text-primary-dark">
            <div className="place-icon">
                <i className={`la la-${place.icon || 'map'}`} />
            </div>
            <div className="place-name">
                {place.name}
            </div>
        </div>
    );
};