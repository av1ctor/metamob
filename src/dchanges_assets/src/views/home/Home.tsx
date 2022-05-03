import React, { useContext, useEffect } from "react";
import {Routes, Route, Link} from "react-router-dom";
import {AuthContext} from "../../stores/auth";
import {CategoryActionType, CategoryContext} from "../../stores/category";
import {useFindCategories} from "../../hooks/categories";
import Setup from "../setup/Setup";
import Logon from "../auth/Logon";
import Petitions from "../petitions/Petitions";
import Petition from "../petitions/petition/Petition";

export const Home = () => {
    const [authState, ] = useContext(AuthContext);
    const [categoriesState, categoriesDispatch] = useContext(CategoryContext);

    const categories = useFindCategories(['categories']);

    useEffect((): void => {
        if(categories.status === 'success') {
            categoriesDispatch({type: CategoryActionType.SET, payload: categories.data});
        }
    }, [categories.status]);

    if(!authState.principal) {
        return <Logon />;
    }

    if(categoriesState.categories.length == 0) {
        return <Setup />;

    }    
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">
                    D-Changes
                </h1>
                <p className="subtitle">
                    Together we can transform the world!
                </p>
            </div>
            <div>
                <Routes>
                    <Route path="/p/:id" element={<Petition />} />
                    <Route path="/" element={<Petitions />} />
                </Routes>
            </div>
        </section>      
    );
}