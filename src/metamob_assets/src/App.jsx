import React from "react";
import {HashRouter as Router} from "react-router-dom";
import {QueryClient, QueryClientProvider} from 'react-query';
import {AuthContextProvider} from "./stores/auth";
import {CategoryContextProvider} from "./stores/category";
import {Home} from "./views/home/Home";
import { ActorContextProvider } from "./stores/actor";
import { IntlContextProvider } from "./stores/intl";

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
                        <CategoryContextProvider>
                            <Router>     
                                <Home />
                            </Router>
                        </CategoryContextProvider>
                    </ActorContextProvider>
                </AuthContextProvider>
            </QueryClientProvider>
        </IntlContextProvider> 
    );
};


