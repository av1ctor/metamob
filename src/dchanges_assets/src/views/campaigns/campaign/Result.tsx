import React from "react";
import { CampaignResult } from "../../../libs/campaigns";

interface Props {
    result: CampaignResult;
}

const Result = (props: Props) => {
    return (
        <div>
            {props.result === CampaignResult.WON? 
                <div className="notification is-success is-light">
                    This campaign finished and the goal was achieved! Congratulations!
                </div>
            :
                <div className="notification is-danger is-light">
                    This campaign finished and unfortunately the goal was not achieved. Maybe next time!
                </div>
            }
        </div>
    );
};

export default Result;