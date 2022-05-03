import React from 'react';
import { useFindUserById } from '../../hooks/users';

interface Props {
    id?: number;
    size?: 'lg';
};

const Avatar = (props: Props) => {
    const profile = props.id?
        useFindUserById(['user'], props.id):
        undefined;

    let size = 6;
    switch(props.size) {
        case 'lg':
            size = 12;
            break;
    }
    
    return (
        <div className="flex">
            <div className={`rounded-full h-${size} w-${size} flex flex-none items-center justify-center bg-blue-300 overflow-hidden`}>
                {profile?.isSuccess && 
                    <div className="text-lg font-bold" title={profile.data.name}>
                        {profile.data.name.charAt(0).toUpperCase()}
                    </div>
                }
            </div>
            {profile?.isSuccess && props.size === 'lg' &&
                <div className="flex-none flex items-center pl-2 text-gray-500 font-bold">
                    <span>{profile.data.name}</span>
                </div>                    
            }
        </div>
    );
};

export default Avatar;