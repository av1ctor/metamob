import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useFindCategoryById } from '../../../hooks/categories';

interface Props {
    id?: number
};

const Category = (props: Props) => {
    const category = useFindCategoryById(['categories', props.id], props.id);

    return (
        category?.isSuccess? 
            <span 
                className="tag is-rounded" 
                style={{backgroundColor: category.data.color}} 
                title={`Category: ${category.data.name}`}
            >
                <b>{category.data.name}</b>
            </span>:
            <Skeleton 
                width={100} 
            />
    );
};

export default Category;