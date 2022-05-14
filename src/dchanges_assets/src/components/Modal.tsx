import React, { ReactNode } from "react";
import {createPortal} from "react-dom";

interface Props {
    header?: ReactNode;
    footer?: ReactNode;
    isOpen: boolean;
    isOverOtherModal?: boolean;
    children: any;
    onClose: () => void;
};

export default function(props: Props) {
    return (
        createPortal(
            <div className={`modal ${props.isOpen? 'is-block': 'is-hidden'} ${props.isOverOtherModal? 'modal-over-modal': ''}`}>
                <div className="modal-background"/>
                <div className="modal-card">
                    {props.header? 
                        <header className="modal-card-head">
                            <div className="modal-card-title">{props.header}</div>
                            <button 
                                className="delete" 
                                aria-label="close"
                                onClick={props.onClose}
                            />
                        </header>
                    :
                        <div className="modal-close">
                            <button 
                                className="delete" 
                                aria-label="close"
                                onClick={props.onClose}
                            />                            
                        </div>
                    }
                    <section className="modal-card-body">
                        {props.children}
                    </section>
                    {props.footer &&
                        <footer className="modal-card-foot">
                            {props.footer}
                        </footer>
                    }
                </div>
            </div>,
            document.body
        )     
    );
};