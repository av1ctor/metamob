import React, { useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

    const redirectToDonations = useCallback(() => {
        navigate('/user/donations');
    }, []);
    
    const redirectToSignatures = useCallback(() => {
        navigate('/user/signatures');
    }, []);

    const redirectToVotes = useCallback(() => {
        navigate('/user/votes');
    }, []);

    const redirectToPlaces = useCallback(() => {
        navigate('/user/places');
    }, []);

    const handleToggleMenu = useCallback(() => {
        burgerRef.current?.classList.toggle('is-active');
        menuRef.current?.classList.toggle('is-active');
    }, [burgerRef.current, menuRef.current]);

    const isLogged = !!authState.user;

    return (
        <nav className="navbar is-warning has-shadow is-fixed-top" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item" href="/">
                    <img src="logo.svg" width="112" height="28"/>
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
                                    <i className="la la-volume-up"/>&nbsp;Campaigns
                                </a>
                                <a className="navbar-item" onClick={redirectToDonations}>
                                    <i className="la la-money-bill"/>&nbsp;Donations
                                </a>
                                <a className="navbar-item" onClick={redirectToSignatures}>
                                    <i className="la la-signature"/>&nbsp;Signatures
                                </a>
                                <a className="navbar-item" onClick={redirectToVotes}>
                                    <i className="la la-vote-yea"/>&nbsp;Votes
                                </a>
                                <a className="navbar-item" onClick={redirectToPlaces}>
                                    <i className="la la-globe"/>&nbsp;Places
                                </a>
                                <hr className="navbar-divider"/>
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
                                    <i className="la la-user"/>&nbsp;Login
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
