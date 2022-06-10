import React from "react";
import {Link} from 'react-router-dom';
import { Place } from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Card from "../../components/Card";
import PlaceTree from "../places/place/PlaceTree";
import { limitText } from "../../libs/utils";
import { PlaceIcon } from "./place/PlaceIcon";

interface Props {
    place: Place,
    isPreview?: boolean,
};

const Item = (props: Props) => {
    const place = props.place;

    return (
        <Card 
            title={
                <Link to={`/p/${place.pubId}`}>
                    {limitText(place.name, 45)}
                </Link>
            } 
            subtitle={<>
                <div className="mb-1">
                    <PlaceTree 
                        id={place._id} 
                    />
                </div>
            </>}
            icon={
                <Link to={`/p/${place.pubId}`}>
                    <PlaceIcon 
                        place={place} 
                        size="lg" 
                        className="giga-icon"
                    />
                </Link>
            }
        >
            {props.isPreview &&
                <div className="mb-5">
                    {limitText(place.description, 200)}
                </div>
            }
            <div className="level">
                <div className="level-left">
                </div>
                <div className="level-right is-flex">
                    <Avatar id={place.createdBy} />&nbsp;·&nbsp;
                    <TimeFromNow 
                        date={BigInt.asIntN(64, place.createdAt)}
                    />
                </div>
            </div>
        </Card>
    );
};

export default Item;