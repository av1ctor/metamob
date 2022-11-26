import React, { useContext, useCallback, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../components/Badge";
import { LangIcon } from "../../components/LangIcon";
import NavItem from "../../components/NavItem";
import { useCountUnreadNotificationsByUser } from "../../hooks/notifications";
import { useUI } from "../../hooks/ui";
import { Lang, languages, loadMessages } from "../../libs/intl";
import { ActorContext } from "../../stores/actor";
import { AuthActionType, AuthContext } from "../../stores/auth";
import { IntlActionType, IntlContext } from "../../stores/intl";
import Avatar from "../users/Avatar";

interface Props {
};

const Header = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, authDispatch] = useContext(AuthContext);
    const [intl, intlDispatch] = useContext(IntlContext);

    const {showSuccess} = useUI();
    
    const menuRef = useRef<HTMLDivElement>(null);
    const burgerRef = useRef<HTMLAnchorElement>(null);

    const navigate = useNavigate();

    const notifications = useCountUnreadNotificationsByUser(actors.main);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=${window.location.hash.replace('#', '')}`);
    }, []);

    const handleLogout = useCallback(async () => {
        await auth.client?.logout();
        authDispatch({
            type: AuthActionType.LOGOUT,
            payload: undefined
        });
        showSuccess('Logged out!');
    }, []);

    const handleToggleMenu = useCallback(() => {
        burgerRef.current?.classList.toggle('is-active');
        menuRef.current?.classList.toggle('is-active');
    }, [burgerRef.current, menuRef.current]);

    const handleChangeLanguage = useCallback(async (lang: Lang) => {
        const messages = await loadMessages(lang.locale);
        intlDispatch({
            type: IntlActionType.CHANGE,
            payload: {
                locale: lang.locale,
                flag: lang.flag,
                title: lang.title,
                messages: messages
            }
        })
    }, []);

    const isLogged = !!auth.user;

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
                    <div className="navbar-item has-dropdown is-hoverable">
                        <a className="navbar-link">
                            <LangIcon flag={intl.flag} />
                        </a>
                        <div className="navbar-dropdown is-right">
                            {languages.map(l => 
                                <span key={l.locale}>
                                    <a 
                                        className={`navbar-item ${intl.locale === l.locale? 'is-active': ''}`}
                                        onClick={() => handleChangeLanguage(l)}
                                    >
                                        <LangIcon flag={l.flag} title={l.title} />
                                    </a>
                                </span>)
                            }
                        </div>
                    </div>

                    {isLogged &&
                        <div className="navbar-item has-dropdown is-hoverable">
                            <a className="navbar-link">
                                <Avatar id={auth.user?._id || 0} />
                                {notifications.data? <div className="notification-badge floating"><Badge>{notifications.data}</Badge></div>: undefined}
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
                                <hr className="navbar-divider"/>
                                <NavItem
                                    title="Places"
                                    icon="globe"
                                    href="/user/places"
                                    redirect
                                />
                                <hr className="navbar-divider"/>
                                <NavItem
                                    title="Reports"
                                    icon="flag"
                                    href="/user/reports"
                                    redirect
                                />
                                <NavItem
                                    title="Challenges"
                                    icon="chess"
                                    href="/user/challenges"
                                    redirect
                                />
                                <hr className="navbar-divider"/>
                                <NavItem
                                    title="Notifications"
                                    icon="comment-dots"
                                    href="/user/notifications"
                                    redirect
                                >
                                    {notifications.data? <div className="notification-badge floating"><Badge>{notifications.data}</Badge></div>: undefined}
                                </NavItem>
                                <NavItem
                                    title="Profile"
                                    icon="user"
                                    href="/user/profile"
                                    redirect
                                />
                                <hr className="navbar-divider"/>
                                <a className="navbar-item" onClick={handleLogout}>
                                    <i className="la la-sign-out-alt"/>&nbsp;<FormattedMessage id="Logout" defaultMessage="Logout" />
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
                                    <i className="la la-user"/>&nbsp;<FormattedMessage id="Login" defaultMessage="Log in" />
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

