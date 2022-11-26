import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Paginator } from "../../../components/Paginator";
import { useFindCampaignsByUserId } from "../../../hooks/campaigns";
import { useUI } from "../../../hooks/ui";
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
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const {toggleLoading, showError} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 3
    });

    const campaigns = useFindCampaignsByUserId(auth.user?._id || 0, orderBy, limit, actors.main);

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

    useEffect(() => {
        toggleLoading(campaigns.status === "loading");
        if(campaigns.status === "error") {
            showError(campaigns.error.message);
        }
    }, [campaigns.status]);
    
    if(!auth.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="My campaigns" />
            </div>
            
            <div>
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {campaigns.status === 'success' && campaigns.data && campaigns.data.map((campaign) => 
                        <div 
                            className="column is-4"
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