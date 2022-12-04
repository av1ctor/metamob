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
import ModerationTypes "../moderations/types";

module {
    public class Repository() {
        let campaigns = Table.Table<Types.Campaign>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("campaigns")));

        let ONE_DAY: Nat = 24 * 60 * 60 * 1000_000_000;

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

        public func createWithCover(
            req: Types.CampaignRequest,
            coverId: Text,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _createEntityWithCover(req, coverId, callerId);
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

        public func updateWithCover(
            campaign: Types.Campaign, 
            req: Types.CampaignRequest,
            coverId: Text,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWithCover(campaign, req, coverId, callerId);
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

        public func moderate(
            campaign: Types.Campaign,
            req: Types.CampaignRequest, 
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(campaign, req, moderation.reason, callerId);
            } 
            else {
                _updateEntityWhenModeratedAndFlagged(campaign, moderation.reason, callerId);
            };

            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderateWithCover(
            campaign: Types.Campaign,
            req: Types.CampaignRequest, 
            coverId: Text,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedactedWithCover(campaign, req, coverId, moderation.reason, callerId);
            } 
            else {
                _updateEntityWhenModeratedAndFlagged(campaign, moderation.reason, callerId);
            };

            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Campaign,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Campaign, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

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
            switch(campaigns.delete(campaign._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    #ok();
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

                    for(crit in criterias.vals()) {
                        buf.add({
                            key = crit.0;
                            op = switch(crit.1) {
                                case "contains" #contains; 
                                case "neq" #neq;
                                case "lt" #lt;
                                case "lte" #lte;
                                case "gt" #gt;
                                case "gte" #gte;
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

                    ?Buffer.toArray(buf);
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
                }
            ];
            
            return campaigns.find(
                criterias, 
                FilterUtils.toSortBy<Types.Campaign>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findExpired(
            size: Nat
        ): Result.Result<[Types.Campaign], Text> {

            let criterias = ?[
                {
                    key = "state";
                    op = #eq;
                    value = #nat32(Types.STATE_PUBLISHED);
                },
                {       
                    key = "expiredAt";
                    op = #lte;
                    value = #int(Time.now());
                }                    
            ];
            
            return campaigns.find(
                criterias, 
                null, 
                ?{offset = 0; size = size;}
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
            funding: FundingTypes.Funding,
            valueInIcp: Nat
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenFundingInserted(campaign, funding, valueInIcp)
            );
        };

        public func onFundingDeleted(
            campaign: Types.Campaign,
            funding: FundingTypes.Funding,
            valueInIcp: Nat
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenFundingDeleted(campaign, funding, valueInIcp)
            );
        };

        public func onDonationInserted(
            campaign: Types.Campaign,
            value: Nat
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenDonationInserted(campaign, value)
            );
        };

        public func onDonationDeleted(
            campaign: Types.Campaign,
            value: Nat
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenDonationDeleted(campaign, value)
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

        public func onBoostInserted(
            campaign: Types.Campaign,
            value: Nat
        ) {
            ignore campaigns.replace(
                campaign._id, 
                _updateEntityWhenBoostInserted(campaign, value)
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
                            tiers = Array.map(info.tiers, func(tier: Types.FundingTier): Types.FundingTier = 
                            {
                                tier
                                with
                                total = Nat32.fromNat(0);
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
                                    tiers = Array.map(b.tiers, func(tier: Types.FundingTier): Types.FundingTier = 
                                    {
                                        tier
                                        with
                                        total = Nat32.fromNat(0);
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

        func _updateInfoEntityWhenModeratedAndRedacted(
            info: Types.CampaignInfo,
            req: Types.CampaignRequest
        ): Types.CampaignInfo {
            switch(info) {
                case (#funding(a)) {
                    switch(req.info) {
                        case (#funding(b)) {
                            if(a != b) {
                                #funding({
                                    tiers = Array.mapEntries(b.tiers, func(tier: Types.FundingTier, index: Nat): Types.FundingTier = 
                                    {
                                        tier
                                        with
                                        value = a.tiers[index].value;
                                        max = a.tiers[index].max;
                                        total = a.tiers[index].total;
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
                case _ {
                    info;
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
            let limit = now + Int64.toInt(Int64.fromNat64(Nat64.fromNat(Nat32.toNat(req.duration) * ONE_DAY)));

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
                moderated = ModerationTypes.REASON_NONE;
                publishedAt = if(state == Types.STATE_PUBLISHED) ?now else null;
                expiredAt = if(state == Types.STATE_PUBLISHED) ?limit else null;
                createdAt = now;
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _createEntityWithCover(
            req: Types.CampaignRequest,
            cover: Text,
            callerId: Nat32
        ): Types.Campaign {
            {
                _createEntity(req, callerId)
                with
                cover = cover;
            }
        };

        func _updateEntity(
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            {
                e
                with
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
                tags = req.tags;
                info = _updateInfoEntity(e.info, req);
                goal = req.goal;
                action = req.action;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWithCover(
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            cover: Text,
            callerId: Nat32
        ): Types.Campaign {
            {
                _updateEntity(e, req, callerId)
                with
                cover = cover;
            }
        };

        func _updateEntityWhenSignatureInserted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                e
                with
                total = e.total + 1;
                interactions = e.interactions + 1;
            }  
        };        

        func _updateEntityWhenSignatureDeleted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                e
                with
                total = if(e.total > 0) e.total - 1 else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else Nat32.fromNat(0);
            }  
        };

        func _updateEntityWhenVoteInserted(
            e: Types.Campaign, 
            vote: VoteTypes.Vote
        ): Types.Campaign {
            {
                e
                with
                info = switch(e.info) {
                    case (#votes(info)) {
                        #votes({
                            pro = if(vote.pro) info.pro + vote.weight else info.pro;
                            against = if(not vote.pro) info.against + vote.weight else info.against;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                total = e.total + vote.weight;
                interactions = e.interactions + 1;
            }  
        };   

        func _updateEntityWhenVoteDeleted(
            e: Types.Campaign, 
            vote: VoteTypes.Vote
        ): Types.Campaign {
            {
                e
                with
                info = switch(e.info) {
                    case (#votes(info)) {
                        #votes({
                            pro = if(vote.pro) (if(info.pro > vote.weight) info.pro - vote.weight else 0) else info.pro;
                            against = if(not vote.pro) (if(info.against > vote.weight) info.against - vote.weight else 0) else info.against;
                        });
                    };
                    case _ {
                        e.info;
                    };
                };
                total = if(e.total > vote.weight) e.total - vote.weight else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else Nat32.fromNat(0);
            }  
        };

        func _updateEntityWhenDonationInserted(
            e: Types.Campaign, 
            valueInIcp: Nat
        ): Types.Campaign {
            {
                e
                with
                total = e.total + valueInIcp;
                interactions = e.interactions + 1;
            }  
        };        

        func _updateEntityWhenDonationDeleted(
            e: Types.Campaign, 
            valueInIcp: Nat
        ): Types.Campaign {
            {
                e
                with
                total = if(e.total > valueInIcp) e.total - valueInIcp else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else Nat32.fromNat(0);
            };
        };

        func _updateEntityWhenFundingInserted(
            e: Types.Campaign, 
            funding: FundingTypes.Funding,
            valueInIcp: Nat
        ): Types.Campaign {
            {
                e
                with
                info = switch(e.info) {
                    case (#funding(info)) {
                        #funding({
                            tiers = Array.mapEntries(
                                info.tiers, 
                                func (tier: Types.FundingTier, i: Nat): Types.FundingTier {
                                    if(Nat32.fromNat(i) == funding.tier) {
                                        {
                                            tier
                                            with
                                            total = tier.total + Nat32.fromNat(valueInIcp);
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
                total = e.total + valueInIcp;
                interactions = e.interactions + 1;
            }  
        };        

        func _updateEntityWhenFundingDeleted(
            e: Types.Campaign, 
            funding: FundingTypes.Funding,
            valueInIcp: Nat
        ): Types.Campaign {
            {
                e
                with
                info = switch(e.info) {
                    case (#funding(info)) {
                        #funding({
                            tiers = Array.mapEntries(
                                info.tiers, 
                                func (tier: Types.FundingTier, i: Nat): Types.FundingTier {
                                    if(Nat32.fromNat(i) == funding.tier) {
                                        {
                                            tier
                                            with
                                            total = if(tier.total >= Nat32.fromNat(valueInIcp)) tier.total - Nat32.fromNat(valueInIcp) else Nat32.fromNat(0);
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
                total = if(e.total > valueInIcp) e.total - valueInIcp else 0;
                interactions = if(e.interactions > 0) e.interactions - 1 else Nat32.fromNat(0);
            };
        };

        func _updateEntityWhenUpdateInserted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                e
                with
                updates = e.updates + 1;
            }  
        };        

        func _updateEntityWhenUpdateDeleted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                e
                with
                updates = if(e.updates > 0) e.updates - Nat32.fromNat(1) else Nat32.fromNat(0);
            }  
        };           

        func _updateEntityWhenPublished(
            e: Types.Campaign, 
            callerId: Nat32
        ): Types.Campaign {
            let now = Time.now();
            let limit = now + Int64.toInt(Int64.fromNat64(Nat64.fromNat(Nat32.toNat(e.duration) * ONE_DAY)));

            {
                e
                with
                state = Types.STATE_PUBLISHED;
                publishedAt = ?now;
                expiredAt = ?limit;
            }  
        };

        func _updateEntityWhenBuilding(
            e: Types.Campaign, 
            callerId: Nat32
        ): Types.Campaign {
            {
                e
                with
                state = Types.STATE_BUILDING;
            }  
        };

        func _updateEntityWhenFinished(
            e: Types.Campaign, 
            result: Types.CampaignResult,
            callerId: Nat32
        ): Types.Campaign {
            {
                e
                with
                state = Types.STATE_FINISHED;
                result = result;
            }  
        };  

        func _updateEntityWhenBoostInserted(
            e: Types.Campaign, 
            valueInIcp: Nat
        ): Types.Campaign {
            {
                e
                with
                boosting = e.boosting + valueInIcp;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Campaign {
            {
                e
                with
                title = req.title;
                target = req.target;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                placeId = req.placeId;
                tags = req.tags;
                info = _updateInfoEntityWhenModeratedAndRedacted(e.info, req);
                moderated = e.moderated | reason;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndRedactedWithCover(
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            cover: Text,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Campaign {
            {
                _updateEntityWhenModeratedAndRedacted(e, req, reason, callerId)
                with
                cover = cover;
            }
        };

        func _updateEntityWhenModeratedAndFlagged(
            e: Types.Campaign, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Campaign {
            {
                e 
                with
                moderated = e.moderated | reason;
            }  
        };
    };

    public func serialize(
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
        res.put("moderated", #nat32(e.moderated));
        
        switch(e.info) {
            case (#signatures(info)) {
            };
            case (#votes(info)) {
                res.put("info", #map([
                    {key = "pro"; value = #nat(info.pro);},
                    {key = "against"; value = #nat(info.against);}
                ]));
            };
            case (#funding(info)) {
                res.put("info", #map([
                    {key = "tiers"; value = #array(
                        Array.map(info.tiers, func(l: Types.FundingTier): Variant.Variant {
                            #map([
                                {key = "title"; value = #text(l.title);},
                                {key = "desc"; value = #text(l.desc);},
                                {key = "currency"; value = #nat32(l.currency);},
                                {key = "value"; value = #nat(l.value);},
                                {key = "max"; value = #nat32(l.max);},
                                {key = "total"; value = #nat32(l.total);}
                            ])
                        })
                    )}
                ]));
            };            
            case (#donations(info)) {
            };            
        };

        switch(e.action) {
            case (#nop) {
                res.put("action", #map([
                    {key = "type"; value = #nat32(Types.ACTION_NOP);}
                ]));
            };
            case (#transfer(action)) {
                res.put("action", #map([
                    {key = "type"; value = #nat32(Types.ACTION_TRANSFER_FUNDS);},
                    {key = "receiver"; value = #text(action.receiver);}
                ]));
            };
            case (#invoke(action)) {
                res.put("action", #map([
                    {key = "type"; value = #nat32(Types.ACTION_INVOKE_METHOD);},
                    {key = "canisterId"; value = #text(action.canisterId);},
                    {key = "method"; value = #text(action.method);},
                    {key = "args"; value = #map(action.args);}
                ]));
            };            
        };

        res.put("publishedAt", switch(e.publishedAt) {case null #nil; case (?publishedAt) #int(publishedAt);});
        res.put("expiredAt", switch(e.expiredAt) {case null #nil; case (?expiredAt) #int(expiredAt);});
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Campaign {
        let kind: Types.CampaignKind = Variant.getOptNat32(map.get("kind"));
        let action = Variant.getOptMapAsHM(map.get("action"));
        let actionType = Variant.getOptNat32(action.get("type"));

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
            moderated = Variant.getOptNat32(map.get("moderated"));
            info = if(kind == Types.KIND_SIGNATURES) {
                #signatures({
                });
            }
            else if(kind == Types.KIND_VOTES or
                    kind == Types.KIND_WEIGHTED_VOTES) {
                let info = Variant.getOptMapAsHM(map.get("info"));
                #votes({
                    pro = Variant.getOptNat(info.get("pro"));
                    against = Variant.getOptNat(info.get("against"));
                });
            }
            else if(kind == Types.KIND_FUNDING) {
                let info = Variant.getOptMapAsHM(map.get("info"));
                let tiers = Array.map(Variant.getOptArray(info.get("tiers")), Variant.getMapAsHM);

                #funding({
                    tiers = Array.map(tiers, func (tier: HashMap.HashMap<Text, Variant.Variant>): Types.FundingTier {
                        {
                            title = Variant.getOptText(tier.get("title"));
                            desc = Variant.getOptText(tier.get("desc"));
                            value = Variant.getOptNat(tier.get("value"));
                            currency = Variant.getOptNat32(tier.get("currency"));
                            max = Variant.getOptNat32(tier.get("max"));
                            total = Variant.getOptNat32(tier.get("total"));
                        }
                    });
                });
            }
            else /*if(kind == Types.KIND_DONATIONS)*/ {
                #donations({
                });
            };
            action = if(actionType == Types.ACTION_TRANSFER_FUNDS) {
                #transfer({
                    receiver = Variant.getOptText(action.get("receiver"));
                });
            }
            else if(actionType == Types.ACTION_INVOKE_METHOD) {
                #invoke({
                    canisterId = Variant.getOptText(action.get("canisterId"));
                    method = Variant.getOptText(action.get("method"));
                    args = Variant.getOptMap(action.get("args"));
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
        }
    };
};