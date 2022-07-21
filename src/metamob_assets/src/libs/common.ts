export interface Filter {
    key: string;
    op: string;
    value: any;
};

export interface Order {
    key: string;
    dir: string;
};

export interface Limit {
    offset: number;
    size: number;
};

export enum EntityType {
    CAMPAIGNS = 0,
    USERS = 1,
    SIGNATURES = 2,
    UPDATES = 3,
    VOTES = 4,
    DONATIONS = 5,
    FUNDINGS = 6,
    PLACES = 7,
}