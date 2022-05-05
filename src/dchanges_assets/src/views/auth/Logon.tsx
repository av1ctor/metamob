import React, { useCallback, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { AuthActionType, AuthContext, AuthState } from "../../stores/auth";
import Button from "../../components/Button";
import Panel from "../../components/Panel";
import Grid from "../../components/Grid";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Logon = (props: Props) => {
    const [state, dispatch] = useContext<[AuthState, any]>(AuthContext);

    const navigate = useNavigate();
    const location = useLocation();

    const getReturnUrl = (): string => {
        let returnTo = location.search.match(/return=([^&]+)/);
        return (returnTo && returnTo[1]) || '/';
    }

    const login = useCallback(async () => {
        const width = 500;
        const height = screen.height;
        const left = ((screen.width/2)-(width/2))|0;
        const top = ((screen.height/2)-(height/2))|0; 
        
        state.client?.login({
            identityProvider: "https://identity.ic0.app",
            windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
            onSuccess: () => {
                dispatch({
                    type: AuthActionType.SET_PRINCIPAL, 
                    payload: state.client?.getIdentity().getPrincipal().toText()
                });
                props.onSuccess('User authenticated!');
                navigate(getReturnUrl());
            },
            onError: (msg: string|undefined) => {
                props.onError(msg);
            }
        });
    }, [state.client]);

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