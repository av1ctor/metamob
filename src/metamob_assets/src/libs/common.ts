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

export const entityTypeToText = (
    type: EntityType
): string => {
    switch(type) {
        case EntityType.CAMPAIGNS:
            return 'Campaign';
        case EntityType.SIGNATURES:
            return 'Signature';
        case EntityType.VOTES:
            return 'Vote';
        case EntityType.DONATIONS:
            return 'Donation';
        case EntityType.FUNDINGS:
            return 'Fundraising';
        case EntityType.UPDATES:
            return 'Update';
        case EntityType.USERS:
            return 'User';
        case EntityType.PLACES:
            return 'Place';
        default:
            return 'Unknown';
    }
};

export const entityTypeToColor = (
    type: EntityType
): string => {
    switch(type) {
        case EntityType.CAMPAIGNS:
            return 'success';
        case EntityType.SIGNATURES:
            return 'danger';
        case EntityType.VOTES:
            return 'danger';
        case EntityType.DONATIONS:
            return 'danger';
        case EntityType.FUNDINGS:
            return 'danger';
        case EntityType.UPDATES:
            return 'warning';
        case EntityType.USERS:
            return 'dark';
        case EntityType.PLACES:
            return 'primary';
        default:
            return 'black';
    }
};