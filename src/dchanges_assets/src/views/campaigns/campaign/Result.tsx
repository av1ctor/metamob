import React, { useCallback, useContext, useState } from "react";
import { Campaign } from "../../../../../declarations/dchanges/dchanges.did";
import Box from "../../../components/Box";
import Modal from "../../../components/Modal";
import { CampaignResult } from "../../../libs/campaigns";
import { AuthContext } from "../../../stores/auth";
import Email from "./results/Email";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

enum Action {
    GEN_EMAIL,
}

const Result = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    
    const [action, setAction] = useState(Action.GEN_EMAIL);
    const [modals, setModals] = useState({
        show: false
    });

    const toggleShow = useCallback(() => {
        setModals(modals => ({
            ...modals,
            show: !modals.show
        }));
    }, []);

    const toggleGenEmail = useCallback(() => {
        setAction(Action.GEN_EMAIL);
        toggleShow();
    }, []);

    const {campaign} = props;

    const isOwner = campaign.createdBy === authState.user?._id;
    
    return (
        <>
            <div>
                {campaign.result === CampaignResult.OK? 
                    <div className="notification is-success is-light">
                        This campaign finished and the goal was achieved! Congratulations!
                    </div>
                :
                    <div className="notification is-danger is-light">
                        This campaign finished and unfortunately the goal was not achieved. Maybe next time!
                    </div>
                }
            </div>
            {isOwner &&
                <> 
                    <br/>
                    <Box className="campaign-actions">
                        Choose now an action to execute:
                        <div className="columns is-multiline">
                            <div className="column is-3">
                                <div 
                                    className="action"
                                    onClick={toggleGenEmail}
                                >
                                    <div><i className="la la-envelope is-size-1"/></div>
                                    <div className="is-size-7">Generate e-mail</div>
                                </div>
                            </div>
                        </div>
                    </Box>
                    
                    <Modal
                        header="Action"
                        isOpen={modals.show}
                        onClose={toggleShow}
                    >
                        {action === Action.GEN_EMAIL &&
                            <Email
                                campaign={campaign}
                                onClose={toggleShow}
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                                toggleLoading={props.toggleLoading}
                            />
                        }
                    </Modal>
                </>
            }
        </>
    );
};

export default Result;