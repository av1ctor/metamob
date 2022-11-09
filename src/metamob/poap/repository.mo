import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Int32 "mo:base/Int32";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Variant "mo:mo-table/variant";
import Table "mo:mo-table/table";
import Random "../common/random";
import ULID "../common/ulid";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Types "./types";
import Schema "./schema";
import CampaignRepository "../campaigns/repository";
import ModerationTypes "../moderations/types";

module {
    public class Repository(
    ) {
        let poaps = Table.Table<Types.Poap>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("poaps")));

        public func create(
            req: Types.PoapRequest,
            canisterId: Text,
            callerId: Nat32
        ): Result.Result<Types.Poap, Text> {
            let e = _createEntity(req, canisterId, callerId);
            switch(poaps.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            poap: Types.Poap, 
            req: Types.PoapRequest,
            callerId: Nat32
        ): Result.Result<Types.Poap, Text> {
            let e = _updateEntity(poap, req, callerId);
            switch(poaps.replace(poap._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderate(
            poap: Types.Poap, 
            req: Types.PoapRequest,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Poap, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(poap, req, moderation.reason, callerId);
            }
            else {
                _updateEntityWhenModeratedAndFlagged(poap, moderation.reason, callerId);
            };

            switch(poaps.replace(poap._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Poap,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Poap, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

            switch(poaps.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };
        
        public func changeSupply(
            poap: Types.Poap, 
            by: Int32
        ): Result.Result<Types.Poap, Text> {
            let e = _updateEntityWhenSupplyChanged(poap, by);
            switch(poaps.replace(poap._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            poap: Types.Poap,
            callerId: Nat32
        ): Result.Result<(), Text> {
            switch(poaps.delete(poap._id)) {
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
        ): Result.Result<Types.Poap, Text> {
            switch(poaps.get(_id)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            return #err("Not found");
                        };
                        case (?e) {
                            return #ok(e);
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Poap, Text> {
            switch(poaps.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            return #err("Not found");
                        };
                        case (?e) {
                            return #ok(e);
                        };
                    };
                };
            };
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Poap, Types.Poap) -> Int {
            switch(column) {
                case "_id" func(a: Types.Poap, b: Types.Poap): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Poap, b: Types.Poap): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Poap, b: Types.Poap): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Poap, b: Types.Poap): Int = 0;
                };
            };
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Poap], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return poaps.find(
                criterias, 
                FilterUtils.toSortBy<Types.Poap>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Poap], Text> {
            return poaps.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Poap>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)                
            );
        };

        public func findByCampaignAndUser(
            campaignId: Nat32,
            createdBy: Nat32
        ): Result.Result<[Types.Poap], Text> {
            let criterias = [
				{
					key = "campaignId";
					op = #eq;
					value = #nat32(campaignId);
				},
				{
					key = "createdBy";
					op = #eq;
					value = #nat32(createdBy);
				}
			];
            
            return poaps.find(?criterias, null, null);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Poap], Text> {
            let criterias = [
				{
					key = "campaignId";
					op = #eq;
					value = #nat32(campaignId);
				}
			];
            
            return poaps.find(
                ?criterias,
                FilterUtils.toSortBy<Types.Poap>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return poaps.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            poaps.restore(entities);
        };

        func _createEntity(
            req: Types.PoapRequest,
            canisterId: Text,
            callerId: Nat32
        ): Types.Poap {
            {
                _id = poaps.nextId();
                pubId = ulid.next();
                state = Types.POAP_STATE_MINTING;
                canisterId = canisterId;
                campaignId = req.campaignId;
                logo = req.logo;
                name = req.name;
                symbol = req.symbol;
                width = req.width;
                height = req.height;
                price = req.price;
                totalSupply = 0;
                maxSupply = req.maxSupply;
                body = req.body;
                options = req.options;
                moderated = ModerationTypes.REASON_NONE;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Poap, 
            req: Types.PoapRequest,
            callerId: Nat32
        ): Types.Poap {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                canisterId = e.canisterId;
                campaignId = e.campaignId;
                logo = req.logo;
                name = req.name;
                symbol = req.symbol;
                width = req.width;
                height = req.height;
                price = req.price;
                totalSupply = e.totalSupply;
                maxSupply = req.maxSupply;
                body = req.body;
                options = req.options;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Poap, 
            req: Types.PoapRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Poap {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                canisterId = e.canisterId;
                campaignId = e.campaignId;
                logo = req.logo;
                name = req.name;
                symbol = req.symbol;
                width = e.width;
                height = e.height;
                price = e.price;
                totalSupply = e.totalSupply;
                maxSupply = e.maxSupply;
                body = req.body;
                options = e.options;
                moderated = e.moderated | reason;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndFlagged(
            e: Types.Poap, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Poap {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                canisterId = e.canisterId;
                campaignId = e.campaignId;
                logo = e.logo;
                name = e.name;
                symbol = e.symbol;
                width = e.width;
                height = e.height;
                price = e.price;
                totalSupply = e.totalSupply;
                maxSupply = e.maxSupply;
                body = e.body;
                options = e.options;
                moderated = e.moderated | reason;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            }  
        };

        func _updateEntityWhenSupplyChanged(
            e: Types.Poap, 
            by: Int32
        ): Types.Poap {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                canisterId = e.canisterId;
                campaignId = e.campaignId;
                logo = e.logo;
                name = e.name;
                symbol = e.symbol;
                width = e.width;
                height = e.height;
                price = e.price;
                totalSupply = Int32.toNat32(Int32.fromNat32(e.totalSupply) + by);
                maxSupply = e.maxSupply;
                body = e.body;
                options = e.options;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            }  
        };
    };

    public func serialize(
        e: Types.Poap,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("canisterId", #text(e.canisterId));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("logo", #text(e.logo));
        res.put("name", #text(e.name));
        res.put("symbol", #text(e.symbol));
        res.put("width", #nat32(e.width));
        res.put("height", #nat32(e.height));
        res.put("price", #nat64(e.price));
        res.put("totalSupply", #nat32(e.totalSupply));
        res.put("maxSupply", switch(e.maxSupply) {case null #nil; case (?maxSupply) #nat32(maxSupply);});
        res.put("body", #text(e.body));
        res.put("options", #nat32(e.options));
        res.put("moderated", #nat32(e.moderated));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Poap {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            canisterId = Variant.getOptText(map.get("canisterId"));
            campaignId = Variant.getOptNat32(map.get("campaign"));
            logo = Variant.getOptText(map.get("logo"));
            name = Variant.getOptText(map.get("name"));
            symbol = Variant.getOptText(map.get("symbol"));
            width = Variant.getOptNat32(map.get("width"));
            height = Variant.getOptNat32(map.get("height"));
            price = Variant.getOptNat64(map.get("price"));
            totalSupply = Variant.getOptNat32(map.get("totalSupply"));
            maxSupply = Variant.getOptNat32Opt(map.get("maxSupply"));
            body = Variant.getOptText(map.get("body"));
            options = Variant.getOptNat32(map.get("options"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};