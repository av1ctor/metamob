import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Random "../common/random";
import Result "mo:base/Result";
import Schema "./schema";
import SignatureTypes "../signatures/types";
import FundingTypes "../fundings/types";
import DonationTypes "../donations/types";
import UpdateTypes "../updates/types";
import VoteTypes "../votes/types";
import Table "mo:mo-table/table";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Types "./types";
import ULID "../common/ulid";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Variant "mo:mo-table/variant";

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

        public func startBuilding(
            campaign: Types.Campaign, 
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWhenBuilding(campaign, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func boost(
            campaign: Types.Campaign, 
            value: Nat
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWhenBoosted(campaign, value);
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
                case "_id" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a, b) = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "title" func(a, b) = 
                    Utils.order2Int(Text.compare(a.title, b.title)) * dir;
                case "state" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a.state, b.state)) * dir;
                case "result" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a.result, b.result)) * dir;
                case "total" func(a, b) = 
                    Utils.order2Int(Nat.compare(a.total, b.total)) * dir;
                case "interactions" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a.interactions, b.interactions)) * dir;
                case "boosting" func(a, b) = 
                    Utils.order2Int(Nat.compare(a.boosting, b.boosting)) * dir;
                case "createdAt" func(a, b) = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "updatedAt" func(a, b) = 
                    Utils.order2Int(Utils.compareIntOpt(a.updatedAt, b.updatedAt)) * dir;
                case "publishedAt" func(a, b) = 
                    Utils.order2Int(Utils.compareIntOpt(a.publishedAt, b.publishedAt)) * dir;
                case "expiredAt" func(a, b) = 
                    Utils.order2Int(Utils.compareIntOpt(a.expiredAt, b.expiredAt)) * dir;
                case "categoryId" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a.categoryId, b.categoryId)) * dir;
                case _ {
                    func(a, b) = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
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
            sortBy: ?[(Text, Text)],
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
            sortBy: ?[(Text, Text)],
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
            sortBy: ?[(Text, Text)],
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
            sortBy: ?[(Text, Text)],
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

        public func onVoteDeleted(
            campaign: Types.Campaign,
            vote: VoteTypes.Vote
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenVoteDeleted(campaign, vote)
            );
        };

        public func onFundingInserted(
            campaign: Types.Campaign,
            funding: FundingTypes.Funding
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenFundingInserted(campaign, funding)
            );
        };

        public func onFundingDeleted(
            campaign: Types.Campaign,
            funding: FundingTypes.Funding
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenFundingDeleted(campaign, funding)
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
            req: Types.CampaignRequest
        ): Types.CampaignInfo {
            if(req.kind == Types.KIND_SIGNATURES) {
                #signatures({
                });
            }
            else if(req.kind == Types.KIND_VOTES or
                req.kind == Types.KIND_WEIGHTED_VOTES) {
                #votes({
                    pro = 0;
                    against = 0;
                });
            }
            else if(req.kind == Types.KIND_FUNDING) {
                switch(req.info) {
                    case (#funding(info)) {
                        #funding({
                            tiers = Array.map(info.tiers, func(tier: Types.FundingTier): Types.FundingTier = {
                                title = tier.title;
                                desc = tier.desc;
                                value = tier.value;
                                max = tier.max;
                                total = 0;
                            })
                        });
                    };
                    case _ {
                        #funding({
                            tiers = [];
                        });
                    };
                };
            }
            else {
                #donations({
                });
            };
        };

        func _updateInfoEntity(
            info: Types.CampaignInfo,
            req: Types.CampaignRequest
        ): Types.CampaignInfo {
            switch(info) {
                case (#signatures(_)) {
                    #signatures({
                    });
                };
                case (#donations(_)) {
                    #donations({
                    });
                };
                case (#votes(a)) {
                    switch(req.info) {
                        case (#votes(_)) {
                            #votes(a);
                        };
                        case _ {
                            #votes({
                                pro = 0;
                                against = 0;
                            });
                        };
                    };
                };
                case (#funding(a)) {
                    switch(req.info) {
                        case (#funding(b)) {
                            if(a != b) {
                                // note: info can only be updated if campaign.total = 0, so the tiers' totals can be assumed to be 0
                                #funding({
                                    tiers = Array.map(b.tiers, func(tier: Types.FundingTier): Types.FundingTier = {
                                        title = tier.title;
                                        desc = tier.desc;
                                        value = tier.value;
                                        max = tier.max;
                                        total = 0;
                                    })
                                });
                            }
                            else {
                                #funding(a);
                            };
                        };
                        case _ {
                            #funding({
                                tiers = [];
                            });
                        };
                    };
                };
            };
        };

        func _createEntity(
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            let state = switch(req.state) { 
                case null Types.STATE_PUBLISHED;
                case (?state) state;
            };
            let now = Time.now();
            let limit = now + Int64.toInt(Int64.fromNat64(Nat64.fromNat(Nat32.toNat(req.duration) * (24 * 60 * 60 * 1000000))));

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
                state = state;
                result = Types.RESULT_NONE;
                duration = req.duration;
                tags = req.tags;
                info = _createInfoEntity(req);
                goal = req.goal;
                total = 0;
                interactions = 0;
                boosting = 0;
                updates = 0;
                action = req.action;
                publishedAt = if(state == Types.STATE_PUBLISHED) ?now else null;
                expiredAt = if(state == Types.STATE_PUBLISHED) ?limit else null;
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
                info = _updateInfoEntity(e.info, req);
                goal = req.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting;
                updates = e.updates;
                action = req.action;
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
                goal = e.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                info = e.info;
                goal = e.goal;
                total = e.total + 1;
                interactions = e.interactions + 1;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                info = e.info;
                goal = e.goal;
                total = if(e.total > 0) e.total - 1 else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else 0;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                goal = e.goal;
                total = e.total + 1;
                interactions = e.interactions + 1;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                goal = e.goal;
                total = if(e.total > 0) e.total - 1 else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else 0;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                info = e.info;
                goal = e.goal;
                total = e.total + donation.value;
                interactions = e.interactions + 1;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                info = e.info;
                goal = e.goal;
                total = e.total - donation.value;
                interactions = if(e.interactions > 0) e.interactions - 1 else 0;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            };
        };

        func _updateEntityWhenFundingInserted(
            e: Types.Campaign, 
            funding: FundingTypes.Funding
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
                    case (#funding(info)) {
                        #funding({
                            tiers = Array.mapEntries(
                                info.tiers, 
                                func (tier: Types.FundingTier, i: Nat): Types.FundingTier {
                                    if(Nat32.fromNat(i) == funding.tier) {
                                        {
                                            title = tier.title;
                                            desc = tier.desc;
                                            value = tier.value;
                                            max = tier.max;
                                            total = tier.total + funding.amount;
                                        };
                                    }
                                    else {
                                        tier;
                                    };
                                }
                            )
                        });
                    };
                    case (other) {
                        other;
                    };
                };
                goal = e.goal;
                total = e.total + funding.value;
                interactions = e.interactions + 1;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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

        func _updateEntityWhenFundingDeleted(
            e: Types.Campaign, 
            funding: FundingTypes.Funding
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
                    case (#funding(info)) {
                        #funding({
                            tiers = Array.mapEntries(
                                info.tiers, 
                                func (tier: Types.FundingTier, i: Nat): Types.FundingTier {
                                    if(Nat32.fromNat(i) == funding.tier) {
                                        {
                                            title = tier.title;
                                            desc = tier.desc;
                                            value = tier.value;
                                            max = tier.max;
                                            total = if(tier.total >= funding.amount) tier.total - funding.amount else 0;
                                        };
                                    }
                                    else {
                                        tier;
                                    };
                                }
                            )
                        });
                    };
                    case (other) {
                        other;
                    };
                };
                goal = e.goal;
                total = e.total - funding.value;
                interactions = if(e.interactions > 0) e.interactions - 1 else 0;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            };
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
                goal = e.goal;
                total = e.total;
                interactions = e.interactions + 1;
                boosting = e.boosting;
                updates = e.updates + 1;
                action = e.action;
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
                goal = e.goal;
                total = e.total;
                interactions = if(e.interactions > 0) e.interactions - 1 else 0;
                boosting = e.boosting;
                updates = if(e.updates > 0) e.updates - 1 else 0;
                action = e.action;
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
                goal = e.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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

        func _updateEntityWhenBuilding(
            e: Types.Campaign, 
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
                state = Types.STATE_BUILDING;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                info = e.info;
                goal = e.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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
                goal = e.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting;
                updates = e.updates;
                action = e.action;
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

        func _updateEntityWhenBoosted(
            e: Types.Campaign, 
            value: Nat
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
                goal = e.goal;
                total = e.total;
                interactions = e.interactions;
                boosting = e.boosting + value;
                updates = e.updates;
                action = e.action;
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
        res.put("goal", #nat(e.goal));
        res.put("total", #nat(e.total));
        res.put("interactions", #nat32(e.interactions));
        res.put("boosting", #nat(e.boosting));
        res.put("updates", #nat32(e.updates));
        
        switch(e.info) {
            case (#signatures(info)) {
            };
            case (#votes(info)) {
                res.put("info_pro", #nat(info.pro));
                res.put("info_against", #nat(info.against));
            };
            case (#funding(info)) {
                res.put("info_tiers_titles", #array(Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant = #text(l.title))));
                res.put("info_tiers_descs", #array(Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant = #text(l.desc))));
                res.put("info_tiers_values", #array(Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant = #nat(l.value))));
                res.put("info_tiers_maxes", #array(Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant = #nat32(l.max))));
                res.put("info_tiers_totals", #array(Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant = #nat32(l.total))));
            };            
            case (#donations(info)) {
            };            
        };

        switch(e.action) {
            case (#nop) {
                res.put("action_type", #nat32(Types.ACTION_NOP));
            };
            case (#transfer(action)) {
                res.put("action_type", #nat32(Types.ACTION_TRANSFER_FUNDS));
                res.put("action_receiver", #text(action.receiver));
            };
            case (#invoke(action)) {
                res.put("action_type", #nat32(Types.ACTION_INVOKE_METHOD));
                res.put("action_canisterId", #text(action.canisterId));
                res.put("action_method", #text(action.method));
                res.put("action_args", #blob(action.args));
            };            
        };

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
        let action = Variant.getOptNat32(map.get("action_type"));

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
            goal = Variant.getOptNat(map.get("goal"));
            total = Variant.getOptNat(map.get("total"));
            interactions = Variant.getOptNat32(map.get("interactions"));
            boosting = Variant.getOptNat(map.get("boosting"));
            updates = Variant.getOptNat32(map.get("updates"));
            info = if(kind == Types.KIND_SIGNATURES) {
                #signatures({
                });
            }
            else if(kind == Types.KIND_VOTES or
                    kind == Types.KIND_WEIGHTED_VOTES) {
                #votes({
                    pro = Variant.getOptNat(map.get("info_pro"));
                    against = Variant.getOptNat(map.get("info_against"));
                });
            }
            else if(kind == Types.KIND_FUNDING) {
                let titles = Array.map(Variant.getOptArray(map.get("info_tiers_titles")), Variant.getText);
                let descs = Array.map(Variant.getOptArray(map.get("info_tiers_descs")), Variant.getText);
                let values = Array.map(Variant.getOptArray(map.get("info_tiers_values")), Variant.getNat);
                let maxes = Array.map(Variant.getOptArray(map.get("info_tiers_maxes")), Variant.getNat32);
                let totals = Array.map(Variant.getOptArray(map.get("info_tiers_totals")), Variant.getNat32);

                #funding({
                    tiers = Array.mapEntries(titles, func (t: Text, i: Nat): Types.FundingTier {
                        {
                            title = titles[i];
                            desc = descs[i];
                            value = values[i];
                            max = maxes[i];
                            total = totals[i];
                        }
                    });
                });
            }
            else /*if(kind == Types.KIND_DONATIONS)*/ {
                #donations({
                });
            };
            action = if(action == Types.ACTION_TRANSFER_FUNDS) {
                #transfer({
                    receiver = Variant.getOptText(map.get("action_receiver"));
                });
            }
            else if(action == Types.ACTION_INVOKE_METHOD) {
                #invoke({
                    canisterId = Variant.getOptText(map.get("action_canisterId"));
                    method = Variant.getOptText(map.get("action_method"));
                    args = Variant.getOptBlob(map.get("action_args"));
                });
            }
            else {
                #nop;
            };
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