import React, { useCallback, useState } from "react";
import Modal from "../../components/Modal";
import { EntityType } from "../../libs/common";
import { ModerationReason } from "../../libs/moderations";
import Moderations from "./Moderations";

interface Props {
    moderated: ModerationReason;
    entityType: EntityType;
    entityId: number;
    isOpen: boolean;
    onClose: () => void;
}

const ModerationModal = (props: Props) => {
    return (
        <Modal
            header={<span>Moderations</span>}
            isOpen={props.isOpen}
            onClose={props.onClose}
        >
            {props.moderated !== ModerationReason.NONE &&
                <Moderations
                    entityType={props.entityType}
                    entityId={props.entityId}
                    onClose={props.onClose}
                />
            }
        </Modal>
    );
}

export default ModerationModal;