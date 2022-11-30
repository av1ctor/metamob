import React from "react";

interface Props {
    children: any;
};

const Container = (props: Props) => {
    return (
        <div
            className="container"
        >
            {props.children}
        </div>
    );
};

export default Container;