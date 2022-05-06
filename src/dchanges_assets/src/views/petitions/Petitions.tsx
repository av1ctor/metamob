import React, {useState, useCallback, useContext} from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {CategoryContext} from "../../stores/category";
import {TagContext} from "../../stores/tag";
import {Filter} from "../../interfaces/common";
import {useFindPetitions, useCreatePetition, useDeletePetition, useUpdatePetition} from "../../hooks/petitions";
import CreateForm from "./Create";
import SearchForm from "./Search";
import Item from "./Item";
import Button from "../../components/Button";

const indexedColumns = ['title'];

const orderBy = {
    key: '_id',
    dir: 'desc'
};

const limit = {
    offset: 0,
    size: 10
};

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Petitions = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);
    const [tagState, ] = useContext(TagContext);

    const [filters, setFilters] = useState<Filter>({
        key: 'title',
        op: 'contains',
        value: ''
    });
    const [modals, setModals] = useState({
        create: false,
    });

    const navigate = useNavigate();

    const queryKey = ['petitions', filters.key, filters.op, filters.value, orderBy.key, orderBy.dir];

    const petitions = useFindPetitions(queryKey, filters, orderBy, limit);
    const createPetitionMut = useCreatePetition();
    const deletePetitionMut = useDeletePetition();

    const searchPetitions = useCallback((filters: React.SetStateAction<Filter>) => {
        setFilters(filters);
    }, [filters]);

    const toggleCreate = useCallback(() => {
        setModals({
            ...modals,
            create: !modals.create
        });
    }, [modals]);

    const redirectToLogon = useCallback(() => {
        navigate('/login');
    }, []);

    const isLoggedIn = !!authState.user;

    return (
        <div className="container">
            <div>
                <div>
                    <div className="level">
                        <div className="level-left">
                            <SearchForm 
                                    filters={filters}
                                    indexedColumns={indexedColumns}
                                    onSearch={searchPetitions} 
                                />
                        </div>
                        <div className="level-right">
                            <Button onClick={isLoggedIn? toggleCreate: redirectToLogon}>Create</Button>
                        </div>
                    </div>

                    <div>
                        {petitions.status === 'loading' &&
                            <div>
                                Loading...
                            </div>
                        }

                        {petitions.status === 'error' &&
                            <div className="form-error">
                                {petitions.error.message}
                            </div>
                        }
                        
                        <div className="columns is-desktop is-multiline">
                            {petitions.status === 'success' && petitions.data && petitions.data.map((petition) => 
                                <div 
                                    className="column is-half"
                                    key={petition._id}
                                >
                                    <Item 
                                        key={petition._id} 
                                        petition={petition} />
                                </div>
                            )}
                        </div>        
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    tags={tagState.tags}
                    mutation={createPetitionMut}
                    onCancel={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Modal>

        </div>
    );
};

export default Petitions;
  