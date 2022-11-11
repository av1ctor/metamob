import React, {useCallback, useState} from "react";
import Skeleton from "react-loading-skeleton";
import {Carousel} from 'react-responsive-carousel';
import { useNavigate } from "react-router-dom";
import {useFindCampaigns} from "../../hooks/campaigns";
import Item from "./Item";
import { sortByHot } from "./Sort";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const HotCampaigns = (props: Props) => {
    const [orderBy, ] = useState(sortByHot);
    
    const navigate = useNavigate();

    const campaigns = useFindCampaigns([], orderBy, {offset: 0, size: 4});

    const handleClick = useCallback((index: number) => {
        if(campaigns.data && campaigns.data.length > index) {
            const campaign = campaigns.data[index];
            navigate(`/c/${campaign.pubId}`);
        }
    }, [campaigns]);

    return (
        <div>
            <Carousel 
                showThumbs={false} 
                showArrows={true}
                showStatus={false}
                showIndicators={false}
                autoPlay={true}
                infiniteLoop={true}
                interval={3000}
            >
                {campaigns.status === 'success'? 
                    campaigns.data.map((campaign) => 
                        <div
                            key={campaign._id} 
                            className="p-4"
                        >
                            <Item 
                                campaign={campaign} 
                            />  
                        </div>
                    )
                :
                    Array.from([1,2,3,4]).map(index => 
                        <div 
                            className="p-4"
                            key={index}
                        >
                            <div className="image is-4by3" style={{maxHeight: '450px'}}>
                                <Skeleton className="is-overlay" style={{position: 'absolute'}} />
                            </div>
                            <Skeleton height={170} />
                        </div>
                    )
                }
            </Carousel>
        </div>
    );
};

export default HotCampaigns;