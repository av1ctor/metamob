import React from "react";

interface Props {
    children: any;
};

const Box = (props: Props) => {
    return (
        <div className="box">
            {props.children}
        </div>
    );
};

export default Box;