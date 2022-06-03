import React, { useCallback, useEffect, useRef } from "react";

interface Props {
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange: (e: any) => void;
};

const icons = [
    'alarm-clock','antenna','apartment','shopping-bag','shopping-basket','shopping-basket-1','battery','battery-1','bell','binocular','sailboat','book','bookmark',
    'briefcase','brightness','browser','paint-brush','building','idea','school-bus','birthday-cake','birthday-cake-1','calculator','calendar','calendar-1','calendar-2',
    'shopping-cart','money','money-1','money-2','cctv','certificate','certificate-1','chair','chat','chat-1','chef','cursor','wall-clock','coding','coffee','coffee-1',
    'compass','computer','computer-1','agenda','crop','crown','pendrive','calendar-3','calendar-4','ruler','diagram','diamond','book-1','chat-2','chat-3','route','file',
    'inbox','download','cocktail','dumbbell','dvd','edit','edit-1','edit-2','mortarboard','calendar-5','calendar-6','factory','file-1','file-2','filter','filter-1',
    'fire-extinguisher','flag','flame','flash','flight','flight-1','bottle','floppy-disk','flow','focus','folder','dinner','fuel','gamepad','gift','trolley','package',
    'hammer','hammer-1','headset','house','house-1','hook','id-card','id-card-1','idea-1','image','image-1','image-2','inbox-1','inbox-2','inbox-3','inbox-4','download-1',
    'bug','invoice','invoice-1','key','startup','startup-1','library','idea-2','lighthouse','link','pin','pin-1','padlock','magic-wand','magnifying-glass','email','email-1',
    'map','pin-2','map-1','marker','first-aid-kit','mail','chat-4','email-2','chip','chip-1','microphone','microphone-1','smartphone','cocktail-1','more','ticket','compass-1',
    'add-file','nib','notebook','notepad','notepad-1','notepad-2','notification','notification-1','open-book','open-book-1','file-3','paint-bucket','paint-roller','paper-plane',
    'pen','pencil','pencil-1','smartphone-1','photo-camera','push-pin','pin-3','push-pin-1','push-pin-2','video-player','swimming-pool','presentation','presentation-1',
    'presentation-2','file-4','user','property','wallet','radio','radio-1','random','open-book-2','reload','cutlery','startup-2','router','ruler-1','safebox','hourglass',
    'satellite','calendar-7','monitor','monitor-1','search','cursor-1','settings','share','share-1','share-2','crane','ship','shopping-cart-1','sim-card','sofa','speaker',
    'speaker-1','speech','stamp','stethoscope','suitcase','syringe','tag','tag-1','target','tea','chip-2','telescope','ticket-1','ticket-2','calendar-8','torch','train',
    'delivery-truck','delivery-truck-1','delivery-truck-2','trash','suitcase-1','television','umbrella','outbox','upload','usb','user-1','video-camera','gallery','film-reel',
].sort();

export const IconPicker = (props: Props) => {
    
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
                        onClick={handleSelect}
                    >
                        <i 
                            className={`inter-${icon}`} 
                            data-icon={icon}
                        />
                    </div>
                )}
            </div>
        </>
    );
};