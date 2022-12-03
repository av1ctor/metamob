import React, { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useWallet } from "../../../hooks/wallet";
import { useUI } from "../../../hooks/ui";
import { decimalToE8s, e8sToDecimal } from "../../../libs/icp";

interface Props {
    onClose: () => void;
};

const formSchema = yup.object().shape({
    value: yup.string().required()
});

const StakeForm = (props: Props) => {
    const {balances, stakeMMT} = useWallet();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();
    
    const [form, setForm] = useState({
        value: "0.0",
    });

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

    const validate = (form: {}): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleStake = useCallback(async (e: any) => {
        e.preventDefault();
        
        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const value = decimalToE8s(form.value);
            if(value < 10000) {
                throw Error("Value too low");
            }
            else if(value >= balances.mmt) {
                throw Error("Value too high");
            }

            if(!await stakeMMT(value)) {
                showError('Staking failed');
                return;
            }

            showSuccess('Value staked!');
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, balances.mmt]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    return (
        <form onSubmit={handleStake}>
            <TextField
                label="MMT balance"
                value={e8sToDecimal(balances.mmt)}
                disabled
            />
            <TextField
                label="Staked MMT"
                value={e8sToDecimal(balances.staked)}
                disabled
            />
            <TextField
                name="value"
                label="Value to stake"
                value={form.value}
                onChange={changeForm}
            />
            
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleStake}
                        disabled={isLoading}
                    >
                        <FormattedMessage id="Stake" defaultMessage="Stake"/>
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        <FormattedMessage id="Close" defaultMessage="Close"/>
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default StakeForm;