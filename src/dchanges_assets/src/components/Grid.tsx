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
                props.container? "md:flex pr-2": "md:flex-1 pl-2"
                )}
        >
            {props.children}
        </div>
    );
};

export default Grid;