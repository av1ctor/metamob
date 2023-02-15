import React, { useContext, useEffect } from "react";
import {Routes, Route} from "react-router-dom";
import {CategoryActionType, CategoryContext} from "../../stores/category";
import {useFindCategories} from "../../hooks/categories";
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
import UserVerification from "../users/user/Verification";
import Logon from "../auth/Logon";
import Header from "./Header";
import Footer from "./Footer";
import About from "./About";
import Jobs from "./Jobs";
import Policies from "./Policies";
import Privacy from "./Privacy";
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
    const [, categoriesDisp] = useContext(CategoryContext);

    const {isLoading} = useUI();

    const categories = useFindCategories([], orderBy, limit);
    
    useEffect((): void => {
        if(categories.status === 'success') {
            categoriesDisp({
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
                        <Route path="/user/verify/:id/:secret" element={<UserVerification />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/jobs" element={<Jobs />} />
                        <Route path="/policies" element={<Policies />} />
                        <Route path="/privacy" element={<Privacy />} />
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