import React, { useCallback, useContext, useMemo } from "react";
import { useIntl } from "react-intl";
import Badge from "../../../components/Badge";
import { ModerationReason, moderationReasonToColor, moderationReasonToText, moderationReasonToTitle } from "../../../libs/moderations";
import { AuthContext } from "../../../stores/auth";
import { IntlContext } from "../../../stores/intl";

interface Props {
    reason: ModerationReason;
    isLarge?: boolean;
    onShowModerations?: () => void;
}

const ModBadge = (props: Props) => {
    const [auth] = useContext(AuthContext);
    const [lang] = useContext(IntlContext);

    const intl = useIntl();

    const desc = useMemo((): {texts: string[], titles: string[]} => {
        const res: {texts: string[], titles: string[]} = {texts: [], titles: []};
        for(let mask = 1; mask <= 65536; ) {
            if((props.reason & mask) !== 0) {
                const text = moderationReasonToText(mask);
                res.texts.push(intl.formatMessage({id: text, defaultMessage: text}));
                const title = moderationReasonToTitle(mask);
                res.titles.push(intl.formatMessage({id: title, defaultMessage: title}));
            }
            mask <<= 1;
        }
        return res;
    }, [props.reason, lang.locale]);

    const title = useMemo(() => {
        return desc.titles.join('/');
    }, [desc.titles]);

    const text = useMemo(() => {
        return desc.texts.join('/');
    }, [desc.texts]);

    const handleShowModerations = useCallback(() => {
        if(auth.user && props.onShowModerations) {
            props.onShowModerations();
        }
    }, [auth.user, props.onShowModerations]);

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
                data-tooltip={title}
                onClick={handleShowModerations}
            >
                {text}
            </span>
        </Badge>
    );
};

export default ModBadge;
