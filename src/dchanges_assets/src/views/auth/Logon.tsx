import React, { useCallback, useContext, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import {dchanges} from "../../../../declarations/dchanges";
import { AuthActionType, AuthContext, AuthState } from "../../stores/auth";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import { Profile } from "../../../../declarations/dchanges/dchanges.did";
import Steps, { Step } from "../../components/Steps";
import UserCreateForm from "../users/Create";

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
    const [state, dispatch] = useContext(AuthContext);

    const [step, setStep] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const loadLoggedUser = async (): Promise<Profile|undefined> => {
        const res = await dchanges.userFindMe();
        if('ok' in res) {
            const user = res.ok;
            dispatch({type: AuthActionType.SET_USER, payload: user});
            return user;
        }

        return undefined;
    };

    const handleAuthenticated = useCallback(async () => {
        dispatch({
            type: AuthActionType.SET_PRINCIPAL, 
            payload: state.client?.getIdentity().getPrincipal().toText()
        });
        props.onSuccess('User authenticated!');
        const user = await loadLoggedUser();
        if(user) {
            setStep(2);
        }
        else {
            setStep(step => step + 1);
        }
    }, []);

    const handleRegistered = useCallback(async (msg: string) => {
        props.onSuccess(msg);
        setStep(step => step + 1);
    }, []);

    const handleAuthenticate = useCallback(async () => {
        const width = 500;
        const height = screen.height;
        const left = ((screen.width/2)-(width/2))|0;
        const top = ((screen.height/2)-(height/2))|0; 
        
        state.client?.login({
            identityProvider: "https://identity.ic0.app",
            windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
            onSuccess: handleAuthenticated,
            onError: (msg: string|undefined) => {
                props.onError(msg);
            }
        });
    }, [state.client]);

    const handleReturn = useCallback(() => {
        navigate(getReturnUrl());
    }, [navigate]);

    if(!state.client) {
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