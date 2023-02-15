import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
}

const Privacy = (props: Props) => {
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="Privacy" />
            </div>

            <div className="has-text-centered">
                <img src="logo.svg" width="224" height="56"/>
            </div>

            <br/>

            <div className="columns is-desktop is-multiline">
                <div className="column is-6 has-text-justified">
                    <p>
                        <FormattedMessage defaultMessage="When you create or participate on a campaign, we collect the data listed bellow" />
                    </p>
                    <div className="pl-4 pt-4">
                        <ol>
                            <li><FormattedMessage defaultMessage="Your user name"/>;</li>
                            <li><FormattedMessage defaultMessage="Your e-mail"/>;</li>
                            <li><FormattedMessage defaultMessage="Your IP"/>;</li>
                            <li><FormattedMessage defaultMessage="Your country"/>;</li>
                            <li><FormattedMessage defaultMessage="All your participations on campaigns, even the anonymous ones"/>!</li>
                        </ol>
                    </div>
                </div>
                <div className="column is-6 has-text-justified">
                </div>
            </div>
        </>
    );
};

export default Privacy;