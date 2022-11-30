import React, { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/Button";
import Container from "../../components/Container";
import Steps, { Step } from "../../components/Steps";
import UserCreateForm from "../users/user/Create";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../hooks/ui";
import { useAuth } from "../../hooks/auth";
import { ICProviderType } from "../../interfaces/icprovider";

interface Props {
}

const steps: Step[] = [
    {
        title: 'Authentication',
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
    const {isAuthenticated, isLogged: isRegistered, login} = useAuth();

    const {showSuccess, showError} = useUI();

    const [step, setStep] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const handleRegistered = useCallback(async (msg: string) => {
        showSuccess(msg);
        setStep(step => step + 1);
    }, []);

    const handleLogin = useCallback(async (providerType: ICProviderType) => {
        try {
            const res = await login(providerType);
            if(res.err) {
                showError(res.err);
            }
            else {
                setStep(step => step + 1);
            }
        }
        catch(e) {
            showError(e);
        }
    }, [login]);

    const handleAuthenticateII = useCallback(async () => {
        handleLogin(ICProviderType.InternetIdentity);
    }, [handleLogin]);

    const handleAuthenticatePlug = useCallback(async () => {
        handleLogin(ICProviderType.Plug);
    }, [handleLogin]);
    
    const handleAuthenticateStoic = useCallback(async () => {
        handleLogin(ICProviderType.Stoic);
    }, [login]);

    const handleReturn = useCallback(() => {
        navigate(getReturnUrl());
    }, [navigate]);

    useEffect(() => {
        if(isRegistered) {
            setStep(2);
        }
        else {
            if(isAuthenticated) {
                setStep(1);
            }
        }
    }, [isAuthenticated, isRegistered]);

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
                    <div className="block has-text-centered">
                        <div className="is-size-5 mb-2">
                            <FormattedMessage defaultMessage="Please choose a provider"/>:
                        </div>
                        <div className="login-providers">
                            <Button 
                                onClick={handleAuthenticateII}>
                                <img src="providers/ii.svg" height="" />
                                Internet Identity
                            </Button>
                            <Button 
                                color="info"
                                onClick={handleAuthenticatePlug}>
                                <img src="providers/plug.svg" height="" />
                                Plug Wallet
                            </Button>
                            <Button 
                                color="warning"
                                onClick={handleAuthenticateStoic}>
                                <img src="providers/stoic.png" height="" />
                                Stoic Wallet
                            </Button>
                        </div>
                    </div>
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