const alphabet = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']; // geohash
        
export const encode = (
    x: bigint
): string => {
    let b = Array<string>(12);
    let vx = x;
    let i = 0;
    while(i < 12) {
        b[11-i] = alphabet[Number(vx & 0x1fn)];
        vx >>= 5n;
        i += 1;
    };
    return b.reduce((s, c) => s + c, '');
};