import React from "react";

interface Props {
    pro: boolean;
}

export const Badge = (props: Props) => {
    
    return (
        props.pro? 
            <span className="tag is-rounded is-success"><i className="la la-check-circle" />&nbsp;In favor</span>
        : 
            <span className="tag is-rounded is-danger"><i className="la la-times-circle" />&nbsp;Against</span>
    );
};