import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useUnstake } from "../../../hooks/users";
import { getStakedBalance } from "../../../libs/dao";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { getMmtBalance } from "../../../libs/mmt";
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
    value: yup.string().required()
});

const UnstakeForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);
    
    const [form, setForm] = useState({
        value: "0.0",
    });

    const unstakeMut = useUnstake();

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

    const handleWithdraw = useCallback(async (e: any) => {
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
            else if(value >= auth.balances.mmt) {
                throw Error("Value too high");
            }

            await unstakeMut.mutateAsync({
                main: actors.main,
                value: value
            });

            props.onUpdateBalances();
            props.onSuccess('Value withdrew!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actors, auth]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const {balances} = auth;
    
    return (
        <form onSubmit={handleWithdraw}>
            <TextField
                label="MMT balance"
                value={icpToDecimal(balances.mmt)}
                disabled
            />
            <TextField
                label="Staked MMT"
                value={icpToDecimal(balances.staked)}
                disabled
            />
            <TextField
                name="value"
                label="Value to unstake"
                value={form.value}
                onChange={changeForm}
            />
            
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleWithdraw}
                        disabled={unstakeMut.isLoading}
                    >
                        <FormattedMessage id="Withdraw" defaultMessage="Withdraw"/>
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

export default UnstakeForm;