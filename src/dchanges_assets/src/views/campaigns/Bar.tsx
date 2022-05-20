import React, {useState, useCallback, useContext} from "react";
import SearchForm from "./Search";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {CategoryContext} from "../../stores/category";
import {Filter} from "../../libs/common";
import {useCreateCampaign} from "../../hooks/campaigns";
import CreateForm from "./campaign/Create";
import Button from "../../components/Button";

const indexedColumns = ['title'];

interface Props {
    filters: Filter[];
    onSearch: (e: Filter[]) => void;
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

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const redirectToLogon = useCallback(() => {
        navigate('/user/login');
    }, []);

    const createCampaignMut = useCreateCampaign();

    const isLoggedIn = !!authState.user;

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <SearchForm 
                        filters={props.filters}
                        categories={categoryState.categories}
                        indexedColumns={indexedColumns}
                        onSearch={props.onSearch} 
                        onError={props.onError}
                    />
                </div>
                <div className="level-right">
                    <Button 
                        onClick={isLoggedIn? toggleCreate: redirectToLogon}
                    >
                        <i className="la la-plus-circle" />&nbsp;Create
                    </Button>
                </div>
            </div>

            <Modal
                header={<span>Create campaign</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};