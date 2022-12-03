import React, {useState, useCallback, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import * as yup from 'yup';
import {useCompleteFunding, useCreateFunding, useDeleteFunding} from "../../../../../hooks/fundings";
import {FundingRequest, Campaign, FundingResponse, FundingTier} from "../../../../../../../declarations/metamob/metamob.did";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { e8sToDecimal } from "../../../../../libs/icp";
import NumberField from "../../../../../components/NumberField";
import CustomSelectField from "../../../../../components/CustomSelectField";
import Badge from "../../../../../components/Badge";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../../hooks/ui";
import { useAuth } from "../../../../../hooks/auth";
import { useWallet } from "../../../../../hooks/wallet";
import { currencyToString, CurrencyType } from "../../../../../libs/payment";
import Modal from "../../../../../components/Modal";
import Dialog from "../../../../../views/payment/Dialog";
import { findById } from "../../../../../libs/fundings";
import { FundingState } from "../../../../../libs/fundings";
import { useActors } from "../../../../../hooks/actors";

interface Props {
    campaign: Campaign;
};

const icpFees = LEDGER_TRANSFER_FEE * BigInt(2);

const formSchema = yup.object().shape({
    body: yup.string(),
    tier: yup.number().required(),
    amount: yup.number().required().min(1),
    anonymous: yup.bool().required(),
});

const FundingForm = (props: Props) => {
    const {metamob} = useActors();
    const {principal, isLogged: isRegistered} = useAuth();
    const {balances, depositICP} = useWallet();

    const {showSuccess, showError, isLoading} = useUI();

    const [form, setForm] = useState<FundingRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        tier: 0,
        amount: 0,
        currency: CurrencyType.ICP,
        value: BigInt(0)
    });
    const [modals, setModals] = useState({
        payment: false,
    });
    
    const createMut = useCreateFunding();
    const completeMut = useCompleteFunding();
    const deleteMut = useDeleteFunding();
    const queryClient = useQueryClient();

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

    const getTier = (): FundingTier => {
        const info = props.campaign.info;
        const tiers = 'funding' in info?
            info.funding.tiers:
            [];

        return tiers[Number(form.tier)];
    };

    const calcValue = (): bigint => {
        const tier = getTier();
        return tier.value * BigInt(form.amount);
    }

    const handleCreate = useCallback(async (
    ): Promise<FundingResponse | undefined> => {
        try {
            const tier = getTier();
            const value = tier.value * BigInt(form.amount);
                
            const funding = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    tier: Number(form.tier),
                    amount: Number(form.amount),
                    currency: Number(tier.currency),
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            return funding;
        }
        catch(e) {
            showError(e);
            return;
        }
    }, [form]);

    const handlePay = useCallback(async (
        funding: FundingResponse
    ): Promise<boolean> => {
        try {
            switch(form.currency) {
                case CurrencyType.ICP:
                    try {
                        const tier = getTier();
                        const value = tier.value * BigInt(form.amount);
                        await depositICP(value + icpFees);
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

                    showSuccess('Your funding has been paid!');
                    break;

                case CurrencyType.BTC:
                    break;
            }

            return true;
        }
        catch(e) {
            showError(e);
            return false;
        }
    }, [form, props.campaign]);

    const handleVerify = useCallback(async (
        funding: FundingResponse
    ): Promise<boolean> => {
        try {
            const res = await findById(funding._id, metamob);
            if(res.state !== FundingState.COMPLETED) {
                return false;
            }

            queryClient.invalidateQueries(['fundings']);
            return true;
        }
        catch(e) {
            return false;
        }
    }, [metamob, queryClient]);

    const handleFunding = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        const tier = getTier();
        const currency = Number(tier.currency);
        
        if(currency === CurrencyType.ICP) {
            const value = tier.value * BigInt(form.amount);
            if(balances.icp < value + icpFees) {
                showError(`Insufficient funds! Needed: ${e8sToDecimal(value + icpFees)} ICP.`)
                return;
            }
        }

        openPayment();
    }, [form, balances, props.campaign]);

    const openPayment = useCallback(() => {
        setModals(modals => ({
            ...modals,
            payment: true
        }));
    }, []);

    const closePayment = useCallback(() => {
        setModals(modals => ({
            ...modals,
            payment: false
        }));
    }, []);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    const tiersAsOptions = useMemo(() => {
        return 'funding' in props.campaign.info?
            props.campaign.info.funding.tiers.map((tier, index) => {
                const currency = currencyToString(tier.currency);
                return {
                    name: `${tier.title} (${e8sToDecimal(tier.value)} ${currency})`, 
                    value: index,
                    node: 
                        <div className="tier-option">
                            <div className="has-text-info"><b><FormattedMessage id="Tier" defaultMessage="Tier"/> {1+index}</b></div>
                            <div>
                                <strong>{tier.title} ({e8sToDecimal(tier.value)} ICP)</strong>
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
        <>
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
                                value={e8sToDecimal(balances.icp)}
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

                    <div className="has-text-danger is-size-7"><b><FormattedMessage defaultMessage="Warning: THIS IS A TEST SITE. ANY VALUE SENT WILL BE LOST!"/></b></div>

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

            <Modal
                header={<span><FormattedMessage defaultMessage="Make a fundraising"/></span>}
                isOpen={modals.payment}
                onClose={closePayment}
            >
                <Dialog
                    categoryId={props.campaign._id}
                    kind="fundraising"
                    currency={Number(form.currency)}
                    value={calcValue().toString()}
                    onCreate={handleCreate}
                    onPay={handlePay}
                    onVerify={handleVerify}
                    onClose={closePayment}
                />
            </Modal>
        </>
    );
};

export default FundingForm;