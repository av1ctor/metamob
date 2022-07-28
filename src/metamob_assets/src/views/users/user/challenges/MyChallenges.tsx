import React, { useCallback, useContext, useEffect, useState } from "react";
import { Challenge } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindUserChallenges } from "../../../../hooks/challenges";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";
import {BaseItem} from "../../../challenges/Item";
import EditForm from "../../../challenges/challenge/Edit";
import { Paginator } from "../../../../components/Paginator";
import { ChallengeState } from "../../../../libs/challenges";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const MyChallenges = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        edit: false,
    });
    const [challenge, setChallenge] = useState<Challenge>();

    const challenges = useFindUserChallenges(
        orderBy, limit, authState.user?._id, actorState.main);
    
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
        props.toggleLoading(challenges.status === "loading");
        if(challenges.status === "error") {
            props.onError(challenges.error.message);
        }
    }, [challenges.status]);

    return (
        <>
            <div className="page-title has-text-info-dark">
                My challenges
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
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                            >
                                <p>
                                    <small>
                                        {challenge.state !== ChallengeState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Edit challenge"
                                                    onClick={() => toggleEdit(challenge)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
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
                header={<span>Edit challenge</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {challenge && 
                    <EditForm
                        challenge={challenge} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>
        </>
    );
};

export default MyChallenges;