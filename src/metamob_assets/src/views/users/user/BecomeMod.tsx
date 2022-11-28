import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";
import { useUI } from "../../../hooks/ui";
import { useSignupAsModerator, useStake } from "../../../hooks/users";
import { getConfigAsNat64, getDepositedBalance, getStakedBalance } from "../../../libs/dao";
import { icpToDecimal } from "../../../libs/icp";
import { getMmtBalance } from "../../../libs/mmt";
import { getIcpBalance } from "../../../libs/users";
import { ActorContext } from "../../../stores/actor";
import { AuthActionType, AuthContext } from "../../../stores/auth";

interface Props {
    onClose: () => void;
};

const formSchema = yup.object().shape({
    termsAccepted: yup.bool().isTrue("You must accept the terms"),
});

const BecomeModForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, authDispatch] = useContext(AuthContext);

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [minToBeStaked, setMinStaked] = useState(BigInt(0));

    const [form, setForm] = useState({
        termsAccepted: false,
    });

    const signupMut = useSignupAsModerator();
    const stakeMut = useStake();

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
            
            authDispatch({
                type: AuthActionType.SET_USER,
                payload: profile
            });
            
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

            const value = minToBeStaked - auth.balances.staked;

            await stakeMut.mutateAsync({value: value});
            updateBalances();
            showSuccess('Value staked!');
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [auth, minToBeStaked]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    const updateBalances = async () => {
        Promise.all([
            getIcpBalance(auth.identity, actors.ledger),
            getMmtBalance(auth.identity, actors.mmt),
            getStakedBalance(actors.main),
            getDepositedBalance(actors.main),
            getConfigAsNat64('MODERATOR_MIN_STAKE')
        ]).then(res => {
            authDispatch({
                type: AuthActionType.SET_BALANCES,
                payload: {
                    icp: res[0],
                    mmt: res[1],
                    staked: res[2],
                    deposited: res[3],
                }
            });
            setMinStaked(res[4]);
        }).catch(e => {
            showError(e);
        });
    };

    useEffect(() => {
        updateBalances();
    }, [auth.user?._id]);

    const {balances} = auth;
    
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
                        value={icpToDecimal(balances.mmt)}
                        disabled
                    />
                </div>
                <div className="column is-6">
                    <TextField
                        label="Staked MMT"
                        value={icpToDecimal(balances.staked)}
                        disabled
                    />
                </div>
            </div>
            <div className="columns">
                <div className="column is-6">
                    <TextField
                        label="Min staked MMT needed"
                        value={icpToDecimal(minToBeStaked)}
                        disabled
                    />
                </div>
                <div className="column is-6">
                    <div className="field">
                        <div className="control">
                            <label className="label">Action</label>
                            <Button
                                color="danger"
                                disabled={hasEnoughStaked || !hasEnoughMmt || stakeMut.isLoading}
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