import React, {createContext, useReducer} from 'react';
import {IntlProvider} from 'react-intl';

export interface IntlState {
    locale: string;
    flag: string;
    title: string;
    messages: Record<string, string>;
};

export enum IntlActionType {
    CHANGE,
};

interface Action {
    type: IntlActionType;
    payload: any;
};

const initialState: IntlState = {
    locale: 'en',
    flag: 'us',
    title: 'English',
    messages: {},
};

export const IntlContext = createContext<[IntlState, (action: Action) => void]>(
    [initialState, (action: Action) => {}]);

const reducer = (state: IntlState, action: Action): IntlState => {
    switch(action.type) {
        case IntlActionType.CHANGE:
            return {
                locale: action.payload.locale,
                flag: action.payload.flag,
                title: action.payload.title,
                messages: action.payload.messages,
            };

        default:
            return state;
    }
};

interface Props {
    children: any
};

export const IntlContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<IntlContext.Provider 
			value={[state, dispatch]}>
            <IntlProvider
                locale={state.locale}
                defaultLocale="en"
                messages={state.messages}
            >
			    {props.children}
            </IntlProvider>
		</IntlContext.Provider>
	);
}
