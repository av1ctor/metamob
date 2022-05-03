import React, {createContext, useReducer} from 'react';
import {Tag} from "../../../declarations/dchanges/dchanges.did";

export interface TagState {
    tags: Tag[];
};

export enum TagActionType {
    SET,
    RESET,
};

interface Action {
    type: TagActionType;
    payload: any;
};

const initialState: TagState = {
    tags: []
};

export const TagContext = createContext<[TagState, (action: Action) => void]>(
    [initialState, (action: Action) => {}]);

const reducer = (state: TagState, action: Action): TagState => {
    switch(action.type) {
        case TagActionType.SET:
            return {
                tags: action.payload
            };

        case TagActionType.RESET:
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

export const TagContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<TagContext.Provider 
			value={[state, dispatch]}>
			{props.children}
		</TagContext.Provider>
	);
}
