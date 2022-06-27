import { metamob } from "../../../declarations/metamob";
import {PlaceUser} from "../../../declarations/metamob/metamob.did";

export const findByPlaceAndUser = async (
    placeId?: number,
    userId?: number
): Promise<PlaceUser|undefined> => {
    if(!placeId || !userId) {
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
