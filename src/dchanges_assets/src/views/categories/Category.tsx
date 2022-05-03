import React from 'react';
import { useFindCategoryById } from '../../hooks/categories';

interface Props {
    id?: number
};

const Category = (props: Props) => {
    const category = props.id?
        useFindCategoryById(['category'], props.id):
        undefined;

    return (
        category?.isSuccess? 
            <span className="text-xs" title={category.data.description}>
                <div className="inline-block w-2 h-2" style={{backgroundColor: category.data.color}}/> {category.data.name}
            </span>:
        null
    );
};

export default Category;