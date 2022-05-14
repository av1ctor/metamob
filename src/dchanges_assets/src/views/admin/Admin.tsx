import React, { useContext } from "react";
import { CategoryContext } from "../../stores/category";
import Setup from "../setup/Setup";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Admin = (props: Props) => {
    const [categoriesState, ] = useContext(CategoryContext);

    if(categoriesState.categories.length === 0) {
        return (
            <Setup 
                onSuccess={props.onSuccess}
                onError={props.onError}
            />
        );
    }    
    
    return (
        <>
            admin
        </>
    );
};

export default Admin;