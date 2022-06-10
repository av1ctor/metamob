import React, { useCallback, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { useCreateCampaign } from "../../hooks/campaigns";
import { AuthContext } from "../../stores/auth";
import { CategoryContext } from "../../stores/category";
import CreateForm from "../campaigns/campaign/Create";
import HotCampaigns from "../campaigns/Hot";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Front = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);

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

    const isLoggedIn = !!authState.user;

    return (
        <>
            <div className="columns">
                <div className="column is-6 is-align-self-center">
                    <div className="is-size-1 title">
                        <strong>Create, donate, vote, sign and fund extraordinary mobilizations!</strong>
                    </div>
                    <div className="mt-2"></div>
                    <div className="subtitle is-size-4">
                        metamob is a decentralized web3 app, running on the <a href="https://dfinity.org/" target="_blank"><img src="/ic-logo-horizontal.svg" width={250} /></a>, 
                        that let's any user start mobilizations by creating campaigns
                    </div>
                    <div className="field is-grouped has-text-centered">
                        <p className="control">
                            <Button
                                size="large"
                                color="info"
                                onClick={handleExplore}
                            >
                                &nbsp;&nbsp;Explore&nbsp;&nbsp;
                            </Button>
                        </p>
                        <p className="control">
                            <Button
                                size="large"
                                color="success"
                                onClick={isLoggedIn? toggleCreate: redirectToLogon}
                            >
                                &nbsp;&nbsp;Create&nbsp;&nbsp;
                            </Button>
                        </p>
                    </div>
                </div>
                <div className="column is-6 hor-campaigns">
                    <HotCampaigns 
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                </div>
            </div>
            <br/>
            <div className="has-text-centered">
                <div className="subtitle is-size-4 mb-6">
                    <strong>Create and participate in campaigns</strong>
                </div>
                <div className="columns">
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-key"/></div>
                        <div className="subtitle mb-1">
                            <strong>Authenticate on the II</strong>
                        </div>
                        <div className="text">
                            Authenticate using <a href="https://dfinity.org/howitworks/web-authentication-identity" target="_blank">Internet Identity</a> and create a new user profile.<br/>
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-globe"/></div>
                        <div className="subtitle mb-1">
                            <strong>Find or create your place</strong>
                        </div>
                        <div className="text">
                            You can create a new place <Link to="/user/places">here</Link> or use an existing one.<br/>
                            They can be restricted by e-mail list, DIP20 (tokens) or DIP721 (NFT's) balances, so you can control who can participate.
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-bullhorn"/></div>
                        <div className="subtitle mb-1">
                            <strong>Create your campaign</strong>
                        </div>
                        <div className="text">
                            Create a new campaign and start a mobilization!<br/>
                            Four types of campaigns are supported: signatures, donations, votes and fundraising.
                        </div>
                    </div>
                    <div className="column is-3 front-info">
                        <div className="icon is-size-2"><i className="la la-people-carry"/></div>
                        <div className="subtitle mb-1">
                            <strong>Participate!</strong>
                        </div>
                        <div className="text">
                            Depending on the campaign, you can sign, donate, vote and fund them.<br/>
                            You can also open reports about any abusive content and get a reward in metamob tokens (MMT) if they are accepted!
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                header={<span>Create campaign</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default Front;