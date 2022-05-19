import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useFindUserPlaces } from "../../../hooks/places";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";

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

const Places = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const places = useFindUserPlaces(authState.user?._id || 0, orderBy, limit, actorState.main);
    
    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <div className="container">
            <div>
                {places.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {places.status === 'error' &&
                    <div className="form-error">
                        {places.error.message}
                    </div>
                }
                
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {places.status === 'success' && places.data && places.data.map((place) => 
                        <div 
                            key={place._id}
                            className="column is-6"
                        >
                            <Link to={`/p/${place.pubId}`}>{place.name}</Link>
                        </div>
                    )}
                </div>        
            </div>
        </div>
    );
};

export default Places;