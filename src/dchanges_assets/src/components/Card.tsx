import React from "react";

interface Props {
    label?: string,
    collapsed?: boolean;
    onToggle?: () => void;
    children: any
};

const Card = (props: Props) => {
    return (
        <nav className="panel">
            {props.label &&
                <p className="panel-heading">
                    {props.label}
                    {props.onToggle &&
                        <span
                            className="pl-1">
                            <i className={`las la-caret-${!props.collapsed? 'up': 'down'}`} />
                        </span>
                    }
                </p>
            }
            {props.collapsed? 
                null: 
                <a className="panel-block is-active">
                    {props.children}
                </a>
            }
        </nav>
    );
};


export default Card;