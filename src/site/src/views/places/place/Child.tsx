import React from "react";
import {Link} from 'react-router-dom';
import { Place } from "../../../../../declarations/metamob/metamob.did";
import { limitText } from "../../../libs/utils";
import { PlaceIcon } from "./PlaceIcon";

interface Props {
    place: Place;
};

const Child = (props: Props) => {
    const place = props.place;

    return (
        <div 
            className="place-child"
        >
            <Link to={`/p/${place.pubId}`}>
                <PlaceIcon 
                    place={place} 
                />
            </Link>
            <Link to={`/p/${place.pubId}`}>
                {limitText(place.name, 60)}
            </Link>
        </div>
    );
};

export default Child;