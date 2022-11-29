import { ICProvider, ICProviderType } from "../interfaces/icprovider";
import InternetIdentityProvider from "../providers/iiprovider";
import PlugProvider from "../providers/plugprovider";

export class IcProviderBuider {
    providersList: ICProviderType[] = [];
    
    public withInternetIdentity(
    ): IcProviderBuider  {
        this.providersList.push(ICProviderType.InternetIdentity);
        return this;
    }

    public withPlug(
    ): IcProviderBuider  {
        this.providersList.push(ICProviderType.Plug);
        return this;
    }

    public build(
        providerType: ICProviderType | undefined
    ): ICProvider | undefined {
        if(providerType === undefined) {
            const item = window.localStorage.getItem('providerType') || undefined;
            const providerType = item? ICProviderType[item as keyof typeof ICProviderType]: undefined;
            if(providerType !== undefined && this.providersList.indexOf(providerType) > -1) {
                return this._createProvider(providerType);
            }
            else {
                return;
            }
        }
        else {
            return this._createProvider(providerType);
        }
    }

    _createProvider(
        providerType: ICProviderType
    ): ICProvider | undefined {
        switch(providerType) {
            case ICProviderType.InternetIdentity:
                return new InternetIdentityProvider();
            case ICProviderType.Plug:
                return new PlugProvider();
            default:
                return;
        }
    }
};