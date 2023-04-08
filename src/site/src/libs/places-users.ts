import {Metamob, PlaceUser} from "../../../declarations/metamob/metamob.did";

export const findByPlaceAndUser = async (
    placeId?: number,
    userId?: number,
    metamob?: Metamob
): Promise<PlaceUser|undefined> => {
    if(!metamob || !placeId || !userId) {
        return undefined;
    }

    const res = await metamob.placeUserFindByPlaceAndUser(
        placeId, 
        userId);
    
    if('err' in res) {
        return undefined;
    }

    return res.ok; 
};
