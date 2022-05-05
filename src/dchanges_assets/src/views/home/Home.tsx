import React, { useContext, useEffect } from "react";
import {Routes, Route, Link} from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client"
import { toast } from 'bulma-toast';
import {AuthActionType, AuthContext} from "../../stores/auth";
import {CategoryActionType, CategoryContext} from "../../stores/category";
import {useFindCategories} from "../../hooks/categories";
import Setup from "../setup/Setup";
import Petitions from "../petitions/Petitions";
import Petition from "../petitions/petition/Petition";
import Logon from "../auth/Logon";

const showError = (e: any) => {
    if(e) {
        const text = typeof e === 'string'? 
            e
        :
            e.constructor === Array?
                e.join('\n')
            :
                typeof e === 'object'?
                    'data' in e?
                        e.data.message
                    :
                        e.message
                :
                    '';
        
        toast({
            message: `Error: ${text}`,
            type: 'is-danger',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
        });
    }
};

const showSuccess = (text: string) => {
    toast({
        message: text,
        type: 'is-success',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
    });
}

export const Home = () => {
    const [, authDispatch] = useContext(AuthContext);
    const [categoriesState, categoriesDispatch] = useContext(CategoryContext);

    const categories = useFindCategories(['categories']);

    const init = async () => {
        const client = await AuthClient.create();
        const isAuthenticated = await client.isAuthenticated();
        
        authDispatch({
            type: AuthActionType.SET_CLIENT, 
            payload: client
        });

        if(isAuthenticated) {
            authDispatch({
                type: AuthActionType.SET_PRINCIPAL, 
                payload: client.getIdentity().getPrincipal().toText()
            });
        }
    };

    useEffect(() => {
        init();
    }, []);

    useEffect((): void => {
        if(categories.status === 'success') {
            categoriesDispatch({type: CategoryActionType.SET, payload: categories.data});
        }
    }, [categories.status]);

    if(categoriesState.categories.length == 0) {
        return <Setup />;
    }    
    
    return (
        <>
            <section className="section">
                <div className="container has-text-centered">
                    <h1 className="title">
                        <Link to="/">D-Changes</Link>
                    </h1>
                    <p className="subtitle">
                        Together we can transform the world!
                    </p>
                </div>
                <div className="container">
                    <Routes>
                        <Route path="/login" element={<Logon onSuccess={showSuccess} onError={showError} />} />
                        <Route path="/p/:id" element={<Petition onSuccess={showSuccess} onError={showError} />} />
                        <Route path="/" element={<Petitions onSuccess={showSuccess} onError={showError} />} />
                    </Routes>
                </div>
            </section>
            <footer className="footer">
                <div className="content has-text-centered">
                    D-Changes (c) 2022 by av1ctor
                </div>
            </footer>
        </>            
    );
}