import React, { useCallback, useEffect, useState } from "react"
import * as yup from 'yup';
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import {Profile, ProfileRequest } from "../../../../../declarations/metamob/metamob.did";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { useFindUserByIdEx, useUpdateMe } from "../../../hooks/users";
import SelectField from "../../../components/SelectField";
import countries from "../../../libs/countries";
import { icpToDecimal } from "../../../libs/icp";
import Modal from "../../../components/Modal";
import StakeForm from "./Stake";
import UnstakeForm from "./Unstake";
import TransferForm from "./Transfer";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";

interface Props {
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
    country: yup.string().required(),
});

const User = (props: Props) => {
    const {user, principal, accountId, update} = useAuth();
    const {balances} = useWallet();

    const {toggleLoading, showSuccess, showError} = useUI();

    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [],
        active: [],
        banned: [],
        country: '',
    });
    const [modals, setModals] = useState({
        stake: false,
        unstake: false,
        transfer: false,
    });

    const profile = useFindUserByIdEx(user?._id || 0);
    const updateMut = useUpdateMe();

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
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            const profile = await updateMut.mutateAsync({req: form});
            update(profile);
            showSuccess('Profile updated!');
        }
        catch(e: any) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form]);

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
            unstake: !modals.unstake,
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
                const full = profile.data as Profile;
                setForm({
                    name: full.name,
                    email: full.email,
                    avatar: full.avatar,
                    roles: [],
                    active: [],
                    banned: [],
                    country: full.country,
                });
                break;

            case 'error':
                showError(profile.error.message);
                break;
        }
        toggleLoading(profile.status === 'loading');
    }, [profile.status]);

    if(!user) {
        return null;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage defaultMessage="My profile" />
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
                            value={principal? principal.toString(): ''}
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
                        <label className="label">
                            <FormattedMessage id="Actions" defaultMessage="Actions" />
                        </label>
                        <div className="field">
                            <div className="control is-grouped">
                                <Button
                                    color="success"
                                    disabled={balances.mmt < 10000}
                                    onClick={handleStake}
                                >
                                    <FormattedMessage id="Stake" defaultMessage="Stake" />
                                </Button>
                                <Button
                                    className="ml-2"
                                    color="danger"
                                    disabled={balances.mmt < 10000}
                                    onClick={handleTransfer}
                                >
                                    <FormattedMessage id="Transfer" defaultMessage="Transfer" />
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
                        <label className="label">
                            <FormattedMessage id="Actions" defaultMessage="Actions" />
                        </label>
                        <div className="field">
                            <div className="control is-grouped">
                                <Button
                                    color="warning"
                                    disabled={balances.staked < 10000}
                                    onClick={handleWithdraw}
                                >
                                    <FormattedMessage id="Withdraw" defaultMessage="Withdraw" />
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
                                    <FormattedMessage id="Update" defaultMessage="Update" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <Modal
                header={<span><FormattedMessage id="Stake" defaultMessage="Stake" /> MMT</span>}
                isOpen={modals.stake}
                onClose={toggleStake}
            >
                <StakeForm
                    onClose={toggleStake}
                />
            </Modal>

            <Modal
                header={<span><FormattedMessage id="Withdraw" defaultMessage="Withdraw" /> MMT</span>}
                isOpen={modals.unstake}
                onClose={toggleWithdraw}
            >
                <UnstakeForm
                    onClose={toggleWithdraw}
                />
            </Modal>

            <Modal
                header={<span><FormattedMessage id="Transfer" defaultMessage="Transfer" /> MMT</span>}
                isOpen={modals.transfer}
                onClose={toggleTransfer}
            >
                <TransferForm
                    onClose={toggleTransfer}
                />
            </Modal>
        </>
    )
};

export default User;