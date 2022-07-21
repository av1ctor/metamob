import React, { useContext } from "react";
import { EntityType } from "../../../../declarations/metamob/metamob.did";
import Button from "../../components/Button";
import { useFindModerationsByEntity } from "../../hooks/moderations";
import { ActorContext } from "../../stores/actor";
import Item from "./Item";

interface Props {
    entityType: EntityType;
    entityId: number;
    onClose: () => void;
}

const orderBy = [{key: '_id', dir: 'desc'}];
const limit = {offset: 0, size: 5};

const Moderations = (props: Props) => {

    const [actorState, ] = useContext(ActorContext);
    
    const moderations = useFindModerationsByEntity(
        props.entityType, 
        props.entityId, 
        orderBy, 
        limit,
        actorState.main
    );

    return (
        <>
            <div>
                {moderations.status === "success" && 
                    moderations.data &&
                    moderations.data.map(mod => 
                        <Item
                            key={mod._id}
                            moderation={mod}
                        />
                    )
                }
            </div>
            <div className="control">
                <Button
                    color="danger"
                    onClick={props.onClose}
                >
                    Cancel
                </Button>
            </div>
        </>
    )
};

export default Moderations;