import React from "react";
import {HashRouter as Router} from "react-router-dom";
import {QueryClient, QueryClientProvider} from 'react-query';
import {AuthContextProvider} from "./stores/auth";
import {CategoryContextProvider} from "./stores/category";
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
    <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
            <CategoryContextProvider>
                <Router>                    
                    <Home />
                </Router>
            </CategoryContextProvider>
        </AuthContextProvider>
    </QueryClientProvider>
  );
};


