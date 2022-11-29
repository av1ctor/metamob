import React, {useState, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCompleteDonation, useCreateDonation, useDeleteDonation} from "../../../../../hooks/donations";
import {DonationRequest, Campaign} from "../../../../../../../declarations/metamob/metamob.did";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../../../libs/icp";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../../hooks/ui";
import { useAuth } from "../../../../../hooks/auth";
import { useWallet } from "../../../../../hooks/wallet";

interface Props {
    campaign: Campaign;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0.00010000 * 10),
    anonymous: yup.bool().required(),
});

const DonationForm = (props: Props) => {
    const {principal, isLogged: isRegistered} = useAuth();
    const {balances, depositICP} = useWallet();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        value: BigInt(0)
    });
    
    const createMut = useCreateDonation();
    const completeMut = useCompleteDonation();
    const deleteMut = useDeleteDonation();

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

            const value = decimalToIcp(form.value.toString());
            const fees = LEDGER_TRANSFER_FEE * BigInt(2);

            if(balances.icp < value + fees) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + fees)} ICP.`)
            }

            const donation = await createMut.mutateAsync({
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            try {
                await depositICP(value + fees);
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
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, balances, depositICP]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    return (
        <form onSubmit={handleDonation}>
            <div>
                {isRegistered && 
                    <>
                        <TextField
                            label="Value (ICP)"
                            id="value"
                            value={form.value.toString()}
                            onChange={changeForm}
                        />
                        <TextField
                            label="From account id"
                            value={principal? principal.toString(): ''}
                            disabled={true}
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
                            label="Donate as anonymous"
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
                            onClick={isRegistered? handleDonation: redirectToLogon}
                            disabled={isLoading}
                        >
                            <i className="la la-money-bill"/>&nbsp;<FormattedMessage id="DONATE" defaultMessage="DONATE"/>
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default DonationForm;