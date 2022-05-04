import React, { useCallback, useContext, useEffect } from "react"
import { AuthClient } from "@dfinity/auth-client"
import { AuthActionType, AuthContext, AuthState } from "../../stores/auth";
import Button from "../../components/Button";
import Panel from "../../components/Panel";
import Grid from "../../components/Grid";

const Logon = () => {
    const [state, dispatch] = useContext<[AuthState, any]>(AuthContext);

    const init = async () => {
        const client = await AuthClient.create();
        const logged = await client.isAuthenticated()
        
        dispatch({
            type: AuthActionType.SET_CLIENT, 
            payload: client
        });

        if(logged) {
            dispatch({
                type: AuthActionType.SET_PRINCIPAL, 
                payload: client.getIdentity().getPrincipal().toText()
            });
        }
    };

    const login = useCallback(async () => {
        state.client?.login({
            identityProvider: "https://identity.ic0.app",
            onSuccess: () => {
                dispatch({
                    type: AuthActionType.SET_PRINCIPAL, 
                    payload: state.client?.getIdentity().getPrincipal().toText()
                });
            }
        });
    }, [state.client]);

    useEffect(() => {
        init();
    }, []);

    if(!state.client || state.principal !== '') {
        return null;
    }

    return (
        <div className="container has-text-centered">
            <br/>
            <Panel label="IC Identity logon">
                <Grid container>
                    <Button 
                        onClick={login}>
                        Click here to log in
                    </Button>
                </Grid>        
            </Panel>
        </div>
    );
};

export default Logon;