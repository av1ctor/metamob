import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Campaign } from '../../../../../../declarations/metamob/metamob.did';
import { CampaignKind, CampaignResult, CampaignState } from '../../../../libs/campaigns';
import { arrayOfMapEntryToString } from '../../../../libs/variant';

interface Props {
    campaign: Campaign;
}

const Action = (props: Props) => {
    const {campaign} = props;

    const {action} = campaign;

    if('nop' in action) {
        return null;
    }
    
    return (
        <div className="campaign-action-container">
            {'transfer' in action &&
                <div>
                    {campaign.kind === CampaignKind.DONATIONS &&
                        <span>
                            {campaign.state !== CampaignState.FINISHED? 
                                <span>
                                    <FormattedMessage defaultMessage="If the goal is achieved, the donations received will be sent to" />
                                    &nbsp;<b>{action.transfer.receiver}</b>.
                                </span>
                            : 
                                campaign.result === CampaignResult.OK?
                                    <span>
                                        <FormattedMessage defaultMessage="As the goal was achieved, the donations were sent to" />
                                        &nbsp;<b>{action.transfer.receiver}</b>.
                                    </span>
                                :
                                    <FormattedMessage defaultMessage="As the goal was not achieved, the donations were reimbursed to the users." />
                            } 
                        </span>
                    }
                    {campaign.kind === CampaignKind.FUNDINGS &&
                        <span>
                            {campaign.state !== CampaignState.FINISHED? 
                                <span>
                                    <FormattedMessage defaultMessage="If the goal is achieved, the funds raised will be sent to" />
                                    &nbsp;<b>{action.transfer.receiver}</b>.
                                </span>
                            : 
                                campaign.result === CampaignResult.OK?
                                    <span>
                                        <FormattedMessage defaultMessage="As the goal was achieved, the funds raised were sent to" />
                                        &nbsp;<b>{action.transfer.receiver}</b>.
                                    </span>
                                :
                                    <FormattedMessage defaultMessage="As the goal was not achieved, the funds raised were reimbursed to the users." />
                            } 
                        </span>
                    }
                </div>
            } 
            {'invoke' in action &&
                <div>
                    {campaign.state !== CampaignState.FINISHED? 
                        <span>
                            <FormattedMessage defaultMessage="If the goal is achieved, the following method will be invoked:" />
                            &nbsp;<b>{action.invoke.canisterId}.{action.invoke.method}({arrayOfMapEntryToString(action.invoke.args)})</b>.
                        </span>
                    :
                        campaign.result === CampaignResult.OK?
                            <span>
                                <FormattedMessage defaultMessage="The following method was invoked:" />
                                &nbsp;<b>{action.invoke.canisterId}.{action.invoke.method}({arrayOfMapEntryToString(action.invoke.args)})</b>.
                            </span>
                        :
                            <FormattedMessage defaultMessage="As the goal was not achieved, no method was invoked." />
                    }
                </div>
            }
        </div>
    );
};

export default Action;