import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useWithdraw } from "../../../hooks/users";
import { getStakedBalance } from "../../../libs/dao";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { getMmtBalance } from "../../../libs/mmt";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";

interface Props {
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    value: yup.string().required()
});

const WithdrawForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);
    
    const [mmtBalance, setMmtBalance] = useState(BigInt(0));
    const [staked, setStaked] = useState(BigInt(0));

    const [form, setForm] = useState({
        value: "0.0",
    });

    const withdrawMut = useWithdraw();

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
            else if(value >= mmtBalance) {
                throw Error("Value too high");
            }

            await withdrawMut.mutateAsync({
                main: actorState.main,
                value: value
            });

            updateBalances();
            props.onSuccess('Value withdrew!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState.main, actorState.mmt]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    const updateBalances = async () => {
        const mmt = await getMmtBalance(authState.identity, actorState.mmt);
        const staked = await getStakedBalance(actorState.main);
        
        setMmtBalance(mmt);
        setStaked(staked);
    };

    useEffect(() => {
        updateBalances();
    }, [authState.user?._id]);
    
    return (
        <form onSubmit={handleWithdraw}>
            <TextField
                label="MMT balance"
                value={icpToDecimal(mmtBalance)}
                disabled
            />
            <TextField
                label="Staked MMT"
                value={icpToDecimal(staked)}
                disabled
            />
            <TextField
                name="value"
                label="Value to withdraw"
                value={form.value}
                onChange={changeForm}
            />
            
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleWithdraw}
                        disabled={withdrawMut.isLoading}
                    >
                        Withdraw
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default WithdrawForm;