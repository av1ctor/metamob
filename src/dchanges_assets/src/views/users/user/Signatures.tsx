import React, { useContext } from "react";
import TimeFromNow from "../../../components/TimeFromNow";
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
        <>
            <div className="page-title has-text-info-dark">
                My signatures
            </div>

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
                
                <div className="signatures">
                    {signatures.status === 'success' && signatures.data && signatures.data.map((signature) => 
                        <BaseItem 
                            key={signature._id}    
                            user={authState.user}
                            signature={signature} 
                        >
                            <p>
                                <small>
                                <TimeFromNow 
                                    date={BigInt.asIntN(64, signature.createdAt)}
                                />
                                {signature.updatedBy && signature.updatedBy.length > 0 &&
                                    <>
                                        &nbsp;·&nbsp;<b><i>Edited</i></b>
                                    </>
                                }
                                </small>
                            </p>

                            Campaign: <CampaignLink 
                                id={signature.campaignId} 
                            />
                            
                        </BaseItem>
                    )}
                </div>        
            </div>
        </>
    );
};

export default Signatures;