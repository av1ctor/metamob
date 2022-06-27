import { metamob } from "../../../declarations/metamob";

export const getConfigAsNat64 = async (
    key: string
): Promise<bigint> => {
    return await metamob.daoConfigGetAsNat64(key);
};

