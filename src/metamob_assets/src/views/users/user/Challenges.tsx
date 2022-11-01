import React, { useCallback, useContext, useState } from "react";
import Modal from "../../../components/Modal";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";
import Button from "../../../components/Button";
import MyChallenges from "./challenges/MyChallenges";
import BecomeModForm from "./BecomeMod";
import ToModerate from "./challenges/ToModerate";
import { FormattedMessage } from "react-intl";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Challenges = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

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
            <MyChallenges
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
            />

            <div className="mt-4">
                {isModerator(auth.user)?
                    <ToModerate
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
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
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default Challenges;