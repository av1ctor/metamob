import React, { useCallback, useContext, useState } from "react";
import Modal from "../../../components/Modal";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";
import ToModerate from "./reports/ToModerate";
import Button from "../../../components/Button";
import BecomeModForm from "./BecomeMod";
import MyReports from "./reports/MyReports";
import AgainstMe from "./reports/AgainstMe";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
};

const Reports = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const {toggleLoading, showSuccess, showError} = useUI();

    const [modals, setModals] = useState({
        becomeMod: false,
    });

    const toggleBecomeMod = useCallback(() => {
        setModals(modals => ({
            ...modals,
            becomeMod: !modals.becomeMod,
        }));
    }, []);

    if(!auth.user) {
        return <div><FormattedMessage id="Forbidden" defaultMessage="Forbidden"/></div>;
    }

    return (
        <>
            <MyReports
                
                
                
            />

            <div className="mt-4">
                <AgainstMe
                />
            </div>

            <div className="mt-4">
                {isModerator(auth.user)?
                    <ToModerate
                        
                        
                        
                    />
                :
                    <div className="container border mt-6 p-4">
                        <div className="has-text-centered">
                            <b><FormattedMessage defaultMessage="Become a moderator and receive MMT's on every moderation done!"/></b>
                        </div>
                        <div className="field is-grouped mt-2 has-text-centered">
                            <div className="control m-auto">
                                <Button 
                                    onClick={toggleBecomeMod}
                                >
                                    <FormattedMessage id="Sign up" defaultMessage="Sign up"/>!
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <Modal
                header={<span><FormattedMessage defaultMessage="Become a moderator"/></span>}
                isOpen={modals.becomeMod}
                onClose={toggleBecomeMod}
            >
                <BecomeModForm
                    onClose={toggleBecomeMod}
                />
            </Modal>
        </>
    );
};

export default Reports;