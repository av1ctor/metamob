import React, { useCallback } from "react";
import { Campaign } from "../../../../../declarations/dchanges/dchanges.did";
import { config } from "../../../config";

interface Props {
    campaign: Campaign
}

const genFacebook = (camp: Campaign): string => {
    const uri = encodeURI(`${config.BASE_URL}/#/c/${camp.pubId}`);
    return `https://www.facebook.com/sharer/sharer.php?u=${uri}`;
};

const genEmail = (camp: Campaign): string => {
    const email = `mailto:?subject=${camp.title}&body=Hello,

${camp.body}

Sign the campaign now:
${config.BASE_URL}/#/c/${camp.pubId}`;

    return encodeURI(email);
};

const genTwitter = (camp: Campaign): string => {
    const uri = encodeURI(`${config.BASE_URL}/#/c/${camp.pubId}`);
    const text = encodeURI(`${camp.title}. Sign the campaign now!`);
    return `https://twitter.com/share?related=d-changes&url=${uri}&text=${text} @dchangesdotorg`;
};

const Share = (props: Props) => {
    
    const handleOpenWindow = useCallback((e: any) => {
        e.preventDefault();
        
        const width = 500;
        const height = screen.height;
        const left = ((screen.width/2)-(width/2))|0;
        const top = ((screen.height/2)-(height/2))|0; 

        const url = e.target.dataset.href;
        window.open(url, "_blank", `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`);
    }, []);
    
    return (
        <div>
            <div
                className="is-size-4 has-text-success-dark mb-2"
            >
                Share this campaign
            </div>
            <div className="columns">
                <div className="column is-6">
                    <a 
                        className="share facebook"
                        data-href={genFacebook(props.campaign)} 
                        href="#"
                        onClick={handleOpenWindow}
                    >
                        <i className="la la-facebook"/> facebook
                    </a>
                </div>
                <div className="column is-6">
                    <a 
                        className="share email"
                        data-href={genEmail(props.campaign)} 
                        href="#"
                        onClick={handleOpenWindow}
                    >
                        <i className="la la-envelope-open-text"/> e-mail
                    </a>
                </div>
            </div>
            <div className="columns">
                <div className="column is-6">
                    <a 
                        className="share twitter"
                        data-href={genTwitter(props.campaign)} 
                        href="#"
                        onClick={handleOpenWindow}
                    >
                        <i className="la la-twitter"/> twitter
                    </a>
                </div>
                <div className="column is-6">
                    
                </div>
            </div>
        </div>
    );
};

export default Share;
