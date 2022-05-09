import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useFindUserCampaigns } from "../../hooks/campaigns";
import { AuthContext } from "../../stores/auth";
import Item from "../campaigns/Item";

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
    const [authState, ] = useContext(AuthContext);

    const navigate = useNavigate();

    const campaigns = useFindUserCampaigns(authState.user?._id || -1, orderBy, limit);
    
    if(!authState.client || !authState.identity || !authState.user) {
        navigate('/user/login');
        return null;
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
                
                <div className="columns is-desktop is-multiline">
                    {campaigns.status === 'success' && campaigns.data && campaigns.data.map((campaign) => 
                        <div 
                            className="column is-one-quarter"
                            key={campaign._id}
                        >
                            <Item 
                                key={campaign._id} 
                                campaign={campaign} />
                        </div>
                    )}
                </div>        
            </div>
        </div>
    );
};

export default Campaigns;