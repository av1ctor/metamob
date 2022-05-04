import React from "react";
import {Link} from 'react-router-dom';
import { Petition } from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Category from "../categories/Category";
import Tag from "../tags/Tag";
import Card from "../../components/Card";

interface Props {
    petition: Petition
};

const buildCommenter = (petition: Petition): number[] => {
    if(petition.commentsCnt > 0) {
        let res = new Set([petition.createdBy]);
        petition.commenters.forEach(id => res.add(id));
        return Array.from(res);
    }
    else {
        return [petition.createdBy];
    }
};

export const Item = (props: Props) => {
    const petition = props.petition;

    return (
        <Card 
            title={
                <Link to={`/p/${petition.pubId}`}>{petition.title}</Link>
            } 
            subtitle={<>
                <Category id={petition.categoryId} />
                {petition.tags.map(id => <Tag key={id} id={id} />)}
            </>}
            img={
                <Link to={`/p/${petition.pubId}`}><img src="1280x960.png"/></Link>
            }
        >
            <div className="level">
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    {buildCommenter(petition).map((id) => <Avatar key={id} id={id} />)}
                </div>
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    {petition.commentsCnt}
                </div>
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    <Link to={`/p/${petition.pubId}`}>
                        <TimeFromNow 
                            date={BigInt.asIntN(64, petition.commentsCnt > 0? petition.lastCommentAt[0] || 0n: petition.createdAt)}
                        />
                    </Link>
                </div>
            </div>
        </Card>
    );
};

export const Header = () => {
    return (
        <div className="level">
            <div className="flex-1 p-4 border-b-4">
                Petition
            </div>
            <div className="flex-none w-16 p-4 border-b-4 text-center">
                Users
            </div>
            <div className="flex-none w-16 p-4 border-b-4 text-center">
                Comments
            </div>
            <div className="flex-none w-16 p-4 border-b-4 text-center">
                Activity
            </div>
        </div>
    );
};
