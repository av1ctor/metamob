import React, { useMemo } from "react";
import Badge from "../../../components/Badge";
import { ModerationReason, moderationReasonToColor, moderationReasonToText, moderationReasonToTitle } from "../../../libs/moderations";

interface Props {
    reason: ModerationReason;
    isLarge?: boolean;
    onShowModerations: () => void;
}

const ModBadge = (props: Props) => {

    const desc = useMemo((): {texts: string[], titles: string[]} => {
        const res: {texts: string[], titles: string[]} = {texts: [], titles: []};
        for(let mask = 1; mask <= 65536; ) {
            if((props.reason & mask) !== 0) {
                res.texts.push(moderationReasonToText(mask));
                res.titles.push(moderationReasonToTitle(mask));
            }
            mask <<= 1;
        }
        return res;
    }, [props.reason]);

    if(props.reason === ModerationReason.NONE) {
        return null;
    }

    return (
        <Badge 
            className="moderation-badge"
            color={moderationReasonToColor(desc.texts.length > 1? ModerationReason.FAKE: props.reason)}
            isRect
            isLarge={props.isLarge}
        >
            <span 
                className="has-tooltip-arrow" 
                data-tooltip={desc.titles.join('/')}
                onClick={props.onShowModerations}
            >
                {desc.texts.join('/')}
            </span>
        </Badge>
    );
};

export default ModBadge;
