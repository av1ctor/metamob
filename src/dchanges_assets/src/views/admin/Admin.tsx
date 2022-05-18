import React, { useContext } from "react";
import Box from "../../components/Box";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import { CategoryContext } from "../../stores/category";
import Setup from "./setup/Setup";
import Campaigns from "./campaigns/Campaigns";
import Reports from "./reports/Reports";
import Users from "./users/Users";
import Categories from "./categories/Categories";
import Places from "./places/Places";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
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

    const subProps = {
        onSuccess: props.onSuccess,
        onError: props.onError,
        toggleLoading: props.toggleLoading,
    }
    
    return (
        <>
            <Box>
                <Campaigns {...subProps} />
            </Box>

            <Box>
                <Reports {...subProps} />
            </Box>

            <Box>
                <Users {...subProps} />
            </Box>

            <Box>
                <Places {...subProps} />
            </Box>

            <Box>
                <Categories {...subProps} />
            </Box>

        </>
    );
};

export default Admin;