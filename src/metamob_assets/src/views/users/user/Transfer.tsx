import React, { useCallback, useContext, useState } from "react";
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useTransfer } from "../../../hooks/users";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";

interface Props {
    onUpdateBalances: () => Promise<void>;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    to: yup.string().required().length(63),
    value: yup.string().required()
});

const TransferForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);
    
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
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            const value = decimalToIcp(form.value);
            if(value < 10000) {
                throw Error("Value too low");
            }
            else if(value >= authState.balances.mmt) {
                throw Error("Value too high");
            }

            await transferMut.mutateAsync({
                mmt: actorState.mmt,
                to: form.to,
                value: value
            });

            props.onUpdateBalances();
            props.onSuccess('Value transferred!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState, authState]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {balances} = authState;
    
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
                        Transfer
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TransferForm;