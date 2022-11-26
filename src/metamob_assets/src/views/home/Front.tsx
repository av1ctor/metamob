import React, { useCallback, useContext, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { useCreateCampaign } from "../../hooks/campaigns";
import { useUI } from "../../hooks/ui";
import { AuthContext } from "../../stores/auth";
import { CategoryContext } from "../../stores/category";
import CreateForm from "../campaigns/campaign/Create";
import HotCampaigns from "../campaigns/Hot";

interface Props {
}

const Front = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);

    const {toggleLoading, showSuccess, showError} = useUI();

    const [modals, setModals] = useState({
        create: false,
    });

    const navigate = useNavigate();

    const redirectToLogon = useCallback(() => {
        navigate('/user/login');
    }, []);

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const handleExplore = useCallback(() => {
        navigate("/campaigns");
    }, []);

    const createCampaignMut = useCreateCampaign();

    const isLoggedIn = !!auth.user;

    return (
        <>
            <div className="columns">
                <div className="column is-6 is-align-self-center">
                    <div className="is-size-1 title">
                        <strong>
                            <FormattedMessage
                                defaultMessage="Create, donate, vote, sign and fund extraordinary mobilizations!" />
                        </strong>
                    </div>
                    <div className="mt-2"></div>
                    <div className="subtitle is-size-4">
                        <FormattedMessage
                            defaultMessage="Metamob is a decentralized web3 app, that lets any user start mobilizations by creating campaigns" />
                    </div>
                    <div className="field is-grouped has-text-centered">
                        <p className="control">
                            <Button
                                size="large"
                                color="info"
                                onClick={handleExplore}
                            >
                                &nbsp;&nbsp;<FormattedMessage id="Explore" defaultMessage="Explore" />&nbsp;&nbsp;
                            </Button>
                        </p>
                        <p className="control">
                            <Button
                                size="large"
                                color="success"
                                onClick={isLoggedIn? toggleCreate: redirectToLogon}
                            >
                                &nbsp;&nbsp;<FormattedMessage id="Create" defaultMessage="Create" />&nbsp;&nbsp;
                            </Button>
                        </p>
                    </div>
                </div>
                <div className="column is-6 hor-campaigns">
                    <HotCampaigns 
                        
                        
                        
                    />
                </div>
            </div>
            <br/>
            <div className="has-text-centered">
                <div className="subtitle is-size-4 mb-6">
                    <strong><FormattedMessage defaultMessage="Create and participate in campaigns" /></strong>
                </div>
                <div className="columns">
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-key"/></div>
                        <div className="subtitle mb-1">
                            <strong><FormattedMessage defaultMessage="Authenticate on the II" /></strong>
                        </div>
                        <div className="text">
                            <FormattedMessage defaultMessage="Authenticate using"/>&nbsp;<a href="https://dfinity.org/howitworks/web-authentication-identity" target="_blank">Internet Identity</a>&nbsp;<FormattedMessage defaultMessage="and create a new user profile."/><br/>
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-globe"/></div>
                        <div className="subtitle mb-1">
                            <strong><FormattedMessage defaultMessage="Find or create your place"/></strong>
                        </div>
                        <div className="text">
                            <FormattedMessage defaultMessage="You can create a new place"/>&nbsp;<Link to="/user/places"><FormattedMessage id="here" defaultMessage="here"/></Link>&nbsp;<FormattedMessage defaultMessage="or use an existing one."/><br/>
                            <FormattedMessage defaultMessage="They can be restricted by e-mail list, DIP20 (tokens) or DIP721 (NFT's) balances, so you can control who can participate." />
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-bullhorn"/></div>
                        <div className="subtitle mb-1">
                            <strong><FormattedMessage defaultMessage="Create your campaign"/></strong>
                        </div>
                        <div className="text">
                            <FormattedMessage defaultMessage="Create a new campaign and start a mobilization!"/><br/>
                            <FormattedMessage defaultMessage="Four types of campaigns are supported: signatures, donations, votes and fundraising."/>
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-people-carry"/></div>
                        <div className="subtitle mb-1">
                            <strong><FormattedMessage defaultMessage="Participate!"/></strong>
                        </div>
                        <div className="text">
                            <FormattedMessage defaultMessage="Depending on the campaign, you can sign, donate, vote and fund them."/><br/>
                            <FormattedMessage defaultMessage="You can also open reports about any abusive content and get a reward in metamob tokens (MMT) if they are accepted!"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="has-text-centered">
                <div className="subtitle is-size-4 mt-6 mb-6">
                    <strong><FormattedMessage defaultMessage="Together we can change the world! One campaign at time."/></strong>
                </div>
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create campaign"/></span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    onClose={toggleCreate}
                    
                    
                    
                />
            </Modal>
        </>
    );
};

export default Front;