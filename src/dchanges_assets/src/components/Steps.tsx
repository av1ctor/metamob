import React from "react";

export interface Step {
    title: string;
    icon: string;
};

interface Props {
    steps: Step[];
    step: number;
};

const Steps = (props: Props) => {
    return (
        <ul className="steps is-narrow is-medium is-centered has-content-centered">
            {props.steps.map((step, index) => 
                <li key={index} className={`steps-segment ${index === props.step? 'is-active': ''}`}>
                    <span className="steps-marker">
                        <span className="icon">
                            <i className={`la la-${step.icon}`}></i>
                        </span>
                    </span>
                    <div className="steps-content">
                        <p className="heading">{step.title}</p>
                    </div>
                </li>
            )}
        </ul>
    );
};

export default Steps;