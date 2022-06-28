import React from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindPlaceById } from "../../../hooks/places";
import Avatar from "../../users/Avatar";
import { PlaceIcon } from "./PlaceIcon";

interface Props {
    id: number;
    partial?: boolean;
    onEditUser?: (user: Profile) => void;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const place = useFindPlaceById(props.id);
    
    return (
        <div className="mb-2">
            {place.data?
                props.partial?
                    <div>
                        <b>Place</b>:&nbsp;
                        <PlaceIcon place={place.data} />
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
                                {place.data.pubId}
                            </div>
                            <div>
                                <PlaceIcon place={place.data} />
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Author
                                </label>
                                <Avatar 
                                    id={place.data.createdBy} 
                                    size='lg'
                                    onClick={props.onEditUser}
                                />
                            </div>
                        </div>
                    </div>
                :
                    null
            }
        </div>
    );
};