import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import UserService "../users/service";
import CampaignTypes "../campaigns/types";
import CampaignService "../campaigns/service";
import SignatureService "../signatures/service";
import UpdateService "../updates/service";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        signatureService: SignatureService.Service, 
        updateService: UpdateService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let userRepo = userService.getRepository();
        let signatureRepo = signatureService.getRepository();
        let updateRepo = updateService.getRepository();

        public func create(
            req: Types.ReportRequest,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(_checkEntity(req)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case _ {
                                repo.create(req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.ReportRequest,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(e)) {
                                if(not canChange(caller, e)) {
                                    return #err("Forbidden");
                                };

                                switch(_checkEntity(req)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        repo.update(e, req, caller._id);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func assign(
            id: Text, 
            toUserId: Nat32,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not UserUtils.isAdmin(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(e)) {
                                repo.assign(e, toUserId, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func close(
            id: Text, 
            req: Types.ReportCloseRequest,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not UserUtils.isAdmin(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(e)) {
                                repo.close(e, req, caller._id);
                            };
                        };
                    };
                };
            };
        };        

        public func findById(
            id: Text
        ): Result.Result<Types.Report, Text> {
            repo.findByPubId(id);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            repo.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            repo.restore(entities);
        };

        public func getRepository(
        ): Repository.Repository {
            repo;
        };

        func hasAuth(
            caller: UserTypes.Profile
        ): Bool {
            if(not caller.active) {
                return false;
            };

            if(caller.banned) {
                return false;
            };

            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            e: Types.Report
        ): Bool {
            if(caller._id == e.createdBy) {
                return true;
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };

        func _checkEntity(
            req: Types.ReportRequest
        ): Result.Result<(), Text> {
            if(req.entityType == Types.TYPE_CAMPAIGNS) {
                switch(campaignRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_USERS) {
                switch(userRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_SIGNATURES) {
                switch(signatureRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else {
                switch(updateRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            };
        };        
    };
};