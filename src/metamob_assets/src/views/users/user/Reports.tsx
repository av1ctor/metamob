import React, { useCallback, useContext, useState } from "react";
import Modal from "../../../components/Modal";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";
import Moderations from "./reports/Moderations";
import Button from "../../../components/Button";
import BecomeModForm from "./BecomeMod";
import MyReports from "./reports/MyReports";
import AgainstReports from "./reports/Against";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Reports = (props: Props) => {
    const [authState, ] = useContext(AuthContext);

    const [modals, setModals] = useState({
        becomeMod: false,
    });

    const toggleBecomeMod = useCallback(() => {
        setModals(modals => ({
            ...modals,
            becomeMod: !modals.becomeMod,
        }));
    }, []);

    if(!authState.user) {
        return <div>Forbidden</div>;
    }

    return (
        <>
            <MyReports
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
            />

            <div className="mt-4">
                <AgainstReports
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </div>

            <div className="mt-4">
                {isModerator(authState.user)?
                    <Moderations
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                :
                    <div className="container border p-4">
                        <div className="has-text-centered">
                            <b>Become a moderator and receive MMT's on every moderation done!</b>
                        </div>
                        <div className="field is-grouped mt-2">
                            <div className="control">
                                <Button 
                                    onClick={toggleBecomeMod}
                                >
                                    Sign up!
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <Modal
                header={<span>Become a moderator</span>}
                isOpen={modals.becomeMod}
                onClose={toggleBecomeMod}
            >
                <BecomeModForm
                    onClose={toggleBecomeMod}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default Reports;