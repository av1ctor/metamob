import React, { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import Box from "../../../components/Box";
import Modal from "../../../components/Modal";
import { useAuth } from "../../../hooks/auth";
import { CampaignResult } from "../../../libs/campaigns";
import Email from "./results/Email";

interface Props {
    campaign: Campaign;
}

enum Action {
    GEN_EMAIL,
}

const Result = (props: Props) => {
    const {user} = useAuth();
    
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

    const isOwner = campaign.createdBy === user?._id;
    
    return (
        <>
            <div>
                {campaign.result === CampaignResult.OK? 
                    <div className="notification is-success is-light">
                        <FormattedMessage defaultMessage="This campaign finished and the goal was achieved! Congratulations!"/>
                    </div>
                :
                    <div className="notification is-danger is-light">
                        <FormattedMessage defaultMessage="This campaign finished and unfortunately the goal was not achieved. Maybe next time!"/>
                    </div>
                }
            </div>
            {isOwner &&
                <> 
                    <br/>
                    <Box className="campaign-actions">
                    <FormattedMessage defaultMessage="Choose now an action to execute"/>:
                        <div className="columns is-multiline">
                            <div className="column is-3">
                                <div 
                                    className="action"
                                    onClick={toggleGenEmail}
                                >
                                    <div><i className="la la-envelope is-size-1"/></div>
                                    <div className="is-size-7"><FormattedMessage defaultMessage="Generate e-mail"/></div>
                                </div>
                            </div>
                        </div>
                    </Box>
                    
                    <Modal
                        header={<FormattedMessage id="Action" defaultMessage="Action"/>}
                        isOpen={modals.show}
                        onClose={toggleShow}
                    >
                        {action === Action.GEN_EMAIL &&
                            <Email
                                campaign={campaign}
                                onClose={toggleShow}
                            />
                        }
                    </Modal>
                </>
            }
        </>
    );
};

export default Result;