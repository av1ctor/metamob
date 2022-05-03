import React, {createContext, useReducer} from 'react';
import {Category} from "../../../declarations/dchanges/dchanges.did";

export interface CategoryState {
    categories: Category[];
};

export enum CategoryActionType {
    SET,
    RESET,
};

interface Action {
    type: CategoryActionType;
    payload: any;
};

const initialState: CategoryState = {
    categories: []
};

export const CategoryContext = createContext<[CategoryState, (action: Action) => void]>(
    [initialState, (action: Action) => {}]);

const reducer = (state: CategoryState, action: Action): CategoryState => {
    switch(action.type) {
        case CategoryActionType.SET:
            return {
                categories: action.payload
            };

        case CategoryActionType.RESET:
            return {
                ...initialState
            };

        default:
            return state;
    }
};

interface Props {
    children: any
};

export const CategoryContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<CategoryContext.Provider 
			value={[state, dispatch]}>
			{props.children}
		</CategoryContext.Provider>
	);
}
