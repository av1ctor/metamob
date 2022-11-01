import React, {useState, useCallback, useContext} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {Filter, Order} from "../../libs/common";
import Button from "../../components/Button";
import SearchForm from "./Search";
import CreateForm from "./place/Create";
import { Sort } from "./Sort";
import { Modes } from "./Places";
import { FormattedMessage } from "react-intl";

interface Props {
    filters: Filter[];
    orderBy: Order[];
    mode: Modes;
    onSearch: (e: Filter[]) => void;
    onSort: (orderBy: Order[]) => void;
    onSwitchMode: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const Bar = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const [modals, setModals] = useState({
        create: false,
    });

    const navigate = useNavigate();
    const location = useLocation();

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=${location.pathname}`);
    }, []);

    const isLoggedIn = !!auth.user;

    return (
        <>
            <nav className="level">
                <div className="level-left">
                    <div className="level-item is-block-mobile">
                        <Sort
                            current={props.orderBy}
                            onChange={props.onSort}
                        />
                        
                        <div className="ml-1"></div>

                        <SearchForm 
                            filters={props.filters}
                            onSearch={props.onSearch} 
                            onError={props.onError}
                        />
                    </div>
                </div>
                <div className="level-right">
                    <div className="level-item">
                        <div className="mr-4">
                            <Button
                                color="info"
                                title={`Switch to ${props.mode === Modes.MAP? 'list': 'map'} view`}
                                onClick={props.onSwitchMode}
                            >
                                <i className={`la la-${props.mode === Modes.MAP? 'list': 'globe'}`} />
                            </Button>
                        </div>
                        <div className="is-flex">
                            <div className="field">
                                <div className="control">
                                    <Button
                                        title="Create a new place" 
                                        onClick={isLoggedIn? toggleCreate: redirectToLogon}
                                    >
                                        <i className="la la-plus-circle" />&nbsp;<FormattedMessage id="Create" defaultMessage="Create"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <Modal
                header={<span><FormattedMessage defaultMessage="Create place"/></span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};