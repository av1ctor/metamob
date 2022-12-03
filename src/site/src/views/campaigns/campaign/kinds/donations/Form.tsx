import React, {useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import * as yup from 'yup';
import {useCompleteDonation, useCreateDonation, useDeleteDonation} from "../../../../../hooks/donations";
import {DonationRequest, Campaign, DonationResponse} from "../../../../../../../declarations/metamob/metamob.did";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { decimalToE8s, e8sToDecimal } from "../../../../../libs/icp";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../../hooks/ui";
import { useAuth } from "../../../../../hooks/auth";
import { useWallet } from "../../../../../hooks/wallet";
import { CurrencyType } from "../../../../../libs/payment";
import CurrencyField from "../../../../../components/CurrencyField";
import Modal from "../../../../../components/Modal";
import Dialog from "../../../../payment/Dialog";
import { DonationState, findById } from "../../../../../libs/donations";
import { useActors } from "../../../../../hooks/actors";

interface Props {
    campaign: Campaign;
};

const icpFees = LEDGER_TRANSFER_FEE * BigInt(2);

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0.00010000 * 10),
    anonymous: yup.bool().required(),
});

const DonationForm = (props: Props) => {
    const {metamob} = useActors();
    const {principal, isLogged} = useAuth();
    const {balances, depositICP} = useWallet();
    const {showSuccess, showError, isLoading} = useUI();

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        currency: CurrencyType.ICP,
        value: BigInt(0)
    });
    const [modals, setModals] = useState({
        payment: false,
    });
    
    const createMut = useCreateDonation();
    const completeMut = useCompleteDonation();
    const deleteMut = useDeleteDonation();
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

    const validate = (form: DonationRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (
    ): Promise<DonationResponse | undefined> => {
        try {
            const donation = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    currency: Number(form.currency),
                    value: decimalToE8s(form.value.toString()),
                    anonymous: form.anonymous,
                }
            });

            return donation;
        }
        catch(e) {
            showError(e);
            return;
        }
    }, [form]);

    const handlePay = useCallback(async (
        donation: DonationResponse
    ): Promise<boolean> => {
        try {
            switch(form.currency) {
                case CurrencyType.ICP:
                    try {
                        const value = decimalToE8s(form.value.toString());
                        await depositICP(value + icpFees);
                    }
                    catch(e) {
                        await deleteMut.mutateAsync({
                            pubId: donation.pubId,
                            campaignPubId: props.campaign.pubId,
                        });
                        throw e;
                    }
        
                    await completeMut.mutateAsync({
                        pubId: donation.pubId,
                        campaignPubId: props.campaign.pubId,
                    });
        
                    showSuccess('Your donation has been paid!');
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
        donation: DonationResponse
    ): Promise<boolean> => {
        try {
            const res = await findById(donation._id, metamob);
            if(res.state !== DonationState.COMPLETED) {
                return false;
            }

            queryClient.invalidateQueries(['donations']);
            return true;
        }
        catch(e) {
            return false;
        }
    }, [metamob, queryClient]);

    const handleDonation = useCallback(async (e: any) => {
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
            <form onSubmit={handleDonation}>
                <div>
                    {isLogged && 
                        <>
                            <CurrencyField
                                label="Currency/Value"
                                names={["currency", "value"]}
                                required
                                values={[form.currency, form.value]}
                                title="Currency/Value"
                                onChange={changeForm}
                            />
                            {Number(form.currency) === CurrencyType.ICP &&
                                <>
                                    <TextField
                                        label="From account id"
                                        value={principal? principal.toString(): ''}
                                        disabled={true}
                                    />
                                    <TextField
                                        label="Account balance"
                                        value={e8sToDecimal(balances.icp)}
                                        disabled={true}
                                    />
                                </>
                            }
                            <TextAreaField
                                label="Message"
                                name="body"
                                value={form.body || ''}
                                rows={3}
                                onChange={changeForm}
                            />
                            <CheckboxField
                                label="Donate as anonymous"
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
                                onClick={isLogged? handleDonation: redirectToLogon}
                                disabled={isLoading}
                            >
                                <i className="la la-money-bill"/>&nbsp;<FormattedMessage id="DONATE" defaultMessage="DONATE"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <Modal
                header={<span><FormattedMessage defaultMessage="Make a donation"/></span>}
                isOpen={modals.payment}
                onClose={closePayment}
            >
                <Dialog
                    categoryId={props.campaign._id}
                    kind="donation"
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

export default DonationForm;