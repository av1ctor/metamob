import React, { useCallback, useContext, useState } from "react";
import { Paginator } from "../../../components/Paginator";
import { useFindCampaignsByUserId } from "../../../hooks/campaigns";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import Item from "../../campaigns/Item";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Campaigns = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });

    const campaigns = useFindCampaignsByUserId(authState.user?._id || 0, orderBy, limit, actorState.main);

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
    
    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                My campaigns
            </div>
            
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

                <Paginator
                    limit={limit}
                    length={campaigns.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />        
            </div>
        </>
    );
};

export default Campaigns;