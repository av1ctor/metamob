import React from "react";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import { PlaceKind } from "../../../libs/places";

interface Props {
    place: Place;
    size?: string;
}

export const PlaceIcon = (props: Props) => {
    
    const {place} = props;

    return (
        <div className={`place-icon ${props.size || 'sm'}`}>
            {place.kind == PlaceKind.COUNTRY?
                <span className={`fi fi-${place.icon} fis`} />:
                <i className={`pl-${place.icon || 'map'}`} />
            }
        </div>
    );
};