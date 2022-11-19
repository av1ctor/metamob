import React, { useContext } from "react";
import Box from "../../components/Box";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import Campaigns from "./campaigns/Campaigns";
import Reports from "./reports/Reports";
import Users from "./users/Users";
import Categories from "./categories/Categories";
import Places from "./places/Places";
import Poaps from "./poaps/Poaps";
import Logs from "./logs/Logs";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const Admin = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    if(!auth.user || !isModerator(auth.user)) {
        return <span>Forbidden</span>;
    }

    const subProps = {
        onSuccess: props.onSuccess,
        onError: props.onError,
        toggleLoading: props.toggleLoading,
    }
    
    return (
        <>
            <div className="page-title has-text-info-dark">
                Admin
            </div>         
            
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

            <Box>
                <Poaps {...subProps} />
            </Box>

            <Box>
                <Logs {...subProps} />
            </Box>

        </>
    );
};

export default Admin;