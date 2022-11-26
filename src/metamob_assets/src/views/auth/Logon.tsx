import React, { useCallback, useContext, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { AuthActionType, AuthContext } from "../../stores/auth";
import Button from "../../components/Button";
import Container from "../../components/Container";
import { Metamob, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import Steps, { Step } from "../../components/Steps";
import UserCreateForm from "../users/user/Create";
import { loginUser } from "../../libs/users";
import { createLedgerActor, createMainActor, createMmtActor } from "../../libs/backend";
import { ActorActionType, ActorContext } from "../../stores/actor";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../hooks/ui";

interface Props {
}

const steps: Step[] = [
    {
        title: 'II Authentication',
        icon: 'key',
    },
    {
        title: 'Registration',
        icon: 'user',
    },
    {
        title: 'Back to previous page',
        icon: 'check',
    },
];

const Logon = (props: Props) => {
    const [auth, authDispatch] = useContext(AuthContext);
    const [, actorDispatch] = useContext(ActorContext);

    const {toggleLoading, showSuccess, showError} = useUI();

    const [step, setStep] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const loadAuthenticatedUser = async (
        main: Metamob        
    ): Promise<ProfileResponse|undefined> => {
        try {
            toggleLoading(true);

            const res = await main.userFindMe();
            if('ok' in res) {
                return res.ok;
            }
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }

        return undefined;
    };

    const handleAuthenticated = useCallback(async () => {
        try {
            toggleLoading(true);

            const identity = auth.client?.getIdentity();
            if(!identity) {
                showError('IC Identity should not be null');
                return;
            }

            authDispatch({
                type: AuthActionType.SET_IDENTITY, 
                payload: identity
            });
            showSuccess('User authenticated!');

            const main = createMainActor(identity);
            actorDispatch({
                type: ActorActionType.SET_MAIN,
                payload: main
            });

            const ledger = createLedgerActor(identity);
            actorDispatch({
                type: ActorActionType.SET_LEDGER,
                payload: ledger
            });        

            const mmt = createMmtActor(identity);
            actorDispatch({
                type: ActorActionType.SET_MMT,
                payload: mmt
            });        

            const user = await loadAuthenticatedUser(main);
            if(user) {
                authDispatch({
                    type: AuthActionType.SET_USER, 
                    payload: user
                });
                setStep(2);
            }
            else {
                setStep(step => step + 1);
            }
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [auth.client]);

    const handleRegistered = useCallback(async (msg: string) => {
        showSuccess(msg);
        setStep(step => step + 1);
    }, []);

    const handleAuthenticate = useCallback(async () => {
        if(auth.client) {
            loginUser(auth.client, handleAuthenticated, showError);
        }
    }, [auth.client, handleAuthenticated]);

    const handleReturn = useCallback(() => {
        navigate(getReturnUrl());
    }, [navigate]);

    if(!auth.client) {
        showError('No IC client found');
        navigate(getReturnUrl());
        return null;
    }

    return (
        <div className="container has-text-centered">
            <br/>
            <Steps
                step={step}
                steps={steps}
                narrow
            />
            <Container>
                {step === 0 && 
                    <Button 
                        onClick={handleAuthenticate}>
                        <i className="la la-key"/>&nbsp;<FormattedMessage id="Authenticate" defaultMessage="Authenticate"/>
                    </Button>
                }
                {step === 1 && 
                    <UserCreateForm
                        onSuccess={handleRegistered} 
                    />
                }
                {step === 2 && 
                    <Button 
                        onClick={handleReturn}>
                        <i className="la la-check"/>&nbsp;<FormattedMessage id="Return" defaultMessage="Return"/>
                    </Button>
                }
            </Container>
        </div>
    );
};

export default Logon;