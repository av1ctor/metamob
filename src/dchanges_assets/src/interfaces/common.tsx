export interface Filter {
    key: string;
    op: string;
    value: string;
};

export interface Order {
    key: string;
    dir: string;
};

export interface Limit {
    offset: number;
    size: number;
};

export enum PetitionState {
    CREATED = 0,
    CANCELED = 1,
    DELETED = 2,
    PUBLISHED = 3,
    FINISHED = 4,
    BANNED = 5,
}

export enum PetitionResult {
    NONE = 0,
    WON = 1,
    LOST = 2,
}

