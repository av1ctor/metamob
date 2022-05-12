import React, { useContext, useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { AuthActionType, AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Header = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const burgerRef = useRef<HTMLAnchorElement>(null);

    const navigate = useNavigate();

    const redirectToLogon = useCallback(() => {
        navigate('/user/login');
    }, []);

    const handleLogout = useCallback(async () => {
        await authState.client?.logout();
        authDispatch({
            type: AuthActionType.LOGOUT,
            payload: undefined
        });
        props.onSuccess('Logged out!');
    }, []);

    const redirectToProfile = useCallback(() => {
        navigate('/user/profile');
    }, []);

    const redirectToCampaigns = useCallback(() => {
        navigate('/user/campaigns');
    }, []);

    const handleToggleMenu = useCallback(() => {
        burgerRef.current?.classList.toggle('is-active');
        menuRef.current?.classList.toggle('is-active');
        console.log(burgerRef.current)
    }, [burgerRef.current, menuRef.current]);

    const isLogged = !!authState.user;

    return (
        <nav className="navbar is-warning" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item" href="/">
                    <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28"/>
                </a>

                <a 
                    ref={burgerRef}
                    role="button" 
                    className="navbar-burger" 
                    aria-label="menu" 
                    aria-expanded="false" 
                    onClick={handleToggleMenu}
                >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>

            <div 
                ref={menuRef}
                className="navbar-menu"
            >
                <div className="navbar-start">
                    <a className="navbar-item" href="/">
                    <i className="la la-home"/>&nbsp;Home
                    </a>
                </div>

                <div className="navbar-end">
                    {isLogged &&
                        <div className="navbar-item has-dropdown is-hoverable">
                            <a className="navbar-link">
                                <Avatar id={authState.user?._id || 0} />
                            </a>

                            <div className="navbar-dropdown is-right">
                                <a className="navbar-item" onClick={redirectToCampaigns}>
                                    <i className="la la-list"/>&nbsp;Campaigns
                                </a>
                                <a className="navbar-item" onClick={redirectToProfile}>
                                    <i className="la la-user"/>&nbsp;Profile
                                </a>
                                <hr className="navbar-divider"/>
                                <a className="navbar-item" onClick={handleLogout}>
                                    <i className="la la-sign-out-alt"/>&nbsp;Logout
                                </a>
                            </div>
                        </div>
                    }
                    
                    {!isLogged &&
                        <div className="navbar-item">
                            <div className="buttons">
                                <a 
                                    className="button is-success"
                                    onClick={redirectToLogon}
                                >
                                    <i className="la la-sign-in-alt"/>&nbsp;Login
                                </a>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </nav>
    );
};

export default Header;
