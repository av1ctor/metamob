import React from "react";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import { PlaceKind } from "../../../libs/places";

interface Props {
    place?: Place;
    size?: string;
    className?: string;
}

export const PlaceIcon = (props: Props) => {
    
    const {place} = props;

    return (
        <div 
            className={`place-icon ${props.size || 'sm'} ${props.className}`}
        >
            {place?.kind === PlaceKind.PLANET || place?.kind === PlaceKind.CONTINENT?
                <i 
                    className={`pl-${place?.icon || 'map'}`} 
                />:
                place?.kind == PlaceKind.COUNTRY?
                    <span 
                        className={`fi fi-${place.icon} fis`} 
                    />:
                    place?.icon?
                        <img 
                            src={place.icon}
                        />:
                        <i className="pl-map" />
            }
        </div>
    );
};