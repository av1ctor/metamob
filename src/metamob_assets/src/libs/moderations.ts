
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
    offensive = 64,
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
        default:
            return 'Other';
    }
};

export const moderationReasonToColor = (
    reason: ModerationReason
): string => {
    switch(reason) {
        case ModerationReason.NONE:
        case ModerationReason.FAKE:
        case ModerationReason.NUDITY:
        case ModerationReason.HATE:
        case ModerationReason.SPAM:
        case ModerationReason.CONFIDENTIAL:
        case ModerationReason.COPYRIGHT:
        default:
            return 'danger';
    }
};