import React from "react";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import Avatar from "../../users/Avatar";
import { PlaceIcon } from "./PlaceIcon";

interface Props {
    place: Place;
    partial?: boolean;
}

export const Preview = (props: Props) => {
    const {place} = props;
    
    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Place</b>:&nbsp;
                    <PlaceIcon place={place} />
                </div>
            :
                <div className="field">
                    <label className="label">
                        Place
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {place.pubId}
                        </div>
                        <div>
                            <PlaceIcon place={place} />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={place.createdBy} 
                                size='lg'
                            />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};