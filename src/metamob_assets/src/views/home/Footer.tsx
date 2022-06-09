import React from "react";
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
                                    About us
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs">
                                    Jobs
                                </Link>
                            </li>
                            <li>
                                <Link to="/team">
                                    Team
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="column is-4">
                        <ul>
                            <li>
                                <Link to="/policies">
                                    Policies
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy">
                                    Privacy
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact">
                                    Contact
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