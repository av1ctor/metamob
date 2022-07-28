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

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const ToModerate = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

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
        props.toggleLoading(challenges.status === "loading");
        if(challenges.status === "error") {
            props.onError(challenges.error.message);
        }
    }, [challenges.status]);

    console.log(challenges.data)

    return (
        <>
            <div className="page-title has-text-info-dark">
                To moderate
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
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                            >
                                <p>
                                    <small>
                                        {challenge.state !== ChallengeState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Moderate challenge"
                                                    onClick={() => handleModerate(challenge)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-chess" /> Moderate</span>
                                                </a>
                                                &nbsp;·&nbsp;
                                            </span>
                                        }
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, challenge.createdAt)}
                                        />
                                        {challenge.updatedBy && challenge.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i>Edited</i></b>
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
                header={<span>Moderate challenge</span>}
                isOpen={modals.moderate}
                onClose={toggleModerate}
            >
                {challenge && 
                    <ModerateForm
                        challenge={challenge}
                        onModerate={toggleModerate}
                        onClose={toggleModerate}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>
        </>
    );
};

export default ToModerate;