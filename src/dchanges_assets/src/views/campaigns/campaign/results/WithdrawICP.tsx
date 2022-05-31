import React, { useCallback, useContext, useEffect, useState } from "react";
import { Campaign } from "../../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../../components/Button";
import TextField from "../../../../components/TextField";
import { getBalance, withdraw } from "../../../../libs/campaigns";
import { icpToDecimal } from "../../../../libs/icp";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";

interface Props {
    campaign: Campaign;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const WithdrawICP = (props: Props): React.ReactElement => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [balance, setBalance] = useState(BigInt(0));
    const [form, setForm] = useState({
        account: authState.identity?.getPrincipal().toString() || ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.value;
        setForm(form => ({
            ...form,
            [field]: value
        }));
    }, []);

    const handleWithdraw = useCallback(async () => {
        try {
            props.toggleLoading(true);
            await withdraw(props.campaign._id, form.account, actorState.main);
            setBalance(BigInt(0));
            props.onSuccess("Withdraw completed!");
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [props.campaign, form]);

    const updateState = useCallback(async(
    ) => {
        try {
            setIsLoading(true);
            const balance = await getBalance(props.campaign._id, actorState.main);
            setBalance(balance);
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            setIsLoading(false);
        }
    }, [props.campaign, actorState.main]);

    useEffect(() => {
        updateState();
    }, [updateState]);

    const {campaign} = props;
    
    return (
        <>
            <form>
                <TextField
                    label="Balance"
                    rightIcon={isLoading? 'spinner': undefined}
                    value={icpToDecimal(balance)}
                    disabled={true}
                />
                <TextField
                    label="To account"
                    name="account"
                    value={form.account}
                    required
                    onChange={changeForm}
                />
            </form>
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button 
                        onClick={handleWithdraw}
                    >
                        Withdraw
                    </Button>
                </div>
                <div className="control">
                    <Button 
                        color="danger"
                        onClick={props.onClose} 
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    )
};

export default WithdrawICP;