import React, {useState, useEffect, useContext} from "react";
import {dchanges} from "../../../../declarations/dchanges";
import { Category, CategoryRequest, Profile, ProfileRequest } from "../../../../declarations/dchanges/dchanges.did";
import { AuthActionType, AuthContext } from "../../stores/auth";
import { CategoryActionType, CategoryContext } from "../../stores/category";
import AdminSetupForm from "./Admin";
import CategorySetupForm from "./Category";

const Setup = () => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [, categoryDispatch] = useContext(CategoryContext);
    const [, setCategory] = useState<Category>({} as Category);
    const [error, setError] = useState('');
  
    useEffect(() => {
      (async () => {
        const res = await dchanges.userFindMe();
        if('ok' in res) {
            const user = res.ok;
            authDispatch({type: AuthActionType.SET_USER, payload: user});
        }
      })();
    }, []);
    
    async function createUser(req: ProfileRequest) {
        try {
            setError('');

            const res = await dchanges.userCreate(req);
            
            if('ok' in res) {
                const user = res.ok;
                authDispatch({type: AuthActionType.SET_USER, payload: user});
            }
            else {
                setError(res.err);
            }
        }
        catch(e: any) {
            setError(e);
        }
    };

    async function createCategory(req: CategoryRequest) {
        try {
            setError('');

            const res = await dchanges.categoryCreate(req);
            
            if('ok' in res) {
                setCategory(res.ok);
                categoryDispatch({type: CategoryActionType.SET, payload: [res.ok]});
            }
            else {
                setError(res.err);
            }
        }
        catch(e: any) {
            setError(e);
        }
    };

    return (
        <div>
            <div>Setup</div>
            <div>
                {!authState.user && 
                    <div>
                        <div>Step 1</div>
                        <AdminSetupForm 
                            onCreate={createUser}
                        />
                    </div>
                }
                {authState.user && 
                    <div>
                        <div>Step 2</div>
                        <CategorySetupForm 
                            onCreate={createCategory}
                        />
                    </div>
                }
                {error && 
                    <div className="bg-red-200">
                        {error}
                    </div>
                }
            </div>
        </div>
    );
};


export default Setup;