import { Metamob, ModerationResponse } from "../../../declarations/metamob/metamob.did";
import { EntityType, Limit, Order } from "./common";

export enum ModerationState {
    Created = 0,
    Challenged = 1,
    Confirmed = 2,
    Reverted = 3,
}

export enum ModerationReason {
    NONE = 0,
    FAKE = 1,
    NUDITY = 2,
    HATE = 4,
    SPAM = 8,
    CONFIDENTIAL = 16,
    COPYRIGHT = 32,
    OFFENSIVE = 64,
    OTHER = 65536
}

export enum ModerationAction {
    Flagged = 1,
    Redacted = 2,
}

export const reasons: {name: string, value: any}[] = [
    {name: 'Fake or fraudulent', value: ModerationReason.FAKE},
    {name: 'Contains nudity', value: ModerationReason.NUDITY},
    {name: 'Promotes hate, violence or illegal/offensive activities', value: ModerationReason.HATE},
    {name: 'Spam, malware or "phishing" (fake login)', value: ModerationReason.SPAM},
    {name: 'Private or confidential information', value: ModerationReason.CONFIDENTIAL},
    {name: 'Copyright infringement', value: ModerationReason.COPYRIGHT},
    {name: 'Offensive', value: ModerationReason.OFFENSIVE},
    {name: 'Other', value: ModerationReason.OTHER},
];

export const actions: {name: string, value: any}[] = [
    {name: 'Flagged', value: ModerationAction.Flagged},
    {name: 'Redacted', value: ModerationAction.Redacted},
];

export const moderationReasonToText = (
    reason: ModerationReason
): string => {
    switch(reason) {
        case ModerationReason.NONE:
            return '';
        case ModerationReason.FAKE:
            return 'Fake';
        case ModerationReason.NUDITY:
            return 'Nudity';
        case ModerationReason.HATE:
            return 'Hate';
        case ModerationReason.SPAM:
            return 'Spam';
        case ModerationReason.CONFIDENTIAL:
            return 'Confidential';
        case ModerationReason.COPYRIGHT:
            return 'Copyright';
        case ModerationReason.OFFENSIVE:
            return 'Offensive';
        default:
            return 'Other';
    }
};

export const moderationReasonToTitle = (
    reason: ModerationReason
): string => {
    switch(reason) {
        case ModerationReason.NONE:
            return '';
        case ModerationReason.FAKE:
            return 'Fake or fraudulent';
        case ModerationReason.NUDITY:
            return 'Contains nudity';
        case ModerationReason.HATE:
            return 'Promotes hate, violence or illegal/offensive activities';
        case ModerationReason.SPAM:
            return 'Spam, malware or "phishing" (fake login)';
        case ModerationReason.CONFIDENTIAL:
            return 'Private or confidential information';
        case ModerationReason.COPYRIGHT:
            return 'Copyright infringement';
        case ModerationReason.OFFENSIVE:
            return 'Offensive';
        default:
            return 'Other';
    }
};

export const moderationReasonToColor = (
    reason: ModerationReason
): string => {
    switch(reason) {
        case ModerationReason.NONE:
        case ModerationReason.SPAM:
        case ModerationReason.CONFIDENTIAL:
        case ModerationReason.COPYRIGHT:
        case ModerationReason.OFFENSIVE:
            return "warning";

        case ModerationReason.FAKE:
        case ModerationReason.NUDITY:
        case ModerationReason.HATE:
        default:
            return 'danger';
    }
};

export const moderationActionToText = (
    action: ModerationAction
): string => {
    switch(action) {
        case ModerationAction.Flagged:
            return 'Flagged';
        case ModerationAction.Redacted:
            return 'Redacted';
    }
};

export const moderationStateToText = (
    state: ModerationState
): string => {
    switch(state) {
        case ModerationState.Created:
            return 'Created';
        case ModerationState.Challenged:
            return 'Challenged';
        case ModerationState.Reverted:
            return 'Reverted';
        case ModerationState.Confirmed:
            return 'Confirmed';
    }
};

export const findByEntity = async (
    entityType: EntityType,
    entityId: number,
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<ModerationResponse[]> => {
    if(!metamob) {
        return [];
    }

    const res = await metamob.moderationFindByEntity(
        entityType,
        entityId,
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}
