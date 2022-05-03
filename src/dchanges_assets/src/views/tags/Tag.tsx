import React from 'react';
import { useFindTagById } from '../../hooks/tags';

interface Props {
    id?: number
};

const Tag = (props: Props) => {
    const tag = props.id?
        useFindTagById(['tag'], props.id):
        undefined;
    
    return (
        tag?.isSuccess? 
            <span className="text-xs">
                <div className="inline-block w-2 h-2 bg-blue-300"/> {tag.data.name}
            </span>:
        null
    );
};

export default Tag;