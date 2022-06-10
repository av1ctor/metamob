import React, { useCallback } from "react";
import Button from "../../components/Button";
import { Order } from "../../libs/common";

export const sortByKind: Order[] = [
    {
        key: 'kind',
        dir: 'asc'
    },
];

export const sortByDate: Order[] = [
    {
        key: '_id',
        dir: 'desc'
    }
];

interface Props {
    current: Order[];
    onChange: (orderBy: Order[]) => void
};

export const Sort = (props: Props) => {

    const handleSortByKind = useCallback(() => {
        props.onChange(sortByKind);
    }, [props.onChange]);

    const handleSortByDate = useCallback(() => {
        props.onChange(sortByDate);
    }, [props.onChange]);

    const isKind = props.current[0].key !== '_id';

    return (
        <div className="is-flex">
            <div className="field">
                <div className="control">
                    <Button
                        title="Sort by kind"
                        color={isKind? 'danger': 'light'}
                        onClick={!isKind? handleSortByKind: undefined}
                    >
                        <i className="la la-burn"/>
                    </Button>
                </div>
            </div>
            <div className="ml-1"></div>
            <div className="field">
                <div className="control">
                    <Button
                        title="Sort by latest"
                        color={!isKind? 'danger': 'light'}
                        onClick={isKind? handleSortByDate: undefined}
                    >
                        <i className="la la-clock"/>
                    </Button>
                </div>
            </div>
        </div>
    );
};