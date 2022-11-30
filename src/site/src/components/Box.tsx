import React from "react";

interface Props {
    className?: string;
    children: any;
};

const Box = (props: Props) => {
    return (
        <div className={`box ${props.className}`}>
            {props.children}
        </div>
    );
};

export default Box;