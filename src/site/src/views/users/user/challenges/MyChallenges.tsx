import React, { useCallback, useEffect, useState } from "react";
import { Challenge } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindUserChallenges } from "../../../../hooks/challenges";
import {BaseItem} from "../../../challenges/Item";
import EditForm from "../../../challenges/challenge/Edit";
import { Paginator } from "../../../../components/Paginator";
import { ChallengeState } from "../../../../libs/challenges";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../hooks/ui";
import { useAuth } from "../../../../hooks/auth";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const MyChallenges = (props: Props) => {
    const {user} = useAuth();

    const {showError, toggleLoading} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        edit: false,
    });
    const [challenge, setChallenge] = useState<Challenge>();

    const challenges = useFindUserChallenges(orderBy, limit, user?._id);
    
    const toggleEdit = useCallback((challenge: Challenge | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit,
        }));
        setChallenge(challenge);
    }, []);

    const handlePrevPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: Math.max(0, limit.offset - limit.size)|0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: limit.offset + limit.size
        }));
    }, []);

    useEffect(() => {
        toggleLoading(challenges.status === "loading");
        if(challenges.status === "error") {
            showError(challenges.error.message);
        }
    }, [challenges.status]);

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage id="My challenges" defaultMessage="My challenges"/>
            </div>

            <div>
                <div className="challenges columns is-multiline">
                    {challenges.status === 'success' && 
                        challenges.data && 
                            challenges.data.map((challenge) => 
                        <div
                            key={challenge._id}
                            className="column is-6"
                        >
                            <BaseItem 
                                challenge={challenge} 
                                partial
                            >
                                <p>
                                    <small>
                                        {challenge.state !== ChallengeState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Edit challenge"
                                                    onClick={() => toggleEdit(challenge)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                            </span>
                                        }
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, challenge.createdAt)}
                                        />
                                        {challenge.updatedBy && challenge.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                                            </>
                                        }
                                    </small>
                                </p>
                            </BaseItem>
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={challenges.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span><FormattedMessage id="Edit challenge" defaultMessage="Edit challenge"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {challenge && 
                    <EditForm
                        challenge={challenge} 
                        onClose={toggleEdit}
                    />
                }
            </Modal>
        </>
    );
};

export default MyChallenges;