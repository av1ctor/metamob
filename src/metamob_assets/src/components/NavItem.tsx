import React, { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface Props {
    title: string;
    icon: string;
    href: string;
    redirect?: boolean;
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
                className={`navbar-item ${isActive? 'is-active': ''}`}
                to={props.href}
            >
                <i className={`la la-${props.icon}`}/>&nbsp;{props.title}
            </Link>
        :
            <a 
                className={`navbar-item ${isActive? 'is-active': ''}`}
                onClick={handleRedirect}
            >
                <i className={`la la-${props.icon}`}/>&nbsp;{props.title}
            </a>
    )
};

export default NavItem;