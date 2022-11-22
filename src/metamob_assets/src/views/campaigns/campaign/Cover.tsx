import React from "react";
import { FileRequest } from "../../../../../declarations/metamob/metamob.did";

interface Props {
    cover: string | FileRequest | undefined;
    isPreview?: boolean;
};

const Cover = (props: Props) => {
    return (
        props.isPreview? 
            typeof props.cover === 'object'?
                <img 
                    src={`data:${props.cover.contentType};base64,` + Buffer.from(props.cover.data).toString('base64')} 
                />
            :
                <img src={props.cover}/>
        :
            typeof props.cover === 'string'?
                <img src={props.cover.indexOf('/') > -1? props.cover: process.env.FILESTORE_URL_LOCAL?.replace('{id}', props.cover)}/>
            :
                null
    );
};

export default Cover;
