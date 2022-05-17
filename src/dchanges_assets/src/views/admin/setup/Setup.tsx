import React, {useState, useEffect, useContext, useCallback} from "react";
import { Link } from "react-router-dom";
import { DChanges, ProfileRequest } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import Steps, { Step } from "../../../components/Steps";
import { createMainActor } from "../../../libs/backend";
import { loginUser } from "../../../libs/users";
import { ActorActionType, ActorContext } from "../../../stores/actor";
import { AuthActionType, AuthContext } from "../../../stores/auth";
import UserSetupForm from "./User";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const steps: Step[] = [
    {
        title: 'IC Identity authentication',
        icon: 'key',
    },
    {
        title: 'Admin registration',
        icon: 'user',
    },
    {
        title: 'Done',
        icon: 'check',
    },
];

const Setup = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [actorState, actorDispatch] = useContext(ActorContext);

    const [step, setStep] = useState(0);
    
    const createUser = useCallback(async (req: ProfileRequest) => {
        try {
            if(!actorState.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await actorState.main.userCreate(req);
            
            if('ok' in res) {
                const user = res.ok;
                authDispatch({
                    type: AuthActionType.SET_USER, 
                    payload: user
                });
                props.onSuccess('Admin created!');
                setStep(step => step + 1);
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
    }, [actorState.main]);

    const handleAuthenticated = useCallback(() => {
        const identity = authState.client?.getIdentity();
        if(!identity) {
            props.onError('IC Identity should not be null');
            return;
        }
        
        authDispatch({
            type: AuthActionType.SET_IDENTITY, 
            payload: identity
        });
        
        const main = createMainActor(identity);
        actorDispatch({
            type: ActorActionType.SET_MAIN,
            payload: main
        });
        
        props.onSuccess('User authenticated!');
        setStep(step => step + 1);
    }, [authState.client]);

    const handleAuthenticate = useCallback(async () => {
        if(authState.client) {
            loginUser(authState.client, handleAuthenticated, props.onError)
        }
    }, [authState.client, handleAuthenticated]);

    const loadCurrentUser = async (
        main: DChanges
    ) => {
        try {
            const res = await main.userFindMe();
            if('ok' in res) {
                const user = res.ok;
                authDispatch({
                    type: AuthActionType.SET_USER, 
                    payload: user
                });
            }
        }
        catch(e) {
            props.onError(e);
        }
    };

    useEffect(() => {
        if(actorState.main) {
            loadCurrentUser(actorState.main);
            setStep(1);
        }
    }, [actorState.main]);

    useEffect(() => {
        if(authState.user) {
            setStep(2);
        }
    }, [authState.user]);
  
    return (
        <div>
            <div>Setup</div>
            <div className="container has-text-centered">
                <br/>
                <Steps
                    step={step}
                    steps={steps}
                />
                <Container>
                    {step === 0 && 
                        <Button 
                            onClick={handleAuthenticate}>
                            <i className="la la-key"/>&nbsp;Authenticate
                        </Button>
                    }
                    {step === 1 && 
                        <UserSetupForm 
                            onCreate={createUser}
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                        />
                    }
                    {step === 2 && 
                        <div>
                            The setup have been finished! <Link to="/">Go the main page</Link>.
                        </div>
                    }
                </Container>
            </div>
        </div>
    );
};


export default Setup;