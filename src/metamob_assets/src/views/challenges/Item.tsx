import React, { useContext } from "react";
import {Campaign, ProfileResponse, Challenge} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { challengeResultToColor, challengeResultToText, challengeStateToColor, challengeStateToText } from "../../libs/challenges";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";
import Badge from "../../components/Badge";
import Box from "../../components/Box";

interface BaseItemProps {
    challenge: Challenge;
    partial?: boolean;
    user?: ProfileResponse;
    children?: any;
    onModerate?: (challenge: Challenge) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const challenge = props.challenge;

    return (
        <Box className="challenge-item">
            <article className="media">
                {props.user && 
                    <div className="media-left">
                        <div className="flex-node w-12">
                            <Avatar id={props.user._id} size='lg' noName={true} />
                        </div>
                    </div>
                }
                <div className="media-content">
                    <div className="content">
                        {props.user && 
                            <div>
                                <strong>{props.user?.name}</strong>
                            </div>
                        }
                        <Markdown
                            className="update-body" 
                            body={challenge.description || '\n&nbsp;\n'}
                        />
                        <Badge 
                            color={challengeStateToColor(challenge.state)}
                        >
                            {challengeStateToText(challenge.state)}
                        </Badge>
                        
                        <Badge 
                            color={challengeResultToColor(challenge.result)}
                        >
                            {challengeResultToText(challenge.result)}
                        </Badge>
                    </div>
                    <div className="controls">
                        {props.children}
                    </div>
                </div>
            </article>
        </Box>
    );
};

interface ItemProps {
    campaign: Campaign;
    challenge: Challenge;
    onEdit: (challenge: Challenge) => void;
    onModerate?: (challenge: Challenge) => void;
    onDelete: (challenge: Challenge) => void;
    onChallenge: (challenge: Challenge) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {challenge} = props;

    const user = useFindUserById(challenge.createdBy);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === challenge.createdBy));

    return (
        <BaseItem
            user={user.data}
            challenge={challenge}
            onModerate={props.onModerate}
            onSuccess={props.onSuccess}
            onError={props.onError}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit challenge"
                                onClick={() => props.onEdit(challenge)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete challenge"
                                onClick={() => props.onDelete(challenge)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
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
    );
};
