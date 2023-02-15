import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
}

const Jobs = (props: Props) => {
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="Jobs" />
            </div>

            <div className="has-text-centered">
                <img src="logo.svg" width="224" height="56"/>
            </div>

            <br/>

            <div className="columns is-desktop is-multiline">
                <div className="column is-6 has-text-justified">
                    <p>
                        <FormattedMessage defaultMessage="At the moment there's no positions open, but you can contribute at" /> <a href="https://github.com/av1ctor/metamob" target="_blank"><i className="la la-github"/> Github</a>.
                    </p>
                </div>
                <div className="column is-6 has-text-justified">
                </div>
            </div>
        </>
    );
};

export default Jobs;