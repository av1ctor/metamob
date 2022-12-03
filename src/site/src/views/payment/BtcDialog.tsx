import React, { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Button from "../../components/Button";
import { useActors } from "../../hooks/actors";
import { useUI } from "../../hooks/ui";
import { getBtcAddressOfCampaign } from "../../libs/payment";

interface Props {
    entityId: number;
    kind: string;
    categoryId: number;
    value: string;
    onVerify: (id: number) => Promise<boolean>;
    onClose: () => void;
};

const BtcDialog = (props: Props) => {
    const {metamob} = useActors();
    const {toggleLoading, isLoading} = useUI();

    const [address, setAddress] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    const handleVerify = useCallback(async (e: any) => {
        e.preventDefault();
        toggleLoading(true);
        try {
            setIsComplete(await props.onVerify(props.entityId));
        }
        finally {
            toggleLoading(false);
        }
    }, [props.onVerify, props.entityId]);
    
    const handleClose = useCallback((e: any) => {
        e.preventDefault();
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
        setIsComplete(false);
    }, [props.categoryId]);

    return (
        <form>
            <div className="mb-4">
                <p>Your {props.kind} was created {isComplete? 'and the deposit was received': "but it's now pending"}!</p>
                <div className="mt-2" />
                <p>
                    {isComplete?
                        <span>You can now close this dialog.</span>
                    :
                        <span><span className="has-text-danger"><b>Warning</b></span>: You must send {props.value} BTC to the address <b>{address? address: <Skeleton width={40} />}</b> in the next 5 minutes to confirm your {props.kind}.</span>
                    }
                </p>
            </div>
            <div className="field is-grouped mt-6">
                <div className="control">
                    <Button
                        onClick={handleVerify}
                        disabled={isLoading || isComplete}
                    >
                        Verify
                    </Button>
                </div>
                <div className="control">
                    <Button
                        color="danger"
                        onClick={handleClose}
                    >
                        {isComplete? 'Close': 'Cancel'}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default BtcDialog;