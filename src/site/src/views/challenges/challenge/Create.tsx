import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from 'yup';
import { ChallengeRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import { useCreateChallenge } from "../../../hooks/challenges";
import { useWallet } from "../../../hooks/wallet";
import { useUI } from "../../../hooks/ui";
import { getConfigAsNat64 } from "../../../libs/dao";
import { e8sToDecimal } from "../../../libs/icp";

interface Props {
    moderationId: number;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    moderationId: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const CreateForm = (props: Props) => {
    const {balances, approveMMT} = useWallet();
    
    const {showSuccess, showError, toggleLoading, isLoading} = useUI();
    
    const [form, setForm] = useState<ChallengeRequest>({
        moderationId: props.moderationId,
        description: '',
    });
    const [minDeposit, setMinDeposit] = useState(0n);

    const createMut = useCreateChallenge();

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
            showError(errors);
            return;
        }
        
        try {
            toggleLoading(true);

            if(!await approveMMT(minDeposit)) {
                showError("Approve failed");
                return;
            };

            await createMut.mutateAsync({
                req: {
                    moderationId: form.moderationId,
                    description: form.description,
                }
            });

            showSuccess('Challenge created!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, minDeposit, props.onClose]);

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

    const init = async () => {
        const dep = await getConfigAsNat64('CHALLENGER_DEPOSIT');
        setMinDeposit(dep);
    };

    useEffect(() => {
        init();
    }, []);

    return (
        <form onSubmit={handleCreate}>
            <Container>
                <div className="mb-4">
                    <p><FormattedMessage defaultMessage="To challenge a moderation, your wallet will be billed {mmt} MMT" values={{mmt: e8sToDecimal(minDeposit)}} />.</p>
                    <p className="mt-2"><FormattedMessage defaultMessage="If the challenge is accepted and the moderation get reverted, the deposited value will be reimbursed to your wallet. Otherwise"/>, <b><span className="has-text-danger"><FormattedMessage defaultMessage="the value deposited will be lost"/></span></b>!</p>
                    {balances.mmt <= minDeposit &&
                        <p className="mt-2">
                            <FormattedMessage defaultMessage="Sorry, your balance ({mmt} MMT) is too low" values={{mmt: e8sToDecimal(balances.mmt)}} />.
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
                            disabled={isLoading || balances.mmt <= minDeposit}
                            onClick={handleCreate}>
                            <FormattedMessage id="Create" defaultMessage="Create"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}>
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </Container>
        </form>    
    )
};

export default CreateForm;