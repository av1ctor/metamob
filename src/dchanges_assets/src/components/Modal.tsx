import React, { ReactNode, useCallback } from "react";
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
    const handleClose = useCallback((e: any) => {
        props.onClose();
    }, [props.onClose]);
    
    return (
        createPortal(
            <div 
                className={`modal ${props.isOpen? 'is-block': 'is-hidden'} ${props.isOverOtherModal? 'modal-over-modal': ''}`}
            >
                <div 
                    className="modal-background" 
                    onClick={handleClose} 
                />
                <div className="modal-card">
                    {props.header? 
                        <header className="modal-card-head">
                            <div className="modal-card-title">{props.header}</div>
                            <button 
                                className="delete" 
                                aria-label="close"
                                onClick={handleClose}
                            />
                        </header>
                    :
                        <div className="modal-close">
                            <button 
                                className="delete" 
                                aria-label="close"
                                onClick={handleClose}
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