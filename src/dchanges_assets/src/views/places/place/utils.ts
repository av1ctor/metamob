import { PlaceAuth } from "../../../../../declarations/dchanges/dchanges.did";

export const transformAuth = (
    auth: PlaceAuth
): PlaceAuth => {
    if('email' in auth) {
        return {email: null};
    }
    else if('dip20' in auth) {
        return {
            dip20: {
                canisterId: auth.dip20.canisterId,
                minValue: BigInt(auth.dip20.minValue),
            }
        };
    }
    else if('dip721' in auth) {
        return {
            dip721: {
                canisterId: auth.dip721.canisterId,
                minValue: BigInt(auth.dip721.minValue),
            }
        };
    }

    return {none: null};
};

export const validateAuth = (
    value: any
): boolean => {
    if('none' in value) {
        return true;
    }
    else if('email' in value) {
        return true;
    }
    else if('dip20' in value) {
        if(!value.dip20['canisterId']) {
            return false;
        }
        if(!value.dip20['minValue']) {
            return false;
        }
        return true;
    }
    else if('dip721' in value) {
        if(!value.dip721['canisterId']) {
            return false;
        }
        if(String(value.dip721['minValue']) === '') {
            return false;
        }
        return true;
    }
    return false;
};