import React, { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface Props {
    title: string;
    icon: string;
    href: string;
    redirect?: boolean;
    className?: string;
    children?: any;
}

const NavItem = (props: Props) => {

    const location = useLocation();
    const navigate = useNavigate();

    const handleRedirect = useCallback(() => {
        navigate(props.href);
    }, [props.href]);

    const isActive = location.pathname === props.href;

    return (
        !props.redirect?
            <Link 
                className={`navbar-item ${isActive? 'is-active': ''} ${props.className}`}
                to={props.href}
            >
                <i className={`la la-${props.icon}`}/>&nbsp;<FormattedMessage id={props.title} defaultMessage={props.title}/>
                {props.children}
            </Link>
        :
            <a 
                className={`navbar-item ${isActive? 'is-active': ''} ${props.className}`}
                onClick={handleRedirect}
            >
                <i className={`la la-${props.icon}`}/>&nbsp;<FormattedMessage id={props.title} defaultMessage={props.title}/>
                {props.children}
            </a>
    )
};

export default NavItem;