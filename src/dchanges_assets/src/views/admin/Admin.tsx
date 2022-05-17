import React, { useContext } from "react";
import Box from "../../components/Box";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import { CategoryContext } from "../../stores/category";
import Setup from "../setup/Setup";
import Campaigns from "./campaigns/Campaigns";
import Reports from "./reports/Reports";
import Users from "./users/Users";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const Admin = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoriesState, ] = useContext(CategoryContext);

    if(!authState.user || !isModerator(authState.user)) {
        return <span>Forbidden</span>;
    }

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
            <Box>
                <Campaigns 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Box>

            <Box>
                <Reports 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Box>

            <Box>
                <Users 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Box>

        </>
    );
};

export default Admin;