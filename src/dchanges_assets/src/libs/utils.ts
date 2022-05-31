
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

export const limitText = (text: string, max: number): string => {
    return text.length <= max?
        text:
        text.substr(0, max) + '...';
};
