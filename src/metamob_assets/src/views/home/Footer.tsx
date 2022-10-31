import React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="footer has-background-dark has-text-white is-size-7">
            <div className="container">
                <div className="columns">
                    <div className="column has-text-centered">
                        <a href="https://dfinity.org" target="_blank">
                            <img src="/powered-by.svg" />
                        </a>
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-4">
                        <ul>
                            <li>
                                <Link to="/about">
                                    <FormattedMessage id="Aboutus" defaultMessage="About us"/>
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs">
                                    <FormattedMessage id="Jobs" defaultMessage="Jobs" />
                                </Link>
                            </li>
                            <li>
                                <Link to="/team">
                                    <FormattedMessage id="Team" defaultMessage="Team" />
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="column is-4">
                        <ul>
                            <li>
                                <Link to="/policies">
                                    <FormattedMessage id="Policies" defaultMessage="Policies" />
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy">
                                    <FormattedMessage id="Privacy" defaultMessage="Privacy" />
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact">
                                    <FormattedMessage id="Contact" defaultMessage="Contact" />
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="column is-4">
                        <a 
                            href="https://facebook.com/metamobdotorg"
                            target="_blank"
                        >
                            <div className="icon is-size-4"><i className="la la-facebook"/></div>
                        </a>
                        <a 
                            href="https://twitter.com/metamobdotorg"
                            target="_blank"
                        >
                            <div className="icon is-size-4"><i className="la la-twitter"/></div>
                        </a>
                        <a 
                            href="https://instagram.com/metamobdotorg"
                            target="_blank"
                        >
                            <div className="icon is-size-4"><i className="la la-instagram"/></div>
                        </a>
                    </div>
                </div>
                <div className="divider">
                </div>
                <div>
                    © 2022 metamob
                </div>
            </div>
        </footer>
    );
};

export default Footer;