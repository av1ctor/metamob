import React, { useCallback, useContext, useEffect, useState } from "react";
import {Routes, Route} from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client"
import { toast } from 'bulma-toast';
import { Metamob, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import {AuthActionType, AuthContext} from "../../stores/auth";
import { ActorActionType, ActorContext } from "../../stores/actor";
import {CategoryActionType, CategoryContext} from "../../stores/category";
import {useFindCategories} from "../../hooks/categories";
import { createLedgerActor, createMainActor, createMmtActor } from "../../libs/backend";
import Campaigns from "../campaigns/Campaigns";
import Campaign from "../campaigns/campaign/Campaign";
import Places from "../places/Places";
import Place from "../places/Place";
import UserCampaigns from "../users/user/Campaigns";
import UserDonations from "../users/user/Donations";
import UserFundings from "../users/user/Fundings";
import UserSignatures from "../users/user/Signatures";
import UserVotes from "../users/user/Votes";
import UserPlaces from "../users/user/Places";
import UserReports from "../users/user/Reports";
import UserChallenges from "../users/user/Challenges";
import Logon from "../auth/Logon";
import Header from "./Header";
import Footer from "./Footer";
import User from "../users/user/User";
import Admin from "../admin/Admin";
import Front from "./Front";
import { Limit, Order } from "../../libs/common";

import "react-responsive-carousel/lib/styles/carousel.min.css";
import PublicProfile from "../users/user/PublicProfile";

const showError = (e: any) => {
    if(e) {
        const text = typeof e === 'string'? 
            e
        :
            e.constructor === Array?
                e.map((s, i) => `${1+i}. ${s};`) .join('\n')
            :
                typeof e === 'object'?
                    'data' in e?
                        e.data.message
                    :
                        e.message
                :
                    '';
        
        toast({
            message: `Error${e.constructor === Array? 's:\n': ': '}${text}`,
            type: 'is-danger',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
            position: 'top-center'
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
        position: 'top-center'
    });
}

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const limit: Limit = {
    offset: 0,
    size: 100
};

export const Home = () => {
    const [, authDispatch] = useContext(AuthContext);
    const [, actorDispatch] = useContext(ActorContext);
    const [, categoriesDispatch] = useContext(CategoryContext);

    const [loading, setLoading] = useState(false);

    const categories = useFindCategories([], orderBy, limit);
    
    const toggleLoading = useCallback((to: boolean) => {
        setLoading(to);
    }, []);

    const loadAuthenticatedUser = async (
        main: Metamob
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

            const ledger = createLedgerActor(identity);
            actorDispatch({
                type: ActorActionType.SET_LEDGER,
                payload: ledger
            });

            const mmt = createMmtActor(identity);
            actorDispatch({
                type: ActorActionType.SET_MMT,
                payload: mmt
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
            categoriesDispatch({
                type: CategoryActionType.SET, 
                payload: categories.data
            });
        }
    }, [categories.status]);

    const props = {
        onSuccess: showSuccess,
        onError: showError,
        toggleLoading: toggleLoading
    };

    return (
        <div className="home">
            <Header 
                onSuccess={showSuccess}
                onError={showError}
            />
            <section className="section">
                <div className="container">
                    <Routes>
                        <Route path="/user/login" element={<Logon {...props} />} />
                        <Route path="/user/profile" element={<User {...props} />} />
                        <Route path="/user/campaigns" element={<UserCampaigns {...props} />} />
                        <Route path="/user/donations" element={<UserDonations {...props} />} />
                        <Route path="/user/fundings" element={<UserFundings {...props} />} />
                        <Route path="/user/signatures" element={<UserSignatures {...props} />} />
                        <Route path="/user/votes" element={<UserVotes {...props} />} />
                        <Route path="/user/places" element={<UserPlaces {...props} />} />
                        <Route path="/user/reports" element={<UserReports {...props} />} />
                        <Route path="/user/challenges" element={<UserChallenges {...props} />} />
                        <Route path="/c/:id" element={<Campaign {...props} />} />
                        <Route path="/p/:id" element={<Place {...props} />} />
                        <Route path="/u/:id" element={<PublicProfile {...props} />} />
                        <Route path="/admin" element={<Admin {...props} />} />
                        <Route path="/campaigns" element={<Campaigns {...props} />} />
                        <Route path="/places" element={<Places {...props} />} />
                        <Route path="/" element={<Front {...props} />} />
                    </Routes>
                </div>
            </section>
            <Footer />

            <div className={`loading ${loading? 'visible': 'hidden'}`}>
                <img src="/loading.svg" />
            </div>
        </div>            
    );
}