import { metamob } from "../../../declarations/metamob";
import { Metamob } from "../../../declarations/metamob/metamob.did";

export const getConfigAsNat64 = async (
    key: string
): Promise<bigint> => {
    return await metamob.daoConfigGetAsNat64(key);
};

export const getStakedBalance = async (
    metamob?: Metamob
): Promise<bigint> => {
    if(!metamob) {
        return BigInt(0);
    }

    return await metamob.daoStakedBalance();
};

export const stake = async (
    value: bigint,
    metamob?: Metamob
): Promise<undefined> => {
    if(!metamob) {
        return;
    }

    const res = await metamob.daoStake(value);
    if('err' in res) {
        throw new Error(res.err);
    }

    return;
};

export const unstake = async (
    value: bigint,
    metamob?: Metamob
): Promise<undefined> => {
    if(!metamob) {
        return;
    }

    const res = await metamob.daoUnStake(value);
    if('err' in res) {
        throw new Error(res.err);
    }

    return;
};

export const getDepositedBalance = async (
    metamob?: Metamob
): Promise<bigint> => {
    if(!metamob) {
        return BigInt(0);
    }

    return await metamob.daoDepositedBalance();
};
