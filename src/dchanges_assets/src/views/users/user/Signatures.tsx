import React, { useContext } from "react";
import { useFindUserSignatures } from "../../../hooks/signatures";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import { CampaignLink } from "../../campaigns/campaign/Link";
import {BaseItem} from "../../signatures/Item";

interface Props {
};

const orderBy = {
    key: '_id',
    dir: 'desc'
};

const limit = {
    offset: 0,
    size: 10
};

const Signatures = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const signatures = useFindUserSignatures(authState.user?._id || 0, orderBy, limit, actorState.main);
    
    if(!authState.user) {
        return <div>Forbidden</div>;
    }
    
    return (
        <div className="container">
            <div>
                {signatures.status === 'loading' &&
                    <div>
                        Loading...
                    </div>
                }

                {signatures.status === 'error' &&
                    <div className="form-error">
                        {signatures.error.message}
                    </div>
                }
                
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {signatures.status === 'success' && signatures.data && signatures.data.map((signature) => 
                        <div 
                            key={signature._id}    
                            className="column is-6"
                        >
                            <BaseItem 
                                user={authState.user}
                                signature={signature} 
                            >
                                <CampaignLink 
                                    id={signature.campaignId} 
                                />
                                
                            </BaseItem>
                        </div>
                    )}
                </div>        
            </div>
        </div>
    );
};

export default Signatures;