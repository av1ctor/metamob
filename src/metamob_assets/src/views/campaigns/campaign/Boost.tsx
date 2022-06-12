import React, { useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../declarations/ledger";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useBoostCampaign } from "../../../hooks/campaigns";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { depositIcp, getIcpBalance } from "../../../libs/users";
import { ActorActionType, ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";

const MIN_ICP_VALUE = BigInt(10000 * 10);

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    value: yup.number().required().min(0.00010000 * 10),
});

const Boost = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, actorDispatch] = useContext(ActorContext);

    const [form, setForm] = useState({
        value: BigInt(1),
    });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const boostMut = useBoostCampaign();

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actorState.ledger) {
            return actorState.ledger;
        }
        
        if(!authState.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(authState.identity);
        actorDispatch({
            type: ActorActionType.SET_LEDGER,
            payload: ledger
        });

        return ledger;
    };

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
    
    const validate = (form: any): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleBoost = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            setIsLoading(true);
            props.toggleLoading(true);

            if(!actorState.main) {
                throw Error("Main actor undefined");
            }

            if(!authState.user || !authState.identity) {
                throw Error("Not logged in");
            }

            const value = BigInt(decimalToIcp(form.value.toString()));
            if(value < MIN_ICP_VALUE) {
                throw Error(`Min value: ${icpToDecimal(MIN_ICP_VALUE)} ICP`);
            }

            const ledger = await getLedgerCanister();

            const balance = await getIcpBalance(authState.identity, ledger);

            if(value + LEDGER_TRANSFER_FEE >= balance) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            await depositIcp(authState.user, value, actorState.main, ledger);

            await boostMut.mutateAsync({
                main: actorState.main,
                pubId: props.campaign.pubId, 
                value
            });

            props.onSuccess('Campaign promoted!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            setIsLoading(false);
            props.toggleLoading(false);
        }
    }, [form, actorState.main, props.campaign]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    const isLoggedIn = !!authState.user;

    return (
        <>
            <div
                className="mb-2"
            >
                <div className="is-size-4 has-text-success-dark">Promote this campaign</div>
                <div>Total promoted: {icpToDecimal(props.campaign.boosting)} ICP</div>
            </div>
            <form onSubmit={handleBoost}>
                <TextField
                    label="Value (ICP)"
                    name="value"
                    required
                    value={form.value.toString()}
                    title="Value (ICP)"
                    onChange={changeForm}
                />
                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="success"
                            onClick={isLoggedIn? handleBoost: redirectToLogon}
                            disabled={isLoading || boostMut.isLoading}
                        >
                            <i className="la la-rocket"/>&nbsp;BOOST
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
};

export default Boost;