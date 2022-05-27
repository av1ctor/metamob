import { PlaceRestriction } from "../../../../../declarations/dchanges/dchanges.did";

export const transformRestriction = (
    restriction: PlaceRestriction
): PlaceRestriction => {
    if('email' in restriction) {
        return {email: null};
    }
    else if('dip20' in restriction) {
        return {
            dip20: {
                canisterId: restriction.dip20.canisterId,
                minValue: BigInt(restriction.dip20.minValue),
            }
        };
    }
    else if('dip721' in restriction) {
        return {
            dip721: {
                canisterId: restriction.dip721.canisterId,
                minValue: BigInt(restriction.dip721.minValue),
            }
        };
    }

    return {none: null};
};

export const validateRestriction = (
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