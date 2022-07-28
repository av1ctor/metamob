import React, { useCallback, useContext, useEffect, useState } from "react"
import { AuthContext } from "../../../stores/auth";
import TextField from "../../../components/TextField";
import {ProfileResponse } from "../../../../../declarations/metamob/metamob.did";
import { useFindUserByPubId } from "../../../hooks/users";
import SelectField from "../../../components/SelectField";
import countries from "../../../libs/countries";
import { useParams } from "react-router-dom";
import Modal from "../../../components/Modal";
import ReportForm from "../../reports/report/Create";
import { EntityType } from "../../../libs/common";
import ModerationModal from "../../moderations/Modal";
import ModerationBadge from "../../moderations/moderation/Badge";

interface Props {
    pubId?: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const PublicProfile = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const {id} = useParams();
    
    const req = useFindUserByPubId(props.pubId || id);
    
    const [modals, setModals] = useState({
        report: false,
        moderations: false,
    });const [profile, setProfile] = useState<ProfileResponse>();

    useEffect(() => {
        switch(req.status) {
            case 'success':
                setProfile(req.data);
                break;
            case 'error':
                props.onError(req.error.message);
                break;
        }

        props.toggleLoading(req.status === 'loading');
    }, [req.status]);

    const toggleReport = useCallback(() => {
        setModals(modals => ({
            ...modals,
            report: !modals.report
        }));
    }, []);

    const toggleModerations = useCallback(() => {
        setModals(modals => ({
            ...modals,
            moderations: !modals.moderations
        }));
    }, []);

    if(!profile) {
        return null;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                profile
            </div>
            
            <div className="columns">
                <div className="column is-12">
                    <div 
                        className="avatar xl">
                        <b>
                            {profile.avatar.length > 0?
                                <i className={`ava-${profile.avatar[0]}`} />:
                                <span>{profile.name.charAt(0).toUpperCase()}</span>
                            }
                        </b>
                    </div>
                </div>
            </div>
            <div className="columns">
                <div className="column is-12">
                    <TextField 
                        label="Name"
                        name="name"
                        value={profile.name || ''}
                        disabled
                    />
                </div>
            </div>
            <div className="columns">
                <div className="column is-12">
                    <SelectField
                        label="Country"
                        name="country"
                        value={profile.country || ''}
                        options={countries.map(c => ({name: c.name, value: c.code}))}
                        disabled
                    />
                </div>
            </div>
            <div className="columns">
                <div className="column is-12">
                    <ModerationBadge
                        reason={profile.moderated}
                        onShowModerations={toggleModerations} 
                    />
                </div>
            </div>
            <div className="columns">
                <div className="column is-12">
                    {auth.user && 
                        <a
                            title="Report user"
                            onClick={toggleReport}
                        >
                            <span className="whitespace-nowrap has-text-danger"><i className="la la-flag" /> Report</span>
                        </a>
                    }
                </div>
            </div>

            <Modal
                header={<span>Report user</span>}
                isOpen={modals.report}
                onClose={toggleReport}
            >
                <ReportForm
                    entityId={profile._id}
                    entityPubId={profile.pubId}
                    entityType={EntityType.USERS}
                    onClose={toggleReport}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <ModerationModal
                isOpen={modals.moderations}
                entityType={EntityType.USERS}
                entityId={profile._id}
                moderated={profile.moderated}
                onClose={toggleModerations}
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
            />
        </>
    )
};

export default PublicProfile;