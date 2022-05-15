import React, { ReactElement } from "react";

interface Props {
    title: string | ReactElement,
    subtitle?: string | ReactElement,
    img: string | ReactElement,
    children: any
};

const Card = (props: Props) => {
    return (
        <div className="card">
            <div className="card-image">
                <figure className="image is-4by3">
                    {typeof props.img === "string"?
                        <img src={props.img} />:
                        props.img
                    }
                </figure>
            </div>
            <div className="card-content">
                <div className="media">
                    <div className="media-content">
                        <div className="title is-4">{props.title}</div>
                        <div className="subtitle is-6">{props.subtitle}</div>
                    </div>
                </div>

                <div className="content">
                    {props.children}
                </div>
            </div>
        </div>        
    );
};

export default Card;