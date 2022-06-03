import React from "react";
import { Place } from "../../../../../declarations/dchanges/dchanges.did";
import { PlaceIcon } from "./PlaceIcon";

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
            <PlaceIcon 
                place={place} 
                size="lg"
            />
            <div className="place-name ml-4">
                {place.name}
            </div>
        </div>
    );
};