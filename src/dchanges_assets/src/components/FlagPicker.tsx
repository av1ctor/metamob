import React, { useCallback, useEffect, useRef } from "react";

interface Props {
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange: (e: any) => void;
};

const icons = [
    'xx','ad','ae','af','ag','ai','al','am','ao','aq','ar','as','at','au','aw','ax','az','ba','bb','bd','be','bf','bg','bh','bi','bj','bl','bm','bn',
    'bo','bq','br','bs','bt','bv','bw','by','bz','ca','cc','cd','cf','cg','ch','ci','ck','cl','cm','cn','co','cr','cu','cv','cw','cx','cy','cz','de',
    'dj','dk','dm','do','dz','ec','ee','eg','eh','er','es','et','fi','fj','fk','fm','fo','fr','ga','gb','gd','ge','gf','gg','gh','gi','gl','gm','gn',
    'gp','gq','gr','gs','gt','gu','gw','gy','hk','hm','hn','hr','ht','hu','id','ie','il','im','in','io','iq','ir','is','it','je','jm','jo','jp','ke',
    'kg','kh','ki','km','kn','kp','kr','kw','ky','kz','la','lb','lc','li','lk','lr','ls','lt','lu','lv','ly','ma','mc','md','me','mf','mg','mh','mk',
    'ml','mm','mn','mo','mp','mq','mr','ms','mt','mu','mv','mw','mx','my','mz','na','nc','ne','nf','ng','ni','nl','no','np','nr','nu','nz','om','pa',
    'pe','pf','pg','ph','pk','pl','pm','pn','pr','ps','pt','pw','py','qa','re','ro','rs','ru','rw','sa','sb','sc','sd','se','sg','sh','si','sj','sk',
    'sl','sm','sn','so','sr','ss','st','sv','sx','sy','sz','tc','td','tf','tg','th','tj','tk','tl','tm','tn','to','tr','tt','tv','tw','tz','ua','ug',
    'um','us','uy','uz','va','vc','ve','vg','vi','vn','vu','wf','ws','ye','yt','za','zm','zw','ac','cp','dg','ea','es-ct','es-ga','eu','gb-eng','gb-nir',
    'gb-sct','gb-wls','ic','ta','un','xk'
].sort();

export const FlagPicker = (props: Props) => {
    
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
                        title={icon}
                        data-icon={icon}
                        onClick={handleSelect}
                    >
                        <span 
                            className={`fi fi-${icon} fis`}
                            data-icon={icon}
                        />
                    </div>
                )}
            </div>
        </>
    );
};