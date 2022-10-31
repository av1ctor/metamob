import React from "react";

interface Props {
    flag: string;
    title: string;
}

export const LangIcon = (props: Props) => {
    return (
        <div className="intl icon">
            <img src={`/flags/1x1/${props.flag}.svg`} title={props.title} />
        </div>
    )
};