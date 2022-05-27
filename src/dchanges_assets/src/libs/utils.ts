
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

export const debounce = (
    callback: (args: any) => void, 
    wait: number
) => {
    let timeoutId: any = null;
    return (...args: any) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
};