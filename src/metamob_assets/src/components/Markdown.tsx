import React from "react";
import ReactMarkdown from "react-markdown";

interface Props {
    className?: string;
    body: string;
}

export const Markdown = (props: Props) => {
    return (
        <ReactMarkdown 
            className={props.className} 
            children={props.body.replace(/\n\n/g, '\n  \n')}
        />
    );
};