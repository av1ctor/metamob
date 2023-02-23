import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import ExCycles "mo:base/ExperimentalCycles";
import Emailer "../../emailer/types";

module EmailerHelper {
    public type Address = Emailer.Address;
    public type Param = Emailer.Param;
    public type SendRequest = Emailer.SendRequest;

    public let TEMPLATE_VERIFY: Nat32 = 1;

    public class EmailerHelper(
        canisterId: Text,
        sender: Address
    ) {
        let emailer = actor (canisterId) : Emailer.Interface;
        var sendCost = 0;

        func _getSendCost(
        ): async* Nat {
            if(sendCost == 0) {
                sendCost := await emailer.getCost(#send);
            };
            sendCost;
        };
        
        public func send(
            to: [Address],
            templateId: Nat32,
            params: [Param]
        ): async* Result.Result<(), Text> {
            try {
                ExCycles.add(await* _getSendCost());
                await emailer.send({
                        sender = sender;
                        to = to;
                        subject = null;
                        content = #templateId(templateId);
                        params = params;
                    }, 
                    null
                );
            }
            catch(e) {
                Debug.print("emailer.send() failed: " # Error.message(e));
                #err(Error.message(e));
            };
        };
    };
};