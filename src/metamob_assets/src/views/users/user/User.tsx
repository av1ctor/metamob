import React, { useCallback, useContext, useEffect, useState } from "react"
import * as yup from 'yup';
import { AuthActionType, AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextField from "../../../components/TextField";
import {Profile, ProfileRequest } from "../../../../../declarations/metamob/metamob.did";
import { ActorContext } from "../../../stores/actor";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { useFindUserById } from "../../../hooks/users";
import SelectField from "../../../components/SelectField";
import countries from "../../../libs/countries";
import { getMmtBalance } from "../../../libs/mmt";
import { getIcpBalance } from "../../../libs/users";
import { accountIdentifierFromBytes, icpToDecimal, principalToAccountDefaultIdentifier } from "../../../libs/icp";
import { getStakedBalance } from "../../../libs/dao";
import Modal from "../../../components/Modal";
import StakeForm from "./Stake";
import WithdrawForm from "./Withdraw";
import TransferForm from "./Transfer";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
    country: yup.string().required(),
});

const User = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [principal, setPrincipal] = useState('');
    const [accountId, setAccountId] = useState('');
    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [],
        active: [],
        banned: [],
        bannedAsMod: [],
        country: '',
    });
    const [modals, setModals] = useState({
        stake: false,
        withdraw: false,
        transfer: false,
    });

    const profile = useFindUserById(authState.user?._id || 0, actorState.main);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: [e.target.value]
        }));
    }, []);
    
    const validate = (form: ProfileRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            if(!actorState.main) {
                return;
            }
            
            const res = await actorState.main.userUpdateMe(form);
            
            if('ok' in res) {
                const user = res.ok;
                authDispatch({type: AuthActionType.SET_USER, payload: user});
                props.onSuccess('User updated!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form]);

    const updateBalances = useCallback(async () => {
        Promise.all([
            getIcpBalance(authState.identity, actorState.ledger),
            getMmtBalance(authState.identity, actorState.mmt),
            getStakedBalance(actorState.main)
        ]).then(res => {
            authDispatch({
                type: AuthActionType.SET_BALANCES,
                payload: {
                    icp: res[0],
                    mmt: res[1],
                    staked: res[2],
                }
            });
        }).catch(e => {
            props.onError(e);
        });
    }, [authState.identity, actorState]);

    const toggleStake = useCallback(() => {
        setModals(modals => ({
            ...modals,
            stake: !modals.stake,
        }));
    }, []);

    const handleStake = useCallback((e: any) => {
        e.preventDefault();
        toggleStake();
    }, []);

    const toggleWithdraw = useCallback(() => {
        setModals(modals => ({
            ...modals,
            withdraw: !modals.withdraw,
        }));
    }, []);

    const handleWithdraw = useCallback((e: any) => {
        e.preventDefault();
        toggleWithdraw();
    }, []);

    const toggleTransfer = useCallback(() => {
        setModals(modals => ({
            ...modals,
            transfer: !modals.transfer,
        }));
    }, []);

    const handleTransfer = useCallback((e: any) => {
        e.preventDefault();
        toggleTransfer();
    }, []);

    useEffect(() => {
        switch(profile.status) {
            case 'success':
                if(!authState.identity) {
                    props.onError("Identity undefined");
                    return
                }
                updateBalances();
                const full = profile.data as Profile;
                setPrincipal(full.principal);
                setAccountId(
                    accountIdentifierFromBytes(
                        principalToAccountDefaultIdentifier(
                            authState.identity?.getPrincipal())));
                setForm({
                    name: full.name,
                    email: full.email,
                    avatar: full.avatar,
                    roles: [],
                    active: [],
                    banned: [],
                    bannedAsMod: [],
                    country: full.country,
                });
                break;

            case 'error':
                props.onError(profile.error.message);
                break;
        }
        props.toggleLoading(profile.status === 'loading');
    }, [profile.status]);

    if(!authState.user) {
        return null;
    }

    const {balances} = authState;

    return (
        <>
            <div className="page-title has-text-info-dark">
                My profile
            </div>
            
            <form onSubmit={handleUpdate}>
                <div className="columns">
                    <div className="column is-12">
                        <TextField 
                            label="Name"
                            name="name"
                            value={form.name || ''}
                            required={true}
                            onChange={changeForm} 
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <TextField 
                            label="E-mail"
                            name="email"
                            value={form.email || ''}
                            required={true}
                            onChange={changeForm} 
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <SelectField
                            label="Country"
                            name="country"
                            value={form.country || ''}
                            options={countries.map(c => ({name: c.name, value: c.code}))}
                            onChange={changeForm}
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <AvatarPicker 
                            label="Avatar"
                            name="avatar"
                            value={form.avatar[0] || ''}
                            onChange={changeFormOpt} 
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <TextField 
                            label="ICP principal"
                            value={principal || ''}
                            disabled
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <TextField 
                            label="Ledger account id"
                            value={accountId || ''}
                            disabled
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <TextField 
                            label="ICP balance"
                            value={icpToDecimal(balances.icp)}
                            disabled
                        />
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-6">
                        <TextField 
                            label="MMT balance"
                            value={icpToDecimal(balances.mmt)}
                            disabled
                        />
                    </div>
                    <div className="column is-auto">
                        <label className="label">Actions</label>
                        <div className="field">
                            <div className="control is-grouped">
                                <Button
                                    color="success"
                                    disabled={balances.mmt < 10000}
                                    onClick={handleStake}
                                >
                                    Stake
                                </Button>
                                <Button
                                    className="ml-2"
                                    color="danger"
                                    disabled={balances.mmt < 10000}
                                    onClick={handleTransfer}
                                >
                                    Transfer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-6">
                        <TextField 
                            label="MMT staked"
                            value={icpToDecimal(balances.staked)}
                            disabled
                        />
                    </div>
                    <div className="column is-auto">
                        <label className="label">Actions</label>
                        <div className="field">
                            <div className="control is-grouped">
                                <Button
                                    color="warning"
                                    disabled={balances.staked < 10000}
                                    onClick={handleWithdraw}
                                >
                                    Withdraw
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="columns">
                    <div className="column is-12">
                        <div className="field is-grouped mt-2">
                            <div className="control">
                                <Button
                                    onClick={handleUpdate}>
                                    Update
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <Modal
                header={<span>Stake MMT</span>}
                isOpen={modals.stake}
                onClose={toggleStake}
            >
                <StakeForm
                    onUpdateBalances={updateBalances}
                    onClose={toggleStake}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <Modal
                header={<span>Withdraw MMT</span>}
                isOpen={modals.withdraw}
                onClose={toggleWithdraw}
            >
                <WithdrawForm
                    onUpdateBalances={updateBalances}
                    onClose={toggleWithdraw}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

            <Modal
                header={<span>Transfer MMT</span>}
                isOpen={modals.transfer}
                onClose={toggleTransfer}
            >
                <TransferForm
                    onUpdateBalances={updateBalances}
                    onClose={toggleTransfer}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    )
};

export default User;