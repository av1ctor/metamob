import React from "react";

interface Props {
    flag: string;
    title?: string;
}

export const LangIcon = (props: Props) => {
    return (
        <div className="intl">
            <span className="icon">
                <img src={`/flags/1x1/${props.flag}.svg`} title={props.title} />
            </span>
            {props.title &&
                <span className="title">
                    {props.title}
                </span>
            }
        </div>
    )
};