import React, { useContext } from "react";
import { useFindCampaignsByUserId } from "../../../hooks/campaigns";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import Item from "../../campaigns/Item";

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

const Campaigns = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const campaigns = useFindCampaignsByUserId(authState.user?._id || 0, orderBy, limit, actorState.main);
    
    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <div className="container">
            <div>
                {campaigns.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {campaigns.status === 'error' &&
                    <div className="form-error">
                        {campaigns.error.message}
                    </div>
                }
                
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {campaigns.status === 'success' && campaigns.data && campaigns.data.map((campaign) => 
                        <div 
                            className="column is-one-quarter"
                            key={campaign._id}
                        >
                            <Item 
                                campaign={campaign} 
                            />
                        </div>
                    )}
                </div>        
            </div>
        </div>
    );
};

export default Campaigns;