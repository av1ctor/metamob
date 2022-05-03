import React from "react";
import classnames from "classnames";

interface Props {
    container?: boolean;
    children: any;
};

const Grid = (props: Props) => {
    return (
        <div
            className={classnames(
                props.container? "container": ""
            )}
        >
            {props.children}
        </div>
    );
};

export default Grid;