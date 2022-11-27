import React, { useContext, useEffect } from "react";
import {Routes, Route} from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client"
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
import UserNotifications from "../users/user/Notifications";
import Logon from "../auth/Logon";
import Header from "./Header";
import Footer from "./Footer";
import User from "../users/user/User";
import Admin from "../admin/Admin";
import Front from "./Front";
import PublicProfile from "../users/user/PublicProfile";
import { Limit, Order } from "../../libs/common";
import { useUI } from "../../hooks/ui";

import "react-responsive-carousel/lib/styles/carousel.min.css";

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

    const {isLoading} = useUI();

    const categories = useFindCategories([], orderBy, limit);
    
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

    return (
        <div className="home">
            <Header />
            <section className="section">
                <div className="container">
                    <Routes>
                        <Route path="/user/login" element={<Logon />} />
                        <Route path="/user/profile" element={<User />} />
                        <Route path="/user/campaigns" element={<UserCampaigns />} />
                        <Route path="/user/donations" element={<UserDonations />} />
                        <Route path="/user/fundings" element={<UserFundings />} />
                        <Route path="/user/signatures" element={<UserSignatures />} />
                        <Route path="/user/votes" element={<UserVotes />} />
                        <Route path="/user/places" element={<UserPlaces />} />
                        <Route path="/user/reports" element={<UserReports />} />
                        <Route path="/user/challenges" element={<UserChallenges />} />
                        <Route path="/user/notifications" element={<UserNotifications />} />
                        <Route path="/c/:id" element={<Campaign />} />
                        <Route path="/p/:id" element={<Place />} />
                        <Route path="/u/:id" element={<PublicProfile />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/campaigns" element={<Campaigns />} />
                        <Route path="/places/:mode" element={<Places />} />
                        <Route path="/places" element={<Places />} />
                        <Route path="/" element={<Front />} />
                    </Routes>
                </div>
            </section>
            <Footer />

            <div className={`loading ${isLoading? 'visible': 'hidden'}`}>
                <img src="/loading.svg" />
            </div>
        </div>            
    );
}