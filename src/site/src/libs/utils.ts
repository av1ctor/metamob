import { Variant } from "../../../declarations/metamob/metamob.did";

export const JsonStringfy = (
    src: any
): string => {
    return JSON.stringify(src, (k, v) => typeof v === 'bigint'? v.toString(): v, 2)
}

export const setField = (
    obj: any, 
    name: string, 
    value: any
): any => {
    const clone = Object.assign({}, obj);
    let field = clone;

    if(name.indexOf('.') >= 0)
    {
        const fields = name.split('.');
        name = fields.pop() || '';
        fields.forEach(f =>
        {
            const parent = field;
            field = field[f];
            if(!field)
            {
                field = parent[f] = {};
            }
        });
    }
        
    field[name] = value;

    return clone;
}

export const copyToClipboard = (
    elm: HTMLElement
): void => {
    if ((document as any).selection) {
        const range = (document.body as any).createTextRange();
        range.moveToElementText(elm);
        range.select().createTextRange();
        document.execCommand("copy");
    } 
    else if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
        const range = document.createRange();
        range.selectNode(elm);
        window.getSelection()?.addRange(range);
        document.execCommand("copy");
        window.getSelection()?.removeAllRanges();
    }
}

export const limitText = (
    text: string, 
    max: number
): string => {
    return text.length <= max?
        text:
        text.substr(0, max) + '...';
};

const removeZerosAtRight = (
    s: string,
    decimals: number = 2): string => {
    let i = s.length - 1;
    for(; i > 0; i--) {
        if(s.charCodeAt(i) !== 48) {
            break;
        }
    }
    return s.substring(0, i+decimals);
};

export const e2sToDecimal = (
    icp: bigint,
    decimals?: number
): string => {
    const int = Number(icp / BigInt(1e2));
    const dec = ('00' + Math.abs(Number(icp % BigInt(1e2))).toString()).substr(-2, decimals || 2);
    return `${int}.${removeZerosAtRight(dec, decimals)}`; 
}

export const decimalToE2s = (
    value: string
): bigint => {
    const dot = value.indexOf('.');
    const int = dot > -1? 
        BigInt(value.substring(0, dot) || '0'):
        BigInt(value);
    const dec = dot > -1? 
        Number(value.substring(dot)):
        Number(0);
    return int * BigInt(1e2) + BigInt(Math.ceil(dec * 1e2)|0); 
}


export const variantUnbox = (
    value: Variant
): any => {
    if(!value) {
        return undefined;
    }
    else if('nil' in value) {
        return null;
    }
    else if('text' in value) {
        return value.text;
    }
    else if('array' in value) {
        return value.array.map(i => variantUnbox(i));
    }
    else if('map' in value) {
        return value.map.reduce((obj, entry) => {
            obj[entry.key] = variantUnbox(entry.value)
            return obj;
        }, {} as any);
    }
    else if('float' in value) {
        return value.float;
    }
    else if('bool' in value) {
        return value.bool;
    }
    else if('int' in value) {
        return value.int;
    }
    else if('nat' in value) {
        return value.nat;
    }
    else if('int8' in value) {
        return value.int8;
    }
    else if('nat8' in value) {
        return value.nat8;
    }
    else if('int16' in value) {
        return value.int16;
    }
    else if('nat16' in value) {
        return value.nat16;
    }
    else if('int32' in value) {
        return value.int32;
    }
    else if('nat32' in value) {
        return value.nat32;
    }
    else if('int64' in value) {
        return value.int64;
    }
    else if('nat64' in value) {
        return value.nat64;
    }
    else if('blob' in value) {
        return value.blob;
    }
};
