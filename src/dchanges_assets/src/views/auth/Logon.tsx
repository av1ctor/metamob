import React, { useCallback, useContext, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { AuthActionType, AuthContext, AuthState } from "../../stores/auth";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import { DChanges, ProfileResponse } from "../../../../declarations/dchanges/dchanges.did";
import Steps, { Step } from "../../components/Steps";
import UserCreateForm from "../users/user/Create";
import { loginUser } from "../../libs/users";
import { createMainActor } from "../../libs/backend";
import { ActorActionType, ActorContext } from "../../stores/actor";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const steps: Step[] = [
    {
        title: 'IC Identity authentication',
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
            const res = await main.userFindMe();
            if('ok' in res) {
                return res.ok;
            }
        }
        catch(e) {
        }

        return undefined;
    };

    const handleAuthenticated = useCallback(async () => {
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
            />
            <Grid container>
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
                    />
                }
                {step === 2 && 
                    <Button 
                        onClick={handleReturn}>
                        <i className="la la-check"/>&nbsp;Return to previous page
                    </Button>
                }
            </Grid>
        </div>
    );
};

export default Logon;