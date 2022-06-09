import React, {useState} from "react";
import {Carousel} from 'react-responsive-carousel';
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

    const campaigns = useFindCampaigns([], orderBy, {offset: 0, size: 4});

    if(campaigns.status !== 'success') {
        return null;
    }

    return (
        <div>
            <Carousel 
                showThumbs={false} 
                showArrows={true}
                showStatus={false}
                showIndicators={false}
                autoPlay={true}
                infiniteLoop={true}
                interval={3000}>
                {campaigns.data.map((campaign) => 
                    <div
                        key={campaign._id} 
                        className="p-4"
                    >
                        <Item 
                            campaign={campaign} 
                        />  
                    </div>
                )}
            </Carousel>
        </div>
    );
};

export default HotCampaigns;