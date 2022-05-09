import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useFindUserPetitions } from "../../hooks/petitions";
import { AuthContext } from "../../stores/auth";
import Item from "../petitions/Item";

interface Props {
};

const orderBy = {
    key: '_id',
    dir: 'desc'
};

const limit = {
    offset: 0,
    size: 10
};

const Petitions = (props: Props) => {
    const [authState, ] = useContext(AuthContext);

    const navigate = useNavigate();

    const petitions = useFindUserPetitions(authState.user?._id || -1, orderBy, limit);
    
    if(!authState.client || !authState.identity || !authState.user) {
        navigate('/user/login');
        return null;
    }
    
    return (
        <div className="container">
            <div>
                {petitions.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {petitions.status === 'error' &&
                    <div className="form-error">
                        {petitions.error.message}
                    </div>
                }
                
                <div className="columns is-desktop is-multiline">
                    {petitions.status === 'success' && petitions.data && petitions.data.map((petition) => 
                        <div 
                            className="column is-half"
                            key={petition._id}
                        >
                            <Item 
                                key={petition._id} 
                                petition={petition} />
                        </div>
                    )}
                </div>        
            </div>
        </div>
    );
};

export default Petitions;