import React from "react";
import Modal from "react-modal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: any;
};

export default function(props: Props) {
    return (
        <Modal
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            ariaHideApp={false}
        >
            {props.children}
        </Modal>
    );
};