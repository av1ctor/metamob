import React from "react";
import { useFindPlaceByPubId } from "../../hooks/places";
import Item from "./Item";

interface Props {
    pubId?: string;
};

const ItemWrapper = (props: Props) => {
    const req = useFindPlaceByPubId(props.pubId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            place={req.data}
        />
    );
};

export default ItemWrapper;