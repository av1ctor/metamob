import React, { useCallback, useEffect, useRef } from "react";

interface Props {
    name?: string;
    id?: string;
    value?: string;
    label?: string;
    onChange: (e: any) => void;
};

const icons = [
    'anchor','arc_de','big_ben','bridge','bridge_a','bridge_b','building','building_8','building_a','building_a_10','building_b','building_b_12',
    'building_barn','building_c','building_c_15','building_d','building_d_17','building_e','building_e_19','building_f','building_f_21','building_g',
    'building_h','building_i','building_igloo','building_j','building_pisa','building_tower','building_tower_29','castle','castle_31','chedi','christ_the',
    'church','colosseum','direction_sign','door_house','door_wooden','eiffel_tower','electric_pole','factory','factory_42','fence','globe_all','greek_column',
    'high_voltage','home','home_48','home_a','home_b','home_fire','lighthouse','map','moai','mountain_sun','park','pyramid','statue_of','stonehenge',
    'taj_mahal','temple','temple_62','temple_63','volcanoe','warehouse','warehouse_66','water_fountain','water_tower','water_well','ziggurat'
].sort();

export const PlacePicker = (props: Props) => {
    
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
                            className={`pl-${icon}`} 
                            data-icon={icon}
                        />
                    </div>
                )}
            </div>
        </>
    );
};