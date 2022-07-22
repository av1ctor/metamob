import React, { useContext } from "react";
import { useFindCampaignByPubId } from "../../../hooks/campaigns";
import { CategoryContext } from "../../../stores/category";
import EditForm from "./Edit";

interface Props {
    pubId: string;
    reportId: number;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const EditFormWrapper = (props: Props) => {
    const [categories] = useContext(CategoryContext);
    
    const campaign = useFindCampaignByPubId(props.pubId);

    if(campaign.status !== 'success' || !campaign.data) {
        return null;
    }

    return (
        <EditForm
            campaign={campaign.data}
            reportId={props.reportId}
            categories={categories.categories}
            onClose={props.onClose}
            onSuccess={props.onSuccess}
            onError={props.onError}
            toggleLoading={props.toggleLoading}
        />
    );
};

export default EditFormWrapper;
