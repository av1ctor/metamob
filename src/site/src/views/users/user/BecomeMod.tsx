import React, { useCallback, useEffect, useState } from "react";
import * as yup from 'yup';
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";
import { useUI } from "../../../hooks/ui";
import { useSignupAsModerator } from "../../../hooks/users";
import { getConfigAsNat64 } from "../../../libs/dao";
import { e8sToDecimal } from "../../../libs/icp";

interface Props {
    onClose: () => void;
};

const formSchema = yup.object().shape({
    termsAccepted: yup.bool().isTrue("You must accept the terms"),
});

const BecomeModForm = (props: Props) => {
    const {update} = useAuth();
    const {balances, stakeMMT} = useWallet();

    const {showSuccess, showError, toggleLoading, isLoading} = useUI();
    
    const [minToBeStaked, setMinStaked] = useState(BigInt(0));

    const [form, setForm] = useState({
        termsAccepted: false,
    });

    const signupMut = useSignupAsModerator();

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

    const handleSignup = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const profile = await signupMut.mutateAsync();
            update(profile);
            
            showSuccess('Congratulations! You are now a moderator!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleStake = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            const value = minToBeStaked - balances.staked;

            if(!await stakeMMT(value)) {
                showError("Staking failed");
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
    }, [balances, minToBeStaked]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    const init = async () => {
        const min = await getConfigAsNat64('MODERATOR_MIN_STAKE');
        setMinStaked(min);
    };

    useEffect(() => {
        init();
    }, []);

    const hasEnoughStaked = balances.staked >= minToBeStaked;
    const hasEnoughMmt = balances.mmt >= minToBeStaked;
    
    return (
        <form onSubmit={handleSignup}>
            <div className="mb-4">
                <p>Being a moderator, you will be rewarded with MMT's on every moderation done.</p>
                <div className="mt-2" />
                <p><span className="has-text-danger"><b>Warning</b></span>: If your moderation is challenged and get reverted, all your staked MMT's will be burned as punishment!</p>
            </div>
            <div className="columns">
                <div className="column is-6">
                    <TextField
                        label="MMT balance"
                        value={e8sToDecimal(balances.mmt)}
                        disabled
                    />
                </div>
                <div className="column is-6">
                    <TextField
                        label="Staked MMT"
                        value={e8sToDecimal(balances.staked)}
                        disabled
                    />
                </div>
            </div>
            <div className="columns">
                <div className="column is-6">
                    <TextField
                        label="Min staked MMT needed"
                        value={e8sToDecimal(minToBeStaked)}
                        disabled
                    />
                </div>
                <div className="column is-6">
                    <div className="field">
                        <div className="control">
                            <label className="label">Action</label>
                            <Button
                                color="danger"
                                disabled={hasEnoughStaked || !hasEnoughMmt || isLoading}
                                onClick={handleStake}
                            >
                                Stake
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <br/>
            <CheckboxField
                label="I have read and agree to the terms and conditions"
                id="termsAccepted"
                value={form.termsAccepted}
                disabled={!hasEnoughStaked}
                onChange={changeForm}
            />
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleSignup}
                        disabled={signupMut.isLoading || !hasEnoughStaked}
                    >
                        Sign up
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

export default BecomeModForm;