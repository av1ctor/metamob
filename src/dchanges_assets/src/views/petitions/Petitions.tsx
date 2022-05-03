import React, {useState, useCallback, useContext} from "react";
import Modal from "../../components/Modal";
import {CategoryContext} from "../../stores/category";
import {TagContext} from "../../stores/tag";
import {Filter} from "../../interfaces/common";
import {useFindPetitions, useCreatePetition, useDeletePetition, useUpdatePetition} from "../../hooks/petitions";
import CreateForm from "./Create";
import SearchForm from "./Search";
import {Header, Item} from "./Item";
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

const Petitions = () => {
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

    return (
        <div>
            <div>Petitions</div>
            <div>
                <div>
                    <div className="flex justify-between">
                        <SearchForm 
                                filters={filters}
                                indexedColumns={indexedColumns}
                                onSearch={searchPetitions} 
                            />

                        <div className="flex-initial w-40">
                            <Button onClick={toggleCreate}>+ Create</Button>
                        </div>
                    </div>

                    <div>
                        <Header />
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
                        
                        {petitions.status === 'success' && petitions.data && petitions.data.map((petition) => 
                            <Item 
                                key={petition._id} 
                                petition={petition} />
                        )}
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
                />
            </Modal>

        </div>
    );
};

export default Petitions;
  