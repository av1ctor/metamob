import React, {useState, useContext, useCallback, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCompleteFunding, useCreateFunding, useDeleteFunding} from "../../../../../hooks/fundings";
import {FundingRequest, Campaign} from "../../../../../../../declarations/metamob/metamob.did";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { icpToDecimal } from "../../../../../libs/icp";
import NumberField from "../../../../../components/NumberField";
import CustomSelectField from "../../../../../components/CustomSelectField";
import Badge from "../../../../../components/Badge";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../../hooks/ui";
import { useAuth } from "../../../../../hooks/auth";
import { useWallet } from "../../../../../hooks/wallet";

interface Props {
    campaign: Campaign;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    tier: yup.number().required(),
    amount: yup.number().required().min(1),
    anonymous: yup.bool().required(),
});

const FundingForm = (props: Props) => {
    const {principal, isLogged: isRegistered} = useAuth();
    const {balances, depositICP} = useWallet();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();

    const [form, setForm] = useState<FundingRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        tier: 0,
        amount: 0,
        value: BigInt(0)
    });
    
    const createMut = useCreateFunding();
    const completeMut = useCompleteFunding();
    const deleteMut = useDeleteFunding();

    const navigate = useNavigate();

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const validate = (form: FundingRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleFunding = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const info = props.campaign.info;
            const tiers = 'funding' in info?
                info.funding.tiers:
                [];

            const value = tiers[Number(form.tier)].value * BigInt(form.amount);
            const fees = LEDGER_TRANSFER_FEE * BigInt(2);

            if(balances.icp < value + fees) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + fees)} ICP.`)
            }

            const funding = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    tier: Number(form.tier),
                    amount: Number(form.amount),
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            try {
                await depositICP(value + fees);
            }
            catch(e) {
                await deleteMut.mutateAsync({
                    pubId: funding.pubId,
                    campaignPubId: props.campaign.pubId,
                });
                throw e;
            }

            await completeMut.mutateAsync({
                pubId: funding.pubId,
                campaignPubId: props.campaign.pubId,
            });

            showSuccess('Your funding has been sent!');
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, balances, depositICP, props.campaign]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    const tiersAsOptions = useMemo(() => {
        return 'funding' in props.campaign.info?
            props.campaign.info.funding.tiers.map((tier, index) => {
                return {
                    name: `${tier.title} (${icpToDecimal(tier.value)} ICP)`, 
                    value: index,
                    node: 
                        <div className="tier-option">
                            <div className="has-text-info"><b><FormattedMessage id="Tier" defaultMessage="Tier"/> {1+index}</b></div>
                            <div>
                                <strong>{tier.title} ({icpToDecimal(tier.value)} ICP)</strong>
                            </div> 
                            <div>
                                <small>{tier.desc}</small>
                            </div>
                            <div className="has-text-right">
                                <Badge color="info">{tier.total.toString()}/{tier.max.toString()}</Badge>
                            </div>
                        </div>, 
                };
            })
        :
            []
    }, [props.campaign.info]);

    return (
        <form onSubmit={handleFunding}>
            <div>
                {isRegistered && 
                    <>
                        <CustomSelectField
                            label="Tier"
                            name="tier"
                            value={form.tier}
                            options={tiersAsOptions}
                            onChange={changeForm}
                        />
                        <NumberField
                            label="Amount"
                            name="amount"
                            value={form.amount}
                            min={1}
                            required
                            onChange={changeForm}
                        />
                        <TextField
                            label="From account id"
                            value={principal? principal.toString(): ''}
                            disabled
                        />
                        <TextField
                            label="Account balance"
                            value={icpToDecimal(balances.icp)}
                            disabled={true}
                        />
                        <TextAreaField
                            label="Message"
                            name="body"
                            value={form.body || ''}
                            rows={3}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Fund as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="has-text-danger is-size-7"><b><FormattedMessage defaultMessage="Warning: THIS IS A TEST SITE. ANY ICP SENT WILL BE LOST!"/></b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isRegistered? handleFunding: redirectToLogon}
                            disabled={isLoading}
                        >
                            <i className="la la-lightbulb"/>&nbsp;<FormattedMessage id="FUND" defaultMessage="FUND"/>
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default FundingForm;