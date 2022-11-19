import {logger} from "../../../declarations/logger";
import { Msg, MsgKind } from "../../../declarations/logger/logger.did";

export const kindToText = (
    kind: MsgKind
): string => {
    switch(kind) {
        case 0:
            return 'ERROR'
        case 1:
            return 'WARN'
        case 2:
            return 'INFO';
        default:
            return 'UNKN';
    }
};

export const kindToColor = (
    kind: MsgKind
): string => {
    switch(kind) {
        case 0:
            return 'danger'
        case 1:
            return 'warning'
        case 2:
            return 'primary';
        default:
            return 'secondary';
    }
};

export const findAll = async (
    offset: number,
    size: number
): Promise<Msg[]> => {
    return await logger.find(offset, size);
};
