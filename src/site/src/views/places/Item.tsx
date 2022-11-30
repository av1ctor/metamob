import React from "react";
import {Link} from 'react-router-dom';
import { Place } from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Card from "../../components/Card";
import PlaceTree from "./place/PlaceTree";
import { limitText } from "../../libs/utils";
import { PlaceIcon } from "./place/PlaceIcon";
import Badge from "../../components/Badge";

interface Props {
    place: Place;
};

const Item = (props: Props) => {
    const place = props.place;

    return (
        <Card 
            title={
                <Link to={`/p/${place.pubId}`}>
                    {limitText(place.name, 60)}
                </Link>
            } 
            subtitle={<>
                <div className="mb-1">
                    <PlaceTree 
                        id={place._id}
                        skipLast
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
            <div className="mb-5">
                {limitText(place.description, 200)}
            </div>
            <div className="level">
                <div className="level-left">
                    <Badge
                        color={'none' in place.auth? 'success': 'danger'}
                    >
                        {'none' in place.auth? 'public': 'restricted'}
                    </Badge>
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