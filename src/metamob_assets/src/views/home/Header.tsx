import React, { useContext, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavItem from "../../components/NavItem";
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
        navigate(`/user/login?return=${window.location.hash.replace('#', '')}`);
    }, []);

    const handleLogout = useCallback(async () => {
        await authState.client?.logout();
        authDispatch({
            type: AuthActionType.LOGOUT,
            payload: undefined
        });
        props.onSuccess('Logged out!');
    }, []);

    const handleToggleMenu = useCallback(() => {
        burgerRef.current?.classList.toggle('is-active');
        menuRef.current?.classList.toggle('is-active');
    }, [burgerRef.current, menuRef.current]);

    const isLogged = !!authState.user;

    return (
        <nav 
            className="navbar is-warning has-shadow is-fixed-top" 
            role="navigation" 
            aria-label="main navigation"
        >
            <div className="navbar-brand">
                <Link className="navbar-item" to="/">
                    <img src="logo.svg" width="112" height="28"/>
                </Link>

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
                    <NavItem
                        title="Home"
                        icon="home"
                        href="/"
                    />
                    <NavItem
                        title="Places"
                        icon="globe"
                        href="/places"
                    />
                    <NavItem
                        title="Campaigns"
                        icon="bullhorn"
                        href="/campaigns"
                    />
                </div>

                <div className="navbar-end">
                    {isLogged &&
                        <div className="navbar-item has-dropdown is-hoverable">
                            <a className="navbar-link">
                                <Avatar id={authState.user?._id || 0} />
                            </a>

                            <div className="navbar-dropdown is-right">
                                <NavItem
                                    title="Campaigns"
                                    icon="bullhorn"
                                    href="/user/campaigns"
                                    redirect
                                />
                                <NavItem
                                    title="Donations"
                                    icon="money-bill"
                                    href="/user/donations"
                                    redirect
                                />
                                <NavItem
                                    title="Fundraisings"
                                    icon="lightbulb"
                                    href="/user/fundings"
                                    redirect
                                />
                                <NavItem
                                    title="Signatures"
                                    icon="signature"
                                    href="/user/signatures"
                                    redirect
                                />
                                <NavItem
                                    title="Votes"
                                    icon="vote-yea"
                                    href="/user/votes"
                                    redirect
                                />
                                <NavItem
                                    title="Places"
                                    icon="globe"
                                    href="/user/places"
                                    redirect
                                />
                                <hr className="navbar-divider"/>
                                <NavItem
                                    title="Profile"
                                    icon="user"
                                    href="/user/profile"
                                    redirect
                                />
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
                                    <i className="la la-user"/>&nbsp;Log in
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
