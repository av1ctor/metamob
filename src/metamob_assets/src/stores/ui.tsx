import React, {createContext, useReducer} from 'react';

export interface UIState {
    isLoading: boolean;
};

export enum UIActionType {
    TOGGLE,
};

interface Action {
    type: UIActionType;
    payload: any;
};

const initialState: UIState = {
    isLoading: false
};

export const UIContext = createContext<[UIState, (action: Action) => void]>(
    [initialState, (action: Action) => {}]);

const reducer = (state: UIState, action: Action): UIState => {
    switch(action.type) {
        case UIActionType.TOGGLE:
            return {
                isLoading: action.payload
            };

        default:
            return state;
    }
};

interface Props {
    children: any
};

export const UIContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<UIContext.Provider 
			value={[state, dispatch]}>
			{props.children}
		</UIContext.Provider>
	);
}
