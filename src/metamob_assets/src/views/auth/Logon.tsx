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
    const {isAuthenticated, isLogged: isRegistered, login} = useAuth();

    const {showSuccess, showError} = useUI();

    const [step, setStep] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const handleAuthenticated = useCallback(() => {
        setStep(step => step + 1)
    }, []);

    const handleRegistered = useCallback(async (msg: string) => {
        showSuccess(msg);
        setStep(step => step + 1);
    }, []);

    const handleAuthenticateII = useCallback(async () => {
        try {
            await login(ICProviderType.InternetIdentity, handleAuthenticated, showError);
        }
        catch(e) {
            showError(e);
        }
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
                    <Button 
                        onClick={handleAuthenticateII}>
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