import React, { useContext, useEffect } from "react";
import {Routes, Route, Link} from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client"
import { toast } from 'bulma-toast';
import { DChanges, ProfileResponse } from "../../../../declarations/dchanges/dchanges.did";
import {AuthActionType, AuthContext} from "../../stores/auth";
import { ActorActionType, ActorContext } from "../../stores/actor";
import {CategoryActionType, CategoryContext} from "../../stores/category";
import {useFindCategories} from "../../hooks/categories";
import { createMainActor } from "../../libs/backend";
import Setup from "../setup/Setup";
import Campaigns from "../campaigns/Campaigns";
import Campaign from "../campaigns/campaign/Campaign";
import UserCampaigns from "../users/Campaigns";
import Logon from "../auth/Logon";
import Header from "./Header";
import Footer from "./Footer";
import Profile from "../users/Profile";

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
    const [, actorDispatch] = useContext(ActorContext);
    const [categoriesState, categoriesDispatch] = useContext(CategoryContext);

    const categories = useFindCategories(['categories']);

    const loadAuthenticatedUser = async (
        main: DChanges
    ): Promise<ProfileResponse|undefined> => {
        try {
            const res = await main.userFindMe();
            if('ok' in res) {
                return res.ok;
            }
        }
        catch(e) {
        }

        return undefined;
    };
    
    const init = async () => {
        const client = await AuthClient.create();
        authDispatch({
            type: AuthActionType.SET_CLIENT, 
            payload: client
        });

        const isAuthenticated = await client.isAuthenticated();
        if(isAuthenticated) {
            const identity = client.getIdentity();
            authDispatch({
                type: AuthActionType.SET_IDENTITY, 
                payload: identity
            });

            const main = createMainActor(identity);
            actorDispatch({
                type: ActorActionType.SET_MAIN,
                payload: main
            });        
            
            const user = await loadAuthenticatedUser(main);
            if(user) {
                authDispatch({
                    type: AuthActionType.SET_USER, 
                    payload: user
                });
            }
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
        return (
            <Setup 
                onSuccess={showSuccess}
                onError={showError}
            />
        );
    }    
    
    return (
        <>
            <Header 
                onSuccess={showSuccess}
                onError={showError}
            />
            <section className="section">
                <div className="container">
                    <Routes>
                        <Route path="/user/login" element={<Logon onSuccess={showSuccess} onError={showError} />} />
                        <Route path="/user/profile" element={<Profile onSuccess={showSuccess} onError={showError} />} />
                        <Route path="/user/campaigns" element={<UserCampaigns />} />
                        <Route path="/c/:id" element={<Campaign onSuccess={showSuccess} onError={showError} />} />
                        <Route path="/" element={<Campaigns onSuccess={showSuccess} onError={showError} />} />
                    </Routes>
                </div>
            </section>
            <Footer />
        </>            
    );
}