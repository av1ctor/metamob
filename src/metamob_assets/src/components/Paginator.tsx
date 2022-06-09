import React from "react";
import Button from "./Button";

interface Props {
    limit: {offset: number, size: number};
    length?: number;
    onPrev: () => void;
    onNext: () => void;
}

export const Paginator = (props: Props) => {
    return (
        <div className="field is-grouped mt-4">
            <div className="control">
                <Button
                    size="small"
                    disabled={props.limit.offset === 0}
                    onClick={props.onPrev}
                >
                    Previous
                </Button>
            </div>
            <div className="control">
                <Button
                    size="small"
                    disabled={(props.length || 0) < props.limit.size}
                    onClick={props.onNext}
                >
                    Next
                </Button>
            </div> 
        </div>
    );
};