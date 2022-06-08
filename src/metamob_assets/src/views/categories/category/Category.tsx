import React from 'react';
import { useFindCategoryById } from '../../../hooks/categories';

interface Props {
    id?: number
};

const Category = (props: Props) => {
    const category = props.id?
        useFindCategoryById(['categories', props.id], props.id):
        undefined;

    return (
        category?.isSuccess? 
            <span 
                className="tag is-rounded" 
                style={{backgroundColor: category.data.color}} 
                title={`Category: ${category.data.name}`}
            >
                <b>{category.data.name}</b>
            </span>:
        null
    );
};

export default Category;