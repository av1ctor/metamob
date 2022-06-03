import React, { useCallback, useContext, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { AuthActionType, AuthContext } from "../../stores/auth";
import Button from "../../components/Button";
import Container from "../../components/Container";
import { DChanges, ProfileResponse } from "../../../../declarations/dchanges/dchanges.did";
import Steps, { Step } from "../../components/Steps";
import UserCreateForm from "../users/user/Create";
import { loginUser } from "../../libs/users";
import { createLedgerActor, createMainActor } from "../../libs/backend";
import { ActorActionType, ActorContext } from "../../stores/actor";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const steps: Step[] = [
    {
        title: 'IC Identity',
        icon: 'key',
    },
    {
        title: 'User registration',
        icon: 'user',
    },
    {
        title: 'Back to previous page',
        icon: 'check',
    },
];

const Logon = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [, actorDispatch] = useContext(ActorContext);

    const [step, setStep] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const loadAuthenticatedUser = async (
        main: DChanges        
    ): Promise<ProfileResponse|undefined> => {
        try {
            props.toggleLoading(true);

            const res = await main.userFindMe();
            if('ok' in res) {
                return res.ok;
            }
        }
        catch(e) {
        }
        finally {
            props.toggleLoading(false);
        }

        return undefined;
    };

    const handleAuthenticated = useCallback(async () => {
        try {
            props.toggleLoading(true);

            const identity = authState.client?.getIdentity();
            if(!identity) {
                props.onError('IC Identity should not be null');
                return;
            }

            authDispatch({
                type: AuthActionType.SET_IDENTITY, 
                payload: identity
            });
            props.onSuccess('User authenticated!');

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
        finally {
            props.toggleLoading(false);
        }
    }, [authState.client]);

    const handleRegistered = useCallback(async (msg: string) => {
        props.onSuccess(msg);
        setStep(step => step + 1);
    }, []);

    const handleAuthenticate = useCallback(async () => {
        if(authState.client) {
            loginUser(authState.client, handleAuthenticated, props.onError);
        }
    }, [authState.client, handleAuthenticated]);

    const handleReturn = useCallback(() => {
        navigate(getReturnUrl());
    }, [navigate]);

    if(!authState.client) {
        props.onError('No IC client found');
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
                        <i className="la la-key"/>&nbsp;Authenticate
                    </Button>
                }
                {step === 1 && 
                    <UserCreateForm
                        onSuccess={handleRegistered} 
                        onError={props.onError} 
                        toggleLoading={props.toggleLoading}
                    />
                }
                {step === 2 && 
                    <Button 
                        onClick={handleReturn}>
                        <i className="la la-check"/>&nbsp;Return
                    </Button>
                }
            </Container>
        </div>
    );
};

export default Logon;