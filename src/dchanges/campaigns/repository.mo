import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import DonationTypes "../donations/types";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Iter "mo:base/Iter";
import Nat "mo:base/Float";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Random "../common/random";
import Result "mo:base/Result";
import Schema "./schema";
import SignatureTypes "../signatures/types";
import Table "mo:mo-table/table";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Types "./types";
import ULID "../common/ulid";
import UpdateTypes "../updates/types";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Variant "mo:mo-table/variant";
import VoteTypes "../votes/types";

module {
    public class Repository() {
        let campaigns = Table.Table<Types.Campaign>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("campaigns")));

        public func create(
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _createEntity(req, callerId);
            switch(campaigns.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            campaign: Types.Campaign, 
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntity(campaign, req, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func publish(
            campaign: Types.Campaign, 
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWhenPublished(campaign, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func finish(
            campaign: Types.Campaign, 
            result: Types.CampaignResult,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWhenFinished(campaign, result, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            campaign: Types.Campaign,
            callerId: Nat32
        ): Result.Result<(), Text> {
            let e = _deleteEntity(campaign, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok();
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Campaign, Text> {
            switch(campaigns.get(_id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            #err("Not found");
                        };
                        case (?e) {
                            if(Option.isSome(e.deletedAt)) {
                                return #err("Not found");
                            };
                            #ok(e);
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Campaign, Text> {
            switch(campaigns.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            #err("Not found");
                        };
                        case (?e) {
                            if(Option.isSome(e.deletedAt)) {
                                return #err("Not found");
                            };                            
                            #ok(e);
                        };
                    };
                };
            };
        };

        func _toCriterias(
            criterias: ?[(Text, Text, Variant.Variant)]
        ): ?[Table.Criteria] {

            switch(criterias) {
                case null {
                    null;
                };
                case (?criterias) {
                    let buf = Buffer.Buffer<Table.Criteria>(criterias.size() + 1);
                    buf.add({       
                        key = "deletedAt";
                        op = #eq;
                        value = #nil;
                    });

                    for(crit in criterias.vals()) {
                        buf.add({
                            key = crit.0;
                            op = switch(crit.1) {
                                case "contains" #contains; 
                                case _ #eq;
                            };
                            value = switch(crit.2) {
                                case (#text(text)) {
                                    #text(Utils.toLower(text));
                                };
                                case _ {
                                    crit.2;
                                };
                            };
                        });
                    };

                    ?buf.toArray();
                };
            };
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Campaign, Types.Campaign) -> Int {
            switch(column) {
                case "_id" func(a: Types.Campaign, b: Types.Campaign): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "title" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Text.compare(a.title, b.title)) * dir;
                case "state" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat32.compare(a.state, b.state)) * dir;
                case "result" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat32.compare(a.result, b.result)) * dir;
                case "publishedAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.publishedAt, b.publishedAt)) * dir;
                case "createdAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "updatedAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.updatedAt, b.updatedAt)) * dir;
                case "categoryId" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat32.compare(a.categoryId, b.categoryId)) * dir;
                case _ {
                    func(a: Types.Campaign, b: Types.Campaign): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            return campaigns.find(
                _toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByCategory(
            categoryId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            let criterias = ?[
                {       
                    key = "categoryId";
                    op = #eq;
                    value = #nat32(categoryId);
                },
                {       
                    key = "deletedAt";
                    op = #eq;
                    value = #nil;
                }                    
            ];
            
            return campaigns.find(
                criterias, 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByPlace(
            placeId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            let criterias = ?[
                {       
                    key = "placeId";
                    op = #eq;
                    value = #nat32(placeId);
                },
                {       
                    key = "deletedAt";
                    op = #eq;
                    value = #nil;
                }                    
            ];
            
            return campaigns.find(
                criterias, 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByTag(
            tagId: Text,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            let criterias = ?[
                {       
                    key = "tagId";
                    op = #eq;
                    value = #text(tagId);
                },
                {       
                    key = "deletedAt";
                    op = #eq;
                    value = #nil;
                }
            ];
            
            return campaigns.find(
                criterias, 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                },
                {       
                    key = "deletedAt";
                    op = #eq;
                    value = #nil;
                }
            ];
            
            return campaigns.find(
                criterias, 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func onSignatureInserted(
            campaign: Types.Campaign,
            signature: SignatureTypes.Signature
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenSignatureInserted(campaign, signature)
            );
        };

        public func onSignatureDeleted(
            campaign: Types.Campaign,
            signature: SignatureTypes.Signature
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenSignatureDeleted(campaign, signature)
            );
        };

        public func onVoteInserted(
            campaign: Types.Campaign,
            vote: VoteTypes.Vote
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenVoteInserted(campaign, vote)
            );
        };

        public func onVoteUpdated(
            campaign: Types.Campaign,
            vote: VoteTypes.Vote
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenVoteUpdated(campaign, vote)
            );
        };

        public func onVoteDeleted(
            campaign: Types.Campaign,
            vote: VoteTypes.Vote
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenVoteDeleted(campaign, vote)
            );
        };

        public func onDonationInserted(
            campaign: Types.Campaign,
            donation: DonationTypes.Donation
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenDonationInserted(campaign, donation)
            );
        };

        public func onDonationDeleted(
            campaign: Types.Campaign,
            donation: DonationTypes.Donation
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenDonationDeleted(campaign, donation)
            );
        };

        public func onUpdateInserted(
            campaign: Types.Campaign,
            update: UpdateTypes.Update
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenUpdateInserted(campaign, update)
            );
        };

        public func onUpdateDeleted(
            campaign: Types.Campaign,
            update: UpdateTypes.Update
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenUpdateDeleted(campaign, update)
            );
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return campaigns.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            campaigns.restore(entities);
        };

        func _createInfoEntity(
            kind: Types.CampaignKind,
            goal: Nat
        ): Types.CampaignInfo {
            if(kind == Types.KIND_SIGNATURES) {
                #signatures({
                    total = 0;
                    goal = Nat32.fromNat(goal);
                    firstAt = null;
                    lastAt = null;
                    lastBy = null;
                });
            }
            else if(kind == Types.KIND_VOTES) {
                #votes({
                    pro = 0;
                    against = 0;
                    goal = Nat32.fromNat(goal);
                    firstAt = null;
                    lastAt = null;
                    lastBy = null;
                });
            }
            else if(kind == Types.KIND_ANON_VOTES) {
                #anonVotes({
                    pro = 0;
                    against = 0;
                    goal = Nat32.fromNat(goal);
                    firstAt = null;
                    lastAt = null;
                });
            }
            else if(kind == Types.KIND_WEIGHTED_VOTES) {
                #weightedVotes({
                    pro = 0;
                    against = 0;
                    goal = goal;
                    firstAt = null;
                    lastAt = null;
                    lastBy = null;
                });
            }
            else {
                #donations({
                    total = 0;
                    goal = goal;
                    firstAt = null;
                    lastAt = null;
                    lastBy = null;
                });
            };
        };

        func _updateInfoEntity(
            info: Types.CampaignInfo,
            goal: Nat
        ): Types.CampaignInfo {
            switch(info) {
                case (#signatures(i)) {
                    #signatures({
                        total = i.total;
                        goal = Nat32.fromNat(goal);
                    });
                };
                case (#votes(i)) {
                    #votes({
                        pro = i.pro;
                        against = i.against;
                        goal = Nat32.fromNat(goal);
                    });
                };
                case (#anonVotes(i)) {
                    #anonVotes({
                        pro = i.pro;
                        against = i.against;
                        goal = Nat32.fromNat(goal);
                    });
                };
                case (#weightedVotes(i)) {
                    #weightedVotes({
                        pro = i.pro;
                        against = i.against;
                        goal = goal;
                    });
                };
                case (#donations(i)) {
                    #donations({
                        total = i.total;
                        goal = goal;
                    });
                };
            };
        };

        func _createEntity(
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            let now: Int = Time.now();
            {
                _id = campaigns.nextId();
                pubId = ulid.next();
                kind = req.kind;
                title = req.title;
                target = req.target;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                placeId = req.placeId;
                state = switch(req.state) { 
                    case null Types.STATE_CREATED;
                    case (?state) state;
                };
                result = Types.RESULT_NONE;
                duration = req.duration;
                tags = req.tags;
                info = _createInfoEntity(req.kind, req.goal);
                updatesCnt = 0;
                publishedAt = null;
                expiredAt = null;
                createdAt = now;
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
                deletedAt = null;
                deletedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = req.kind;
                title = req.title;
                target = req.target;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                placeId = req.placeId;
                state = switch(req.state) { 
                    case null e.state;
                    case (?state) state;
                };
                result = e.result;
                duration = e.duration;
                tags = req.tags;
                info = _updateInfoEntity(e.info, req.goal);
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };

        func _deleteEntity(
            e: Types.Campaign, 
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = "";
                target = "";
                cover = "";
                body = "";
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = Types.STATE_DELETED;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = ?Time.now();
                deletedBy = ?callerId;
            }  
        };

        func _updateEntityWhenSignatureInserted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#signatures(info)) {
                        #signatures({
                            total = info.total + 1;
                            goal = info.goal;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenSignatureDeleted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#signatures(info)) {
                        #signatures({
                            total = if(info.total > 0) info.total - 1 else 0;
                            goal = info.goal;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };

        func _updateEntityWhenVoteInserted(
            e: Types.Campaign, 
            vote: VoteTypes.Vote
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#votes(info)) {
                        #votes({
                            pro = if(vote.pro) info.pro + 1 else info.pro;
                            against = if(not vote.pro) info.against + 1 else info.against;
                            goal = info.goal;
                        });
                    };
                    case (#anonVotes(info)) {
                        #anonVotes({
                            pro = if(vote.pro) info.pro + 1 else info.pro;
                            against = if(not vote.pro) info.against + 1 else info.against;
                            goal = info.goal;
                        });
                    };
                    case (#weightedVotes(info)) {
                        #weightedVotes({
                            pro = if(vote.pro) info.pro + 1 else info.pro;
                            against = if(not vote.pro) info.against + 1 else info.against;
                            goal = info.goal;
                        });
                    };                    
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };   

        func _updateEntityWhenVoteUpdated(
            e: Types.Campaign, 
            vote: VoteTypes.Vote
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#votes(info)) {
                        #votes({
                            pro = if(vote.pro) info.pro + 1 else info.pro - 1;
                            against = if(not vote.pro) info.against + 1 else info.against - 1;
                            goal = info.goal;
                        });
                    };
                    case (#anonVotes(info)) {
                        #anonVotes({
                            pro = if(vote.pro) info.pro + 1 else info.pro - 1;
                            against = if(not vote.pro) info.against + 1 else info.against - 1;
                            goal = info.goal;
                        });
                    };
                    case (#weightedVotes(info)) {
                        #weightedVotes({
                            pro = if(vote.pro) info.pro + 1 else info.pro - 1;
                            against = if(not vote.pro) info.against + 1 else info.against - 1;
                            goal = info.goal;
                        });
                    };                    
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };       

        func _updateEntityWhenVoteDeleted(
            e: Types.Campaign, 
            vote: VoteTypes.Vote
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#votes(info)) {
                        #votes({
                            pro = if(vote.pro) info.pro - 1 else info.pro;
                            against = if(not vote.pro) info.against - 1 else info.against;
                            goal = info.goal;
                        });
                    };
                    case (#anonVotes(info)) {
                        #anonVotes({
                            pro = if(vote.pro) info.pro - 1 else info.pro;
                            against = if(not vote.pro) info.against - 1 else info.against;
                            goal = info.goal;
                        });
                    };
                    case (#weightedVotes(info)) {
                        #weightedVotes({
                            pro = if(vote.pro) info.pro - 1 else info.pro;
                            against = if(not vote.pro) info.against - 1 else info.against;
                            goal = info.goal;
                        });
                    };                    
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };

        func _updateEntityWhenDonationInserted(
            e: Types.Campaign, 
            donation: DonationTypes.Donation
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#donations(info)) {
                        #donations({
                            total = info.total + donation.value;
                            goal = info.goal;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenDonationDeleted(
            e: Types.Campaign, 
            donation: DonationTypes.Donation
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = switch(e.info) {
                    case (#donations(info)) {
                        #donations({
                            total = info.total - donation.value;
                            goal = info.goal;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };

        func _updateEntityWhenUpdateInserted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                updatesCnt = e.updatesCnt + 1;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenUpdateDeleted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                updatesCnt = if(e.updatesCnt > 0) e.updatesCnt - 1 else 0;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };           

        func _updateEntityWhenPublished(
            e: Types.Campaign, 
            callerId: Nat32
        ): Types.Campaign {
            let now = Time.now();
            let limit = now + Int64.toInt(Int64.fromNat64(Nat64.fromNat(Nat32.toNat(e.duration) * (24 * 60 * 60 * 1000000))));
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = Types.STATE_PUBLISHED;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                updatesCnt = e.updatesCnt;
                publishedAt = ?now;
                expiredAt = ?limit;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenFinished(
            e: Types.Campaign, 
            result: Types.CampaignResult,
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                kind = e.kind;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                placeId = e.placeId;
                state = Types.STATE_FINISHED;
                result = result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };  
    };

    func serialize(
        e: Types.Campaign,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);

        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("kind", #nat32(e.kind));
        res.put("title", #text(if ignoreCase Utils.toLower(e.title) else e.title));
        res.put("target", #text(if ignoreCase Utils.toLower(e.target) else e.target));
        res.put("cover", #text(e.cover));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("categoryId", #nat32(e.categoryId));
        res.put("placeId", #nat32(e.placeId));
        res.put("state", #nat32(e.state));
        res.put("result", #nat32(e.result));
        res.put("duration", #nat32(e.duration));
        res.put("tags", #array(Array.map(e.tags, func(id: Text): Variant.Variant {#text(id);})));
        
        switch(e.info) {
            case (#signatures(info)) {
                res.put("info_total", #nat32(info.total));
                res.put("info_goal", #nat32(info.goal));
            };
            case (#votes(info)) {
                res.put("info_pro", #nat32(info.pro));
                res.put("info_against", #nat32(info.against));
                res.put("info_goal", #nat32(info.goal));
            };
            case (#anonVotes(info)) {
                res.put("info_pro", #nat32(info.pro));
                res.put("info_against", #nat32(info.against));
                res.put("info_goal", #nat32(info.goal));
            };
            case (#weightedVotes(info)) {
                res.put("info_pro", #nat(info.pro));
                res.put("info_against", #nat(info.against));
                res.put("info_goal", #nat(info.goal));
            };            
            case (#donations(info)) {
                res.put("info_total", #nat(info.total));
                res.put("info_goal", #nat(info.goal));
            };            
        };

        res.put("updatesCnt", #nat32(e.updatesCnt));
        res.put("publishedAt", switch(e.publishedAt) {case null #nil; case (?publishedAt) #int(publishedAt);});
        res.put("expiredAt", switch(e.expiredAt) {case null #nil; case (?expiredAt) #int(expiredAt);});
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("deletedAt", switch(e.deletedAt) {case null #nil; case (?deletedAt) #int(deletedAt);});
        res.put("deletedBy", switch(e.deletedBy) {case null #nil; case (?deletedBy) #nat32(deletedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Campaign {
        let kind: Types.CampaignKind = Variant.getOptNat32(map.get("kind"));

        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            kind = kind;
            title = Variant.getOptText(map.get("title"));
            target = Variant.getOptText(map.get("target"));
            cover = Variant.getOptText(map.get("cover"));
            body = Variant.getOptText(map.get("body"));
            categoryId = Variant.getOptNat32(map.get("categoryId"));
            placeId = Variant.getOptNat32(map.get("placeId"));
            state = Variant.getOptNat32(map.get("state"));
            result = Variant.getOptNat32(map.get("result"));
            duration = Variant.getOptNat32(map.get("duration"));
            tags = Array.map(Variant.getOptArray(map.get("tags")), Variant.getText);
            info = if(kind == Types.KIND_SIGNATURES) {
                #signatures({
                    total = Variant.getOptNat32(map.get("info_total"));
                    goal = Variant.getOptNat32(map.get("info_goal"));
                });
            }
            else if(kind == Types.KIND_VOTES) {
                #votes({
                    pro = Variant.getOptNat32(map.get("info_pro"));
                    against = Variant.getOptNat32(map.get("info_against"));
                    goal = Variant.getOptNat32(map.get("info_goal"));
                });
            }
            else if(kind == Types.KIND_ANON_VOTES) {
                #anonVotes({
                    pro = Variant.getOptNat32(map.get("info_pro"));
                    against = Variant.getOptNat32(map.get("info_against"));
                    goal = Variant.getOptNat32(map.get("info_goal"));
                });
            }
            else if(kind == Types.KIND_WEIGHTED_VOTES) {
                #weightedVotes({
                    pro = Variant.getOptNat(map.get("info_pro"));
                    against = Variant.getOptNat(map.get("info_against"));
                    goal = Variant.getOptNat(map.get("info_goal"));
                });
            }
            else /*if(kind == Types.KIND_DONATIONS)*/ {
                #donations({
                    total = Variant.getOptNat(map.get("info_total"));
                    goal = Variant.getOptNat(map.get("info_goal"));
                });
            };
            updatesCnt = Variant.getOptNat32(map.get("updatesCnt"));
            publishedAt = Variant.getOptIntOpt(map.get("publishedAt"));
            expiredAt = Variant.getOptIntOpt(map.get("expiredAt"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
            deletedAt = Variant.getOptIntOpt(map.get("deletedAt"));
            deletedBy = Variant.getOptNat32Opt(map.get("deletedBy"));
        }
    };
};