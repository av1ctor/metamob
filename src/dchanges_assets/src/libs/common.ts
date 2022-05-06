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
