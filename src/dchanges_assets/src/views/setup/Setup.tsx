import React, {useState, useEffect, useContext, useCallback} from "react";
import {dchanges} from "../../../../declarations/dchanges";
import { Category, CategoryRequest, ProfileRequest } from "../../../../declarations/dchanges/dchanges.did";
import { AuthActionType, AuthContext } from "../../stores/auth";
import { CategoryActionType, CategoryContext } from "../../stores/category";
import AdminSetupForm from "./Admin";
import CategorySetupForm from "./Category";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Setup = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [, categoryDispatch] = useContext(CategoryContext);
    const [, setCategory] = useState<Category>({} as Category);
  
    const createUser = useCallback(async (req: ProfileRequest) => {
        try {
            const res = await dchanges.userCreate(req);
            
            if('ok' in res) {
                const user = res.ok;
                authDispatch({type: AuthActionType.SET_USER, payload: user});
                props.onSuccess('Admin created!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
    }, []);

    const createCategory = useCallback(async (req: CategoryRequest) => {
        try {
            const res = await dchanges.categoryCreate(req);
            
            if('ok' in res) {
                setCategory(res.ok);
                categoryDispatch({type: CategoryActionType.SET, payload: [res.ok]});
                props.onSuccess('Category created!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
    }, []);

    const loadCurrentUser = async () => {
        const res = await dchanges.userFindMe();
        if('ok' in res) {
            const user = res.ok;
            authDispatch({type: AuthActionType.SET_USER, payload: user});
        }
    };

    useEffect(() => {
        loadCurrentUser();    
    }, []);
  
    return (
        <div>
            <div>Setup</div>
            <div>
                {!authState.user && 
                    <div>
                        <div>Step 1</div>
                        <AdminSetupForm 
                            onCreate={createUser}
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                        />
                    </div>
                }
                {authState.user && 
                    <div>
                        <div>Step 2</div>
                        <CategorySetupForm 
                            onCreate={createCategory}
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                        />
                    </div>
                }
            </div>
        </div>
    );
};


export default Setup;