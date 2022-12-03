import { Metamob } from "../../../declarations/metamob/metamob.did";

export enum CurrencyType {
    ICP = 0,
    BTC = 1,
};

export const currencyOptions = [
    {label: 'ICP', value: CurrencyType.ICP},
    {label: 'BTC', value: CurrencyType.BTC},
];

export const currencyToString = (
    cur: CurrencyType
): string => {
    switch(cur) {
        case CurrencyType.ICP:
            return "ICP";
        case CurrencyType.BTC:
            return "BTC";
        default:
            return "UNK";
    }
};

export const getBtcAddressOfCampaign = async (
    campaignId: number,
    metamob?: Metamob
): Promise<string> => {
    if(!metamob) {
        return "";
    }
    
    let res = await metamob.paymentGetBtcAddressOfCampaign(campaignId);
    if('err' in res) {
        return "";
    }

    return res.ok;
};