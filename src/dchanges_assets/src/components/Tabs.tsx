import React, {useCallback, useState} from "react";

interface Tab {
    title: string;
    icon: string;
}

interface Props {
    tabs: Tab[];
    children: any[];
}

const Tabs = (props: Props) => {
    const [active, setActive] = useState(0);

    const handleChangeActive = useCallback((to: number) => {
        setActive(to);
    }, []);
    
    return (
        <>
            <div className="tabs is-boxed">
                <ul>
                    {props.tabs.map((tab, index) => 
                        <li key={index} className={`${index === active? 'is-active': ''}`}>
                            <a onClick={() => handleChangeActive(index)}>
                                <span className="icon is-small"><i className={`la la-${tab.icon}`}/></span>
                                <span>
                                    {tab.title}
                                </span>
                            </a>
                        </li>
                    )}
                </ul>
            </div>
            {props.children.map((child, index) => 
                <div className={`${index === active? 'is-visible': 'is-hidden'}`}>
                    {child}
                </div>)}
        </>
    );
};

export default Tabs;