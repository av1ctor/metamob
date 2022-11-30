import React from "react";
import {HashRouter as Router} from "react-router-dom";
import {QueryClient, QueryClientProvider} from 'react-query';
import {AuthContextProvider} from "./stores/auth";
import {CategoryContextProvider} from "./stores/category";
import { ActorContextProvider } from "./stores/actor";
import { IntlContextProvider } from "./stores/intl";
import { UIContextProvider } from "./stores/ui";
import { WalletContextProvider } from "./stores/wallet";
import { IcProviderBuider } from "./libs/icproviderbuilder";
import {Home} from "./views/home/Home";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
        },
    },
});

const authProvider = new IcProviderBuider()
    .withInternetIdentity()
    .withPlug()
    .withStoic()
    .build();

export const App = () => {
    return (
        <IntlContextProvider>
            <QueryClientProvider client={queryClient}>
                <AuthContextProvider provider={authProvider}>
                    <WalletContextProvider>
                        <ActorContextProvider>
                            <UIContextProvider>
                                <CategoryContextProvider>
                                    <Router>     
                                        <Home />
                                    </Router>
                                </CategoryContextProvider>
                            </UIContextProvider>
                        </ActorContextProvider>
                    </WalletContextProvider>
                </AuthContextProvider>
            </QueryClientProvider>
        </IntlContextProvider> 
    );
};


