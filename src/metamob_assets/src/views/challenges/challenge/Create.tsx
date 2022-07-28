import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { ChallengeRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import { useCreateChallenge } from "../../../hooks/challenges";
import { useApprove } from "../../../hooks/users";
import { getConfigAsNat64, getDepositedBalance, getStakedBalance } from "../../../libs/dao";
import { icpToDecimal } from "../../../libs/icp";
import { getMmtBalance } from "../../../libs/mmt";
import { getIcpBalance } from "../../../libs/users";
import { ActorContext } from "../../../stores/actor";
import { AuthActionType, AuthContext } from "../../../stores/auth";

interface Props {
    moderationId: number;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    moderationId: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const CreateForm = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ChallengeRequest>({
        moderationId: props.moderationId,
        description: '',
    });
    const [minDeposit, setMinDeposit] = useState(0n);

    const createMut = useCreateChallenge();
    const approveMut = useApprove();

    const validate = (form: ChallengeRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }
        
        try {
            props.toggleLoading(true);

            await approveMut.mutateAsync({
                main: actorState.main,
                mmt: actorState.mmt,
                value: minDeposit
            })

            await createMut.mutateAsync({
                main: actorState.main,
                req: {
                    moderationId: form.moderationId,
                    description: form.description,
                }
            });

            props.onSuccess('Challenge created!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState, minDeposit, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const updateBalances = async () => {
        Promise.all([
            getIcpBalance(authState.identity, actorState.ledger),
            getMmtBalance(authState.identity, actorState.mmt),
            getStakedBalance(actorState.main),
            getDepositedBalance(actorState.main),
            getConfigAsNat64('CHALLENGER_DEPOSIT')
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
            setMinDeposit(res[4]);
        }).catch(e => {
            props.onError(e);
        });
    };

    useEffect(() => {
        updateBalances();
    }, [authState.user?._id]);

    return (
        <form onSubmit={handleCreate}>
            <Container>
                <div className="mb-4">
                    <p>To challenge a moderation, your wallet will be billed <b>{icpToDecimal(minDeposit)} MMT</b>.</p>
                    <p className="mt-2">If the challenge is accepted and the moderation get reverted, the deposited value will be reimbursed to your wallet. Otherwise, <b><span className="has-text-danger">the value deposited will be lost</span></b>!</p>
                    {authState.balances.mmt <= minDeposit &&
                        <p className="mt-2">
                            Sorry, your balance (<b>{icpToDecimal(authState.balances.mmt)} MMT</b>) is <span className="has-text-danger">too low</span>.
                        </p>
                    }
                </div>
                <TextAreaField
                    label="Description"
                    name="description"
                    value={form.description || ''}
                    rows={6}
                    required={true}
                    onChange={changeForm} 
                />
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            disabled={authState.balances.mmt <= minDeposit}
                            onClick={handleCreate}>
                            Create
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Container>
        </form>    
    )
};

export default CreateForm;