import React, { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { EntityType, ModerationResponse } from "../../../../declarations/metamob/metamob.did";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { useFindModerationsByEntity } from "../../hooks/moderations";
import CreateForm from "../challenges/challenge/Create";
import Item from "./Item";

interface Props {
    entityType: EntityType;
    entityId: number;
    onClose: () => void;
}

const orderBy = [{key: '_id', dir: 'desc'}];
const limit = {offset: 0, size: 5};

const Moderations = (props: Props) => {
    const [modals, setModals] = useState({
        challenge: false,
    });
    const [moderation, setModeration] = useState<ModerationResponse>();
    
    const moderations = useFindModerationsByEntity(props.entityType, props.entityId, orderBy, limit);

    const toggleChallenge = useCallback(() => {
        setModals(modals => ({
            ...modals,
            challenge: !modals.challenge
        }));
    }, []);

    const handleChallenge = useCallback((moderation: ModerationResponse) => {
        setModeration(moderation);
        toggleChallenge();
    }, []);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <>
            <div>
                {moderations.status === "success" && 
                    moderations.data &&
                    moderations.data.map(mod => 
                        <Item
                            key={mod._id}
                            moderation={mod}
                            onChallenge={handleChallenge}
                        />
                    )
                }
            </div>
            <div className="control">
                <Button
                    color="danger"
                    onClick={handleClose}
                >
                    <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                </Button>
            </div>

            {moderation &&
                <Modal
                    header={<span><FormattedMessage defaultMessage="Challenge moderation"/></span>}
                    isOpen={modals.challenge}
                    onClose={toggleChallenge}
                >
                        <CreateForm
                            moderationId={moderation._id}
                            onClose={toggleChallenge}
                        />
                </Modal> 
            }
        </>
    )
};

export default Moderations;