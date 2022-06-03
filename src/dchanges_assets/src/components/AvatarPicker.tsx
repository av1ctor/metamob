import React, { useCallback, useEffect, useRef } from "react";

interface Props {
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange: (e: any) => void;
};

const icons = [
    'afro','afrofuturism','beatnik','biker','bodybuilder','bohemian','bosozoku','boy','chonga','cosplayer','cosplayer2','e-girl',
    'e-girl2','eighties','emo','formal','gang-member','ganguro-girl','gothic','gothic2','grunge','grunge2','heavy','hippie','hipster',
    'hipster2','lady','mod','mod2','modern','nerd','otaku','pimp','posh','preppy','punk','punk2','punk3','rapper','rapper2','rastafari',
    'rave','regular','regular2','rockabilly','rocker','rocker2','seapunk','surfer','yuppie'
].sort();

export const AvatarPicker = (props: Props) => {
    
    const containerRef = useRef(null);
    
    const handleSelect = useCallback((e: any) => {
        const elm = e.target;
        props.onChange({target: {id: props.id, name: props.name, value: elm.dataset.icon}})
    }, [props.onChange]);

    useEffect(() => {
        if(props.value) {
            const container = containerRef.current as HTMLDivElement|null;
            if(container) {
                const index = icons.indexOf(props.value);
                if(index >= 0) {
                    const elm = container.children[index];
                    elm.scrollIntoView();
                }
            }
        }
    }, [props.value, containerRef.current]);
    
    return (
        <>
            <div className="field">
                <label className="label" >
                    {props.label}
                </label>                
            </div>
            <div 
                ref={containerRef}
                className="icon-picker-container"
            >
                {icons.map((icon, index) => 
                    <div 
                        key={index} 
                        className={`icon-box ${icon === props.value? 'selected': ''}`}
                        data-icon={icon}
                        title={icon}
                        onClick={handleSelect}
                    >
                        <i 
                            className={`ava-${icon}`} 
                            data-icon={icon}
                        />
                    </div>
                )}
            </div>
        </>
    );
};