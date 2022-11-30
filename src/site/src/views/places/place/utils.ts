import { PlaceAuth } from "../../../../../declarations/metamob/metamob.did";

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
                createMin: BigInt(auth.dip20.createMin),
                cooperateMin: BigInt(auth.dip20.cooperateMin),
            }
        };
    }
    else if('dip721' in auth) {
        return {
            dip721: {
                canisterId: auth.dip721.canisterId,
                createMin: BigInt(auth.dip721.createMin),
                cooperateMin: BigInt(auth.dip721.cooperateMin),
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
        if(!value.dip20['createMin']) {
            return false;
        }
        if(!value.dip20['cooperateMin']) {
            return false;
        }
        return true;
    }
    else if('dip721' in value) {
        if(!value.dip721['canisterId']) {
            return false;
        }
        if(!value.dip721['createMin']) {
            return false;
        }
        if(!value.dip721['cooperateMin']) {
            return false;
        }
        return true;
    }
    return false;
};