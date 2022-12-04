import React, {useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import * as yup from 'yup';
import {useCompleteBoost, useCreateBoost} from "../../../hooks/boosts";
import {BoostRequest, Campaign, BoostResponse} from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import { LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { decimalToE8s, e8sToDecimal } from "../../../libs/icp";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";
import { CurrencyType } from "../../../libs/payment";
import CurrencyField from "../../../components/CurrencyField";
import Modal from "../../../components/Modal";
import Dialog from "../../payment/Dialog";
import { BoostState, findById } from "../../../libs/boosts";
import { useActors } from "../../../hooks/actors";

interface Props {
    campaign: Campaign;
};

const icpFees = LEDGER_TRANSFER_FEE * BigInt(2);

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0.00010000 * 10),
    anonymous: yup.bool().required(),
});

const BoostForm = (props: Props) => {
    const {metamob} = useActors();
    const {principal, isLogged} = useAuth();
    const {balances, depositICP} = useWallet();
    const {showSuccess, showError, isLoading} = useUI();

    const [form, setForm] = useState<BoostRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        currency: CurrencyType.ICP,
        value: BigInt(0)
    });
    const [modals, setModals] = useState({
        payment: false,
    });
    
    const createMut = useCreateBoost();
    const completeMut = useCompleteBoost();
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

    const validate = (form: BoostRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (
    ): Promise<BoostResponse | undefined> => {
        try {
            const boost = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    currency: Number(form.currency),
                    value: decimalToE8s(form.value.toString()),
                    anonymous: form.anonymous,
                }
            });

            return boost;
        }
        catch(e) {
            showError(e);
            return;
        }
    }, [form]);

    const handlePay = useCallback(async (
        boost: BoostResponse
    ): Promise<boolean> => {
        try {
            switch(form.currency) {
                case CurrencyType.ICP:
                    try {
                        const value = decimalToE8s(form.value.toString());
                        await depositICP(value + icpFees);
                    }
                    catch(e) {
                        throw e;
                    }
        
                    await completeMut.mutateAsync({
                        pubId: boost.pubId,
                        campaignPubId: props.campaign.pubId,
                    });
        
                    showSuccess('Your boost has been paid!');
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
        boost: BoostResponse
    ): Promise<boolean> => {
        try {
            const res = await findById(boost._id, metamob);
            if(res.state !== BoostState.COMPLETED) {
                return false;
            }

            queryClient.invalidateQueries(['boosts']);
            queryClient.invalidateQueries(['campaigns', props.campaign.pubId]);
            return true;
        }
        catch(e) {
            return false;
        }
    }, [props.campaign, metamob, queryClient]);

    const handleBoost = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        const currency = Number(form.currency);
        if(currency == CurrencyType.ICP) {
            const value = decimalToE8s(form.value.toString());
            if(balances.icp < value + icpFees) {
                showError(`Insufficient funds! Needed: ${e8sToDecimal(value + icpFees)} ICP.`)
                return;
            }
        }

        openPayment();
    }, [form, balances]);

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

    return (
        <>
            <div
                className="mb-2"
            >
                <div className="is-size-4 has-text-success-dark"><FormattedMessage defaultMessage="Promote this campaign"/></div>
                <div><FormattedMessage defaultMessage="Total promoted"/>: {e8sToDecimal(props.campaign.boosting)} ICP</div>
            </div>

            <form onSubmit={handleBoost}>
                <CurrencyField
                    label="Currency/Value"
                    names={["currency", "value"]}
                    required
                    values={[form.currency, form.value]}
                    title="Currency/Value"
                    onChange={changeForm}
                />
                <div className="mt-2"/>
                <CheckboxField
                    label="Promote as anonymous"
                    id="anonymous"
                    value={form.anonymous}
                    onChange={changeForm}
                />

                <div className="has-text-danger is-size-7"><b>Warning: THIS IS A TEST SITE. ANY VALUE SENT WILL BE LOST!</b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="success"
                            onClick={isLogged? handleBoost: redirectToLogon}
                            disabled={isLoading}
                        >
                            <i className="la la-rocket"/>&nbsp;<FormattedMessage id="BOOST" defaultMessage="BOOST"/>
                        </Button>
                    </div>
                </div>
            </form>

            <Modal
                header={<span><FormattedMessage defaultMessage="Promote this campaign"/></span>}
                isOpen={modals.payment}
                onClose={closePayment}
            >
                <Dialog
                    categoryId={props.campaign._id}
                    kind="boost"
                    currency={Number(form.currency)}
                    value={typeof form.value === "string"? form.value: e8sToDecimal(form.value)}
                    onCreate={handleCreate}
                    onPay={handlePay}
                    onVerify={handleVerify}
                    onClose={closePayment}
                />
            </Modal>
        </>
    );
};

export default BoostForm;