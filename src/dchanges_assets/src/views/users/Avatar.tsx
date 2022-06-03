import React, { useCallback, useContext } from 'react';
import { Profile } from '../../../../declarations/dchanges/dchanges.did';
import { useFindUserById } from '../../hooks/users';
import { ActorContext } from '../../stores/actor';

interface Props {
    id: number;
    size?: string;
    noName?: boolean;
    onClick?: (profile: Profile) => void;
};

const Avatar = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const profile = useFindUserById(props.id, props.onClick? actorState.main: undefined);

    const handleClick = useCallback(() => {
        props.onClick && profile.data && props.onClick(profile.data as Profile);
    }, [profile.data]);
    
    return (
        <div className="is-flex is-align-items-center">
            <div className={`avatar ${props.size || 'sm'}`}>
                {profile.data && 
                    <div title={`User: ${profile.data.name}`}>
                        <b>{profile.data.avatar?
                            <i className={`ava-${profile.data.avatar}`} />:
                            <span>{profile.data.name.charAt(0).toUpperCase()}</span>
                        }</b>
                    </div>
                }
            </div>
            {!props.noName && profile?.isSuccess && props.size === 'lg' &&
                <div className="ml-2">
                    <b>
                        {!props.onClick?
                            profile.data.name
                        :
                            profile.data && 
                                <span 
                                    className="is-clickable"
                                    onClick={handleClick}>
                                    {profile.data.name} <i className="la la-pen" />
                                </span>
                        }
                    </b>
                </div>                    
            }
        </div>
    );
};

export default Avatar;