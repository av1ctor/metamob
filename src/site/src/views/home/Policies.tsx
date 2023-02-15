import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
}

const Policies = (props: Props) => {
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="Policies" />
            </div>

            <div className="has-text-centered">
                <img src="logo.svg" width="224" height="56"/>
            </div>

            <br/>

            <div className="columns is-desktop is-multiline">
                <div className="column is-6 has-text-justified">
                    <p>
                        <b><FormattedMessage defaultMessage="What is prohibited"/>:</b>
                        <div className="pl-4 pt-4">
                            <ol>
                                <li><FormattedMessage defaultMessage="Inciting violence"/>;</li>
                                <li><FormattedMessage defaultMessage="Hate speech"/>;</li>
                                <li><FormattedMessage defaultMessage="Deceiving others"/>;</li>
                                <li><FormattedMessage defaultMessage="Impersonating other people"/>;</li>
                                <li><FormattedMessage defaultMessage="Violate the privacy of others"/>;</li>
                                <li><FormattedMessage defaultMessage="Intimidate"/>;</li>
                                <li><FormattedMessage defaultMessage="Be unnecessarily graphic"/>;</li>
                                <li><FormattedMessage defaultMessage="Causing harm to children"/>;</li>
                                <li><FormattedMessage defaultMessage="Spamming"/>;</li>
                                <li><FormattedMessage defaultMessage="Include personal information"/>;</li>
                                <li><FormattedMessage defaultMessage="Violate the laws"/>.</li>
                            </ol>
                        </div>
                    </p>
                    <br/>
                    <p>
                        <FormattedMessage defaultMessage="Please report any prohibited content you may find. You will be rewarded if your report is accepted by our moderators." />
                    </p>
                </div>
                <div className="column is-6 has-text-justified">
                </div>
            </div>
        </>
    );
};

export default Policies;