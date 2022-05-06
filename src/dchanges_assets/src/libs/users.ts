import { AuthClient } from "@dfinity/auth-client";
import { config } from "../config";

export const loginUser = async (
    client: AuthClient, 
    onSuccess: () => void, 
    onError: (msg: string|undefined) => void
): Promise<void> => {
    const width = 500;
    const height = screen.height;
    const left = ((screen.width/2)-(width/2))|0;
    const top = ((screen.height/2)-(height/2))|0; 
    
    client.login({
        identityProvider: config.II_URL,
        windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
        onSuccess: onSuccess,
        onError: onError,
    });

};