import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { isModerator } from "../../../libs/users";
import ToModerate from "./reports/ToModerate";
import Button from "../../../components/Button";
import BecomeModForm from "./BecomeMod";
import MyReports from "./reports/MyReports";
import AgainstMe from "./reports/AgainstMe";
import { FormattedMessage } from "react-intl";
import { useAuth } from "../../../hooks/auth";

interface Props {
};

const Reports = (props: Props) => {
    const {user} = useAuth();

    const [modals, setModals] = useState({
        becomeMod: false,
    });

    const toggleBecomeMod = useCallback(() => {
        setModals(modals => ({
            ...modals,
            becomeMod: !modals.becomeMod,
        }));
    }, []);

    if(!user) {
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
                {isModerator(user)?
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