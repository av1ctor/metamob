import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindUserById } from '../../hooks/users';

interface Props {
    id?: number;
    size?: string;
    noName?: boolean;
};

const Avatar = (props: Props) => {
    const profile = useFindUserById(props.id);
    
    const navigate = useNavigate();

    const handleShowProfile = useCallback(() => {
        if(profile.data && profile.data.pubId) {
            navigate(`/u/${profile.data.pubId}`);
        }
    }, [profile.data]);
    
    return (
        <div className="is-flex is-align-items-center">
            <div 
                className={`avatar ${props.size || 'sm'} is-clickable`}
                onClick={handleShowProfile}
            >
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
                        {profile.data.name}
                    </b>
                </div>                    
            }
        </div>
    );
};

export default Avatar;