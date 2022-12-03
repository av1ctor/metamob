import React, {useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
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
import BtcDialog from "../../../../payment/BtcDialog";
import { DonationState, findById } from "../../../../../libs/donations";
import { useActors } from "../../../../../hooks/actors";
import { useQueryClient } from "react-query";

interface Props {
    campaign: Campaign;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0.00010000 * 10),
    anonymous: yup.bool().required(),
});

const DonationForm = (props: Props) => {
    const {metamob} = useActors();
    const {principal, isLogged} = useAuth();
    const {balances, depositICP} = useWallet();
    const {showSuccess, showError, toggleLoading, isLoading} = useUI();

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        currency: CurrencyType.ICP,
        value: BigInt(0)
    });
    const [modals, setModals] = useState({
        btcpay: false,
    });
    const [donation, setDonation] = useState<DonationResponse>();
    
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

    const handleDonation = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const currency = Number(form.currency);
            const value = decimalToE8s(form.value.toString());
            const icpFees = LEDGER_TRANSFER_FEE * BigInt(2);

            if(currency == CurrencyType.ICP) {
                if(balances.icp < value + icpFees) {
                    throw Error(`Insufficient funds! Needed: ${e8sToDecimal(value + icpFees)} ICP.`)
                }
            }

            const donation = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    currency: Number(form.currency),
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            switch(currency) {
                case CurrencyType.ICP:
                    try {
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
        
                    showSuccess('Your donation has been sent!');
                    break;

                case CurrencyType.BTC:
                    openBtcPay(donation);
                    break;
            }
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, balances, depositICP]);

    const openBtcPay = useCallback((donation: DonationResponse) => {
        setDonation(donation);
        setModals(modals => ({
            ...modals,
            btcpay: true
        }));
    }, []);

    const closeBtcPay = useCallback(() => {
        setDonation(undefined);
        setModals(modals => ({
            ...modals,
            btcpay: false
        }));
    }, []);

    const handleVerifyComplete = useCallback(async (
        id: number
    ): Promise<boolean> => {
        try {
            const res = await findById(id, metamob);
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
                header={<span><FormattedMessage defaultMessage="BTC Payment"/></span>}
                isOpen={modals.btcpay}
                onClose={closeBtcPay}
            >
                {donation &&
                    <BtcDialog
                        categoryId={donation.campaignId}
                        entityId={donation._id}
                        kind="donation"
                        value={e8sToDecimal(donation.value)}
                        onClose={closeBtcPay}
                        onVerify={handleVerifyComplete}
                    />
                }
            </Modal>
        </>
    );
};

export default DonationForm;