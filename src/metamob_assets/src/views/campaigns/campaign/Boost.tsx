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
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";

const MIN_ICP_VALUE = BigInt(10000 * 10);

interface Props {
    campaign: Campaign;
}

const formSchema = yup.object().shape({
    value: yup.number().required().min(0.00010000 * 10),
});

const Boost = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    const [actors, actorDispatch] = useContext(ActorContext);

    const {showSuccess, showError, toggleLoading} = useUI();

    const [form, setForm] = useState({
        value: BigInt(1),
    });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const boostMut = useBoostCampaign();

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actors.ledger) {
            return actors.ledger;
        }
        
        if(!auth.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(auth.identity);
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
            showError(errors);
            return;
        }

        try {
            setIsLoading(true);
            toggleLoading(true);

            if(!actors.main) {
                throw Error("Main actor undefined");
            }

            if(!auth.user || !auth.identity) {
                throw Error("Not logged in");
            }

            const value = BigInt(decimalToIcp(form.value.toString()));
            if(value < MIN_ICP_VALUE) {
                throw Error(`Min value: ${icpToDecimal(MIN_ICP_VALUE)} ICP`);
            }

            const ledger = await getLedgerCanister();

            const balance = await getIcpBalance(auth.identity, ledger);

            if(value + LEDGER_TRANSFER_FEE >= balance) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            await depositIcp(auth.user, value, actors.main, ledger);

            await boostMut.mutateAsync({
                pubId: props.campaign.pubId, 
                value
            });

            showSuccess('Campaign promoted!');
        }
        catch(e) {
            showError(e);
        }
        finally {
            setIsLoading(false);
            toggleLoading(false);
        }
    }, [form, auth, actors.main, props.campaign]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    const isLoggedIn = !!auth.user;

    return (
        <>
            <div
                className="mb-2"
            >
                <div className="is-size-4 has-text-success-dark"><FormattedMessage defaultMessage="Promote this campaign"/></div>
                <div><FormattedMessage defaultMessage="Total promoted"/>: {icpToDecimal(props.campaign.boosting)} ICP</div>
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

                <div className="has-text-danger is-size-7"><b>Warning: THIS IS A TEST SITE. ANY ICP SENT WILL BE LOST!</b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="success"
                            onClick={isLoggedIn? handleBoost: redirectToLogon}
                            disabled={isLoading || boostMut.isLoading}
                        >
                            <i className="la la-rocket"/>&nbsp;<FormattedMessage id="BOOST" defaultMessage="BOOST"/>
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
};

export default Boost;