import React from "react";
import Skeleton from "react-loading-skeleton";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import { PlaceIcon } from "./PlaceIcon";

interface Props {
    place?: Place;
}

export const PlaceBar = (props: Props) => {
    
    const {place} = props;

    return (
        <div className="place-bar has-text-primary-dark">
            <PlaceIcon 
                place={place} 
                size="lg"
            />
            <div className="place-name ml-4">
                {place? place.name: <Skeleton width={100} />}
            </div>
        </div>
    );
};