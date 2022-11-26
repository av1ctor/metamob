import React, { useCallback, useContext, useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useUI } from "../../../hooks/ui";
import { useTransfer } from "../../../hooks/users";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";

interface Props {
    onUpdateBalances: () => Promise<void>;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    to: yup.string().required().length(63),
    value: yup.string().required()
});

const TransferForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState({
        to: '',
        value: '0.0',
    });

    const transferMut = useTransfer();

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

    const handleTransfer = useCallback(async (e: any) => {
        e.preventDefault();
        
        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const value = decimalToIcp(form.value);
            if(value < 10000) {
                throw Error("Value too low");
            }
            else if(value >= auth.balances.mmt) {
                throw Error("Value too high");
            }

            await transferMut.mutateAsync({
                mmt: actors.mmt,
                to: form.to,
                value: value
            });

            props.onUpdateBalances();
            showSuccess('Value transferred!');
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, actors, auth]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {balances} = auth;
    
    return (
        <form onSubmit={handleTransfer}>
            <TextField
                label="MMT balance"
                value={icpToDecimal(balances.mmt)}
                disabled
            />
            <TextField
                name="to"
                label="To principal"
                value={form.to}
                onChange={changeForm}
            />
            <TextField
                name="value"
                label="Value to transfer"
                value={form.value}
                onChange={changeForm}
            />
            
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleTransfer}
                        disabled={transferMut.isLoading}
                    >
                        <FormattedMessage id="Transfer" defaultMessage="Transfer"/>
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

export default TransferForm;