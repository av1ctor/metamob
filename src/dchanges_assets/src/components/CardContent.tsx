import React from "react";

interface Props {
    children: any
};

const CardContent = (props: Props) => {
    return (
        <div>{props.children}</div>
    );
};

export default CardContent;