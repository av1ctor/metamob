import React, { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Button from "../../components/Button";
import Steps, { Step } from "../../components/Steps";
import { useActors } from "../../hooks/actors";
import { useUI } from "../../hooks/ui";
import { currencyToString, CurrencyType, getBtcAddressOfCampaign } from "../../libs/payment";

const icpSteps: Step[] = [
    {
        title: 'Create',
        icon: 'tools',
    },
    {
        title: 'Pay',
        icon: 'money-bill-wave-alt',
    },
    {
        title: 'Done',
        icon: 'thumbs-up',
    },
];

const btcSteps: Step[] = [
    {
        title: 'Create',
        icon: 'tools',
    },
    {
        title: 'Pay & Verify',
        icon: 'money-bill-wave-alt',
    },
    {
        title: 'Done',
        icon: 'thumbs-up',
    },
];

interface Props {
    kind: string;
    categoryId: number;
    currency: CurrencyType;
    value: string;
    onCreate: () => Promise<any>;
    onPay: (entity: any) => Promise<boolean>;
    onVerify: (entity: any) => Promise<boolean>;
    onClose: () => void;
};

const Dialog = (props: Props) => {
    const {metamob} = useActors();
    const {showError, toggleLoading, isLoading} = useUI();

    const [step, setStep] = useState(0);
    const [entity, setEntity] = useState<any>(undefined);
    const [address, setAddress] = useState('');

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();
        try {
            toggleLoading(true);

            const entity = await props.onCreate();
            setEntity(entity);
            
            setStep(step => step + 1);
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onCreate]);

    const handlePay = useCallback(async (e: any) => {
        e.preventDefault();
        try {
            toggleLoading(true);

            const res = await props.onPay(entity);
            if(res) {
                setStep(step => step + 1);
            }
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onPay, entity]);

    const handleVerify = useCallback(async (e: any) => {
        e.preventDefault();
        try {
            toggleLoading(true);

            const isComplete = await props.onVerify(entity);
            if(isComplete) {
                setStep(step => step + 1);
            }
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onVerify, entity]);
    
    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        setStep(0);
        props.onClose();
    }, [props.onClose]);
    
    const getAddress = async(
        categoryId: number,
    ) => {
        const address = await getBtcAddressOfCampaign(categoryId, metamob);
        setAddress(address);
    };

    useEffect(() => {
        getAddress(props.categoryId);
    }, [props.categoryId]);

    return (
        <>
            <Steps
                step={step}
                steps={props.currency === CurrencyType.ICP? icpSteps: btcSteps}
            />
            <form>
                <div className="mb-4">
                    {step === 0 &&
                        <div className="has-text-centered">
                            <p>You are about to make a {props.kind} of <b>{props.value} {currencyToString(props.currency)}</b>!</p>
                            <div className="mt-2" />
                            <p>Click Create to continue (you won't be billed just yet).</p>
                        </div>
                    }
                    {step === 1 &&
                        <div className="has-text-centered">
                            <p>Your {props.kind} was created and it's now in pending state.</p>
                            <div className="mt-2" />
                            {props.currency === CurrencyType.ICP &&
                                <div>
                                    <p>Your wallet will be billed <b>{props.value} {currencyToString(props.currency)}</b> plus fees.</p>
                                    <div className="mt-2" />
                                    <p>Click Pay to continue.</p>
                                </div>
                            }
                            {props.currency === CurrencyType.BTC &&
                                <div>
                                    <p>You must send <b>{props.value} BTC</b> to the address <b>{address? address: <Skeleton width={120} />}</b> in the next <b><u>5 minutes</u></b> to confirm your {props.kind}.</p>
                                </div>
                            }
                        </div>
                    }
                    {step === 2 &&
                        <div className="has-text-centered">
                            <p>Your {props.kind} was completed!</p>
                            <div className="mt-2" />
                            <p>You may now close this dialog.</p>
                        </div>
                    }
                </div>
                
                <div className="field is-grouped mt-6">
                    <div className="control">
                        {step === 0 &&
                            <Button
                                onClick={handleCreate}
                                disabled={isLoading}
                            >
                                Create
                            </Button>
                        }
                        {step === 1 && <>
                            {props.currency === CurrencyType.ICP &&
                                <Button
                                    onClick={handlePay}
                                    disabled={isLoading}
                                >
                                    Pay
                                </Button>
                            }
                            {props.currency === CurrencyType.BTC &&
                                <Button
                                    onClick={handleVerify}
                                    disabled={isLoading}
                                >
                                    Verify
                                </Button>
                            }
                        </>}
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            {step === 2? 'Close': 'Cancel'}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
};

export default Dialog;