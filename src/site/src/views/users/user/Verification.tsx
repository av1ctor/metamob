import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useVerifyMe } from "../../../hooks/users";
import Button from "../../../components/Button";

interface Props {
};

const Verification = (props: Props) => {
    const {user} = useAuth();
    const {toggleLoading, showSuccess, showError} = useUI();
    const {secret} = useParams()
    const navigate = useNavigate();
    const verifyMut = useVerifyMe();

    const handleVerify = useCallback(async () => {
        
        try {
            toggleLoading(true);
            
            await verifyMut.mutateAsync({req: {secret: secret || ''}});
            
            showSuccess("Verification succeeded!");
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [user, secret]);

    const redirectToLogon = useCallback(() => {
        navigate(`/`);
    }, []);

    if(!user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage id="Verification" defaultMessage="Verification" />
            </div>

            <div>
                <div className="has-text-centered">
                    <div className="mb-2">
                        {!user.active?
                            <FormattedMessage defaultMessage="Click on the button bellow to verify your account." />
                        :
                            <FormattedMessage defaultMessage="Congratulations. Your account is verified!" />
                        }
                    </div>
                    {!user.active?
                        <Button
                            onClick={handleVerify}
                        >
                            Verify me
                        </Button>
                    :
                        <Button
                            onClick={redirectToLogon}
                        >
                            Go to main page
                        </Button>
                    }
                </div>
            </div>
        </>
    );
};

export default Verification;