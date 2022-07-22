import { metamob } from "../../../declarations/metamob";
import { Metamob } from "../../../declarations/metamob/metamob.did";

export const getConfigAsNat64 = async (
    key: string
): Promise<bigint> => {
    return await metamob.daoConfigGetAsNat64(key);
};

export const getStakedBalance = async (
    main?: Metamob
): Promise<bigint> => {
    if(!main) {
        return BigInt(0);
    }

    return await main.daoStakedBalance();
};

export const stake = async (
    value: bigint,
    main?: Metamob
): Promise<undefined> => {
    if(!main) {
        return;
    }

    const res = await main.daoStake(value);
    if('err' in res) {
        throw new Error(res.err);
    }

    return;
};

export const withdraw = async (
    value: bigint,
    main?: Metamob
): Promise<undefined> => {
    if(!main) {
        return;
    }

    const res = await main.daoWithdraw(value);
    if('err' in res) {
        throw new Error(res.err);
    }

    return;
};

