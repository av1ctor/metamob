import React, { useCallback, useContext, useEffect, useState } from "react";
import { Challenge } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindJudgeChallenges } from "../../../../hooks/challenges";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";
import {BaseItem} from "../../../challenges/Item";
import { Paginator } from "../../../../components/Paginator";
import { ChallengeState } from "../../../../libs/challenges";
import ModerateForm from "../../../challenges/challenge/Moderate";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../hooks/ui";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const ToModerate = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const {showError, toggleLoading} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        moderate: false,
    });
    const [challenge, setChallenge] = useState<Challenge>();

    const challenges = useFindJudgeChallenges(
        orderBy, limit, auth.user?._id, actors.main);
    
    const toggleModerate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            moderate: !modals.moderate
        }));
    }, []);

    const handleModerate = useCallback((challenge: Challenge) => {
        setChallenge(challenge);
        toggleModerate();
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
                <FormattedMessage id="To moderate" defaultMessage="To moderate"/>
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
                                
                                
                            >
                                <p>
                                    <small>
                                        {challenge.state !== ChallengeState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Moderate challenge"
                                                    onClick={() => handleModerate(challenge)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-chess" /> <FormattedMessage id="Moderate" defaultMessage="Moderate"/></span>
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
                header={<span><FormattedMessage id="Moderate challenge" defaultMessage="Moderate challenge"/></span>}
                isOpen={modals.moderate}
                onClose={toggleModerate}
            >
                {challenge && 
                    <ModerateForm
                        challenge={challenge}
                        onModerate={toggleModerate}
                        onClose={toggleModerate}
                        
                        
                        
                    />
                }
            </Modal>
        </>
    );
};

export default ToModerate;