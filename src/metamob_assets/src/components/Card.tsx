import React, { ReactElement } from "react";

interface Props {
    title: string | ReactElement,
    subtitle?: string | ReactElement,
    img?: string | ReactElement,
    icon?: string | ReactElement,
    children: any
};

const Card = (props: Props) => {
    return (
        <div className="card">
            <div className="card-image">
                {props.img &&
                    <figure className="image is-4by3">
                        {typeof props.img === "string"?
                            <img src={props.img} />:
                            props.img
                        }
                    </figure>
                }
                {props.icon &&
                    <figure className="">
                        {typeof props.icon === "string"?
                            <i className={props.icon} />:
                            props.icon
                        }
                    </figure>
                }
            </div>
            <div className="card-content">
                <div className="media">
                    <div className="media-content has-text-left">
                        <div className="title is-4">{props.title}</div>
                        <div className="subtitle is-6">{props.subtitle}</div>
                    </div>
                </div>

                <div className="content has-text-left">
                    {props.children}
                </div>
            </div>
        </div>        
    );
};

export default Card;