import { useContext, useEffect } from "react";
import { canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { ActorContext } from "../stores/actor";
import { AuthContext } from "../stores/auth";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";
import { Principal } from "@dfinity/principal";
import { principalToAccountDefaultIdentifier } from "../libs/icp";
import { getDepositedBalance, getStakedBalance } from "../libs/dao";
import { getAccountId } from "../libs/users";
import { WalletActionType, WalletContext } from "../stores/wallet";

interface BalanceResponse {
    icp: bigint;
    mmt: bigint;
    staked: bigint;
    deposited: bigint;
}

interface WalletResponse {
    balances: BalanceResponse;
    stakeMMT: (value: bigint) => Promise<boolean>;
    unstakeMMT: (value: bigint) => Promise<boolean>;
    transferMMT: (to: string, value: bigint) => Promise<boolean>;
    approveMMT: (value: bigint) => Promise<boolean>;
    depositICP: (value: bigint) => Promise<boolean>;
}

export const useWallet = (

): WalletResponse => {
    const [auth, ] = useContext(AuthContext);
    const [wallet, disp] = useContext(WalletContext);
    const [actors, ] = useContext(ActorContext);

    const syncBalances = async (
        principal?: Principal
    ) => {
        Promise.all([
            _getIcpBalance(principal, actors.ledger),
            _getMmtBalance(principal, actors.mmt),
            getStakedBalance(actors.metamob),
            getDepositedBalance(actors.metamob),
        ]).then(res => {
            disp({
                type: WalletActionType.SET_BALANCES,
                payload: {
                    icp: res[0],
                    mmt: res[1],
                    staked: res[2],
                    deposited: res[3],
                }
            });
        }).catch(e => {
            console.error(e)
        });
    };

    const stakeMMT = async (
        value: bigint,
    ): Promise<boolean> => {
        if(!auth.principal || !actors.mmt || !actors.metamob) {
            return false;
        }
    
        const res = await actors.mmt.approve(
            Principal.fromText(metamobCanisterId), value);
        if(res && 'Err' in res) {
            throw new Error(JSON.stringify(res.Err));
        }
    
        const res2 = await actors.metamob.daoStake(value);
        if('err' in res2) {
            throw new Error(res2.err);
        }

        const staked = await getStakedBalance(actors.metamob);
        disp({
            type: WalletActionType.SET_BALANCES,
            payload: {
                icp: wallet.balances.icp,
                mmt: wallet.balances.mmt,
                staked: staked,
                deposited: wallet.balances.deposited,
            }
        });
    
        return true;
    };

    const unstakeMMT = async (
        value: bigint,
    ): Promise<boolean> => {
        if(!auth.principal || !actors.metamob) {
            return false;
        }

        const res = await actors.metamob.daoUnStake(value);
        if('err' in res) {
            throw new Error(res.err);
        }

        const staked = await getStakedBalance(actors.metamob);
        disp({
            type: WalletActionType.SET_BALANCES,
            payload: {
                icp: wallet.balances.icp,
                mmt: wallet.balances.mmt,
                staked: staked,
                deposited: wallet.balances.deposited,
            }
        });
            
        return true;
    };

    const transferMMT = async (
        to: string,
        value: bigint,
    ): Promise<boolean> => {
        if(!auth.principal || !actors.mmt) {
            return false;
        }

        const res = await actors.mmt.transfer( 
            Principal.fromText(to), value);
        if(res && 'Err' in res) {
            throw new Error(JSON.stringify(res.Err));
        }

        const mmts = await _getMmtBalance(auth.principal, actors.mmt);
        disp({
            type: WalletActionType.SET_BALANCES,
            payload: {
                icp: wallet.balances.icp,
                mmt: mmts,
                staked: wallet.balances.staked,
                deposited: wallet.balances.deposited,
            }
        });

        return true;
    };

    const approveMMT = async (
        value: bigint,
    ): Promise<boolean> => {
        if(!auth.principal || !actors.mmt) {
            return false;
        }

        const res = await actors.mmt.approve(
            Principal.fromText(metamobCanisterId), value);
        if(res && 'Err' in res) {
            throw new Error(JSON.stringify(res.Err));
        }

        return true;
    };

    const depositICP = async (
        value: bigint,
    ): Promise<boolean> => {
        if(!auth.user || !actors.ledger || !actors.metamob) {
            return false;
        }

        const to = await getAccountId(actors.metamob);
        const res = await auth.provider?.transferICP(Array.from(to), value, BigInt(auth.user._id));
        if(res?.err) {
            throw new Error(res.err);
        }

        const icps = await _getIcpBalance(auth.principal, actors.ledger);
        disp({
            type: WalletActionType.SET_BALANCES,
            payload: {
                icp: icps,
                mmt: wallet.balances.mmt,
                staked: wallet.balances.staked,
                deposited: wallet.balances.deposited,
            }
        });

        return true;
    };

    useEffect(() => {
        syncBalances(auth.principal);
    }, [auth.principal]);

    return {
        balances: {
            icp: wallet.balances.icp,
            mmt: wallet.balances.mmt,
            staked: wallet.balances.staked,
            deposited: wallet.balances.deposited
        },
        stakeMMT,
        unstakeMMT,
        transferMMT,
        approveMMT,
        depositICP,
    };
};

const _getIcpBalance = async (
    principal?: Principal,
    ledger?: Ledger
): Promise<bigint> => {
    if(!ledger || !principal) {
        return BigInt(0);
    }
    
    const res = await ledger.account_balance({
        account: Array.from(principalToAccountDefaultIdentifier(principal)) as any
    });

    return res.e8s;
};

const _getMmtBalance = async (
    principal?: Principal,
    mmt?: MMT
): Promise<bigint> => {
    if(!principal || !mmt) {
        return BigInt(0);
    }

    return await mmt.balanceOf(principal);
};





