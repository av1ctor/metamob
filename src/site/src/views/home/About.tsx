import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
}

const About = (props: Props) => {
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="About us" />
            </div>

            <div className="has-text-centered">
                <img src="logo.svg" width="224" height="56"/>
            </div>

            <br/>

            <div className="columns is-desktop is-multiline">
                <div className="column is-6 has-text-justified">
                    <p>
                        <FormattedMessage defaultMessage="Metamob is a decentralized web3 app, running 100% on-chain on the Internet Computer where the users are the owners!"/>
                    </p>
                    <br/>
                    <p>
                        <FormattedMessage defaultMessage="All decisions are taken by the Metamob DAO (Decentralized Autonomous Organization). The DAO itself runs on Metamob, showing how capable the app is." />
                    </p>
                    <br/>
                    <p>
                        <FormattedMessage defaultMessage="Anyone can start new campaigns." /> <FormattedMessage defaultMessage="Organizations get support to advance in their fights." />
                    </p>
                    <p>
                        <FormattedMessage defaultMessage="Authorities and businesses can talk directly to their citizens and customers." />
                    </p>
                </div>
                <div className="column is-6 has-text-justified">
                    <p>
                        <FormattedMessage defaultMessage="Metamob is released under a open-source license. Anyone can contribute fixing bugs and adding new features." />
                    </p>
                    <br/>
                    <p>
                        <FormattedMessage defaultMessage="Our code repository is at" /> <a href="https://github.com/av1ctor/metamob" target="_blank"><i className="la la-github"/> GitHub</a>.
                    </p>
                </div>
            </div>
        </>
    );
};

export default About;