import { config } from "../config";

export const connect = async (
    whitelist?: string[]
): Promise<string> => {
    if(await window.ic.plug.isConnected()) {
        return '';
    }

    return window.ic.plug.requestConnect(
        {
            whitelist,
            host: config.IC_URL,
        }
    );
};

export const createActor = async <T>(
    canisterId: string,
    interfaceFactory: (IDL: any) => any
): Promise<T> => {
    return await window.ic.plug.createActor({
        canisterId,
        interfaceFactory
    });
};