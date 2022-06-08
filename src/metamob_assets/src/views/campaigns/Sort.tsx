import React, { useCallback } from "react";
import Button from "../../components/Button";
import { Order } from "../../libs/common";

export const sortByHot: Order[] = [
    {
        key: 'boosting',
        dir: 'desc'
    },
    {
        key: 'total',
        dir: 'desc'
    },
    {
        key: '_id',
        dir: 'desc'
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

    const handleSortByHot = useCallback(() => {
        props.onChange(sortByHot);
    }, [props.onChange]);

    const handleSortByDate = useCallback(() => {
        props.onChange(sortByDate);
    }, [props.onChange]);

    const isHot = props.current[0].key !== '_id';

    return (
        <div className="is-flex">
            <div className="field">
                <div className="control">
                    <Button
                        title="Sort by hot"
                        color={isHot? 'danger': 'light'}
                        onClick={!isHot? handleSortByHot: undefined}
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
                        color={!isHot? 'danger': 'light'}
                        onClick={isHot? handleSortByDate: undefined}
                    >
                        <i className="la la-clock"/>
                    </Button>
                </div>
            </div>
        </div>
    );
};