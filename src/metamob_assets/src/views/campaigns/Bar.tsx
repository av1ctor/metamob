import React, {useState, useCallback, useContext} from "react";
import SearchForm from "./Search";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {CategoryContext} from "../../stores/category";
import {Filter, Order} from "../../libs/common";
import {useCreateCampaign} from "../../hooks/campaigns";
import CreateForm from "./campaign/Create";
import Button from "../../components/Button";
import { Place } from "../../../../declarations/metamob/metamob.did";
import { Sort } from "./Sort";

interface Props {
    filters: Filter[];
    orderBy: Order[];
    place?: Place;
    onSearch: (e: Filter[]) => void;
    onSort: (orderBy: Order[]) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const Bar = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);

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

    const createCampaignMut = useCreateCampaign();

    const isLoggedIn = !!authState.user;

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
                            categories={categoryState.categories}
                            onSearch={props.onSearch} 
                            onError={props.onError}
                        />
                    </div>
                </div>
                <div className="level-right">
                    <div className="level-item">
                        <div className="is-flex">
                            <div className="field">
                                <div className="control">
                                    <Button
                                        title="Create a new campaign" 
                                        onClick={isLoggedIn? toggleCreate: redirectToLogon}
                                    >
                                        <i className="la la-plus-circle" />&nbsp;Create
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <Modal
                header={<span>Create campaign</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    place={props.place}
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};