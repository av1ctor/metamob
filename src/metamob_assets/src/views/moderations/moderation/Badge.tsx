import React from "react";
import Badge from "../../../components/Badge";
import { ModerationReason, moderationReasonToColor, moderationReasonToText } from "../../../libs/moderations";

interface Props {
    reason: ModerationReason;
}

const ModBadge = (props: Props) => {
    if(props.reason === ModerationReason.NONE) {
        return null;
    }

    return (
        <Badge 
            className="moderation-badge"
            color={moderationReasonToColor(props.reason)}
            isRect
            isLarge
        >
            {moderationReasonToText(props.reason)}
        </Badge>
    );
};

export default ModBadge;
