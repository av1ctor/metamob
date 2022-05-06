import React, { useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { AuthActionType, AuthContext } from "../../stores/auth";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Header = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);

    const navigate = useNavigate();

    const redirectToLogon = useCallback(() => {
        navigate('/login');
    }, []);

    const handleLogout = useCallback(async () => {
        await authState.client?.logout();
        authDispatch({
            type: AuthActionType.LOGOUT,
            payload: undefined
        });
        props.onSuccess('Logged out!');
    }, []);

    const isLogged = !!authState.user;

    return (
        <div className="container header">
            <div className="level ml-2 mr-2">
                <div className="level-left">
                    <div>
                        <h1 className="title mb-0">
                            <Link to="/">D-Changes</Link>
                        </h1>
                        <div>
                            <small>Together we can transform the world!</small>
                        </div>
                    </div>
                </div>
                <div className="level-right">
                    <div className="has-text-centered">
                        {!isLogged && 
                            <Button 
                                title="Login"
                                onClick={redirectToLogon}
                            >
                                <i className="la la-user"/>
                            </Button>
                        }
                        {isLogged && 
                            <Button 
                                title="Logout"
                                onClick={handleLogout}
                            >
                                <i className="la la-sign-out-alt"/>
                            </Button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
