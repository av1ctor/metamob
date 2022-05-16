import React from 'react';
import { useFindUserById } from '../../hooks/users';

interface Props {
    id: number;
    size?: string;
    noName?: boolean;
};

const Avatar = (props: Props) => {
    const profile = useFindUserById(['users', props.id], props.id);

    let size = 6;
    switch(props.size) {
        case 'lg':
            size = 3;
            break;
    }
    
    return (
        <div className="is-flex is-align-items-center">
            <div className={`avatar ${props.size}`}>
                {profile?.isSuccess && 
                    <div className={`is-size-${size}`} title={`User: ${profile.data.name}`}>
                        <b>{profile.data.name.charAt(0).toUpperCase()}</b>
                    </div>
                }
            </div>
            {!props.noName && profile?.isSuccess && props.size === 'lg' &&
                <div className="ml-2">
                    <b>{profile.data.name}</b>
                </div>                    
            }
        </div>
    );
};

export default Avatar;