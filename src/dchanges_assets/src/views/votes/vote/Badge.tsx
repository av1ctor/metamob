import React from "react";

interface Props {
    pro: boolean;
}

export const Badge = (props: Props) => {
    
    return (
        props.pro? 
            <span className="has-text-success-dark"><b><i className="la la-check-circle" /></b> In favor</span>
        : 
            <span  className="has-text-danger-dark"><b><i className="la la-times-circle" /></b> Against</span>
    );
};