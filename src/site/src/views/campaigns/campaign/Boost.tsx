import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useBoostCampaign } from "../../../hooks/campaigns";
import { LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";

const MIN_ICP_VALUE = BigInt(10000 * 10);

interface Props {
    campaign: Campaign;
}

const formSchema = yup.object().shape({
    value: yup.number().required().min(0.00010000 * 10),
});

const Boost = (props: Props) => {
    const {isLogged} = useAuth();
    const {balances, depositICP} = useWallet();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();

    const [form, setForm] = useState({
        value: BigInt(1),
    });

    const navigate = useNavigate();

    const boostMut = useBoostCampaign();

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
    
    const validate = (form: any): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleBoost = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const value = BigInt(decimalToIcp(form.value.toString()));
            if(value < MIN_ICP_VALUE) {
                throw Error(`Min value: ${icpToDecimal(MIN_ICP_VALUE)} ICP`);
            }

            if(value + LEDGER_TRANSFER_FEE >= balances.icp) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            await depositICP(value);

            await boostMut.mutateAsync({
                pubId: props.campaign.pubId, 
                value
            });

            showSuccess('Campaign promoted!');
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

    return (
        <>
            <div
                className="mb-2"
            >
                <div className="is-size-4 has-text-success-dark"><FormattedMessage defaultMessage="Promote this campaign"/></div>
                <div><FormattedMessage defaultMessage="Total promoted"/>: {icpToDecimal(props.campaign.boosting)} ICP</div>
            </div>
            <form onSubmit={handleBoost}>
                <TextField
                    label="Value (ICP)"
                    name="value"
                    required
                    value={form.value.toString()}
                    title="Value (ICP)"
                    onChange={changeForm}
                />

                <div className="has-text-danger is-size-7"><b>Warning: THIS IS A TEST SITE. ANY ICP SENT WILL BE LOST!</b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="success"
                            onClick={isLogged? handleBoost: redirectToLogon}
                            disabled={isLoading || boostMut.isLoading}
                        >
                            <i className="la la-rocket"/>&nbsp;<FormattedMessage id="BOOST" defaultMessage="BOOST"/>
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
};

export default Boost;