import React from 'react';
import dayjs from 'dayjs';

interface Props {
    date: Date | number | bigint | string;
};

const TimeFromNow = (props: Props) => {
    const date = props.date.constructor === Date?
        props.date:
        props.date.constructor === Number?
            new Date(props.date):
                props.date.constructor === BigInt?
                    new Date(Number(props.date / 1000000n)):
                    Date.parse(props.date as string);

    const now = Date.now();
    const diff = (now - date.valueOf()) / 1000;
    
    let res = '';
    if(diff < 1) {
        res = 'now';
    }
    if(diff < 60) {
        res = Math.floor(diff) + 's';
    }
    else if(diff < 60 * 60) {
        res = Math.floor(diff / (60)) + 'm';
    }
    else if(diff < 60 * 60 * 24) {
        res = Math.floor(diff / (60 * 60)) + 'h';
    }
    else if(diff < 60 * 60 * 24 * 30) {
        res = Math.ceil(diff / (60 * 60 * 24)) + 'd';
    }
    else {
        const then = dayjs(date);
        const diff = dayjs(now).diff(then, 'month');
        if(diff < 12) {
            res = then.format('MMM DD');
        }
        else {
            res = Math.ceil(diff / 12) + 'y';
        }
    }

    return <span>{res}</span>;
}

export default TimeFromNow;