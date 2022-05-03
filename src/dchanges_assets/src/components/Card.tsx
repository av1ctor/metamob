import React from "react";

interface Props {
    label?: string,
    collapsed?: boolean;
    onToggle?: () => void;
    children: any
};

const Card = (props: Props) => {
    return (
        <div
            className="relative border rounded-xl m-2 mt-4 p-2"
        >
            {props.label &&
                <div 
                    className="absolute left-4 px-1 text-xs font-bold hide-label-line cursor-pointer" 
                    style={{top: '-0.55rem'}}
                    onClick={props.onToggle}
                >
                    {props.label}
                    {props.onToggle &&
                        <span
                            className="pl-1">
                            <i className={`las la-caret-${!props.collapsed? 'up': 'down'}`} />
                        </span>
                    }
                </div>
            }
            {props.collapsed? null: props.children}
        </div>
    );
};


export default Card;