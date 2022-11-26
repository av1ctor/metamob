import React from "react";
import {HashRouter as Router} from "react-router-dom";
import {QueryClient, QueryClientProvider} from 'react-query';
import {AuthContextProvider} from "./stores/auth";
import {CategoryContextProvider} from "./stores/category";
import { ActorContextProvider } from "./stores/actor";
import { IntlContextProvider } from "./stores/intl";
import { UIContextProvider } from "./stores/ui";
import {Home} from "./views/home/Home";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
        },
    },
});

export const App = () => {
    return (
        <IntlContextProvider>
            <QueryClientProvider client={queryClient}>
                <AuthContextProvider>
                    <ActorContextProvider>
                        <UIContextProvider>
                            <CategoryContextProvider>
                                <Router>     
                                    <Home />
                                </Router>
                            </CategoryContextProvider>
                        </UIContextProvider>
                    </ActorContextProvider>
                </AuthContextProvider>
            </QueryClientProvider>
        </IntlContextProvider> 
    );
};


